"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { UserType, EnrollmentStatus, EnrollmentType, SubjectEnrollmentStatus } from "@prisma/client";
import { enrollStudentAnnually } from "@/lib/db-helpers/annual-enrollment";

export type BulkStudentRow = {
  firstName:     string;
  lastName:      string;
  otherNames?:   string;
  admissionNo:   string;
  dob:           string; // YYYY-MM-DD
  gender:        string; // MALE | FEMALE
  nationality:   string;
  // parent — matched by phone or created fresh
  parentFirstName:  string;
  parentLastName:   string;
  parentPhone:      string;
  parentEmail?:     string;
  parentRelationship?: string;
  // enrollment
  classYearId:   string;
  streamId?:     string;
  // optional extras
  village?:      string;
  religion?:     string;
  previousSchool?: string;
  phone?:        string; // student login phone — defaults to generated
};

export type BulkImportResult = {
  ok:       boolean;
  created:  number;
  skipped:  number;
  errors:   { row: number; admissionNo: string; message: string }[];
};

export async function bulkCreateStudents(
  rows:    BulkStudentRow[],
  schoolId: string,
  userId:   string,
  slug:     string,
): Promise<BulkImportResult> {
  const result: BulkImportResult = { ok: true, created: 0, skipped: 0, errors: [] };

  // Resolve active year + term once
  const activeYear = await db.academicYear.findFirst({ where: { schoolId, isActive: true } });
  if (!activeYear) return { ok: false, created: 0, skipped: 0, errors: [{ row: 0, admissionNo: "", message: "No active academic year found." }] };

  const activeTerm = await db.academicTerm.findFirst({ where: { academicYearId: activeYear.id, isActive: true } });
  if (!activeTerm) return { ok: false, created: 0, skipped: 0, errors: [{ row: 0, admissionNo: "", message: "No active term found." }] };

  // Phone counter for auto-generated student phones
  let phoneCounter = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header row

    try {
      // Skip if admission number already exists
      const existing = await db.student.findUnique({
        where: { admissionNo_schoolId: { admissionNo: row.admissionNo, schoolId } },
      });
      if (existing) { result.skipped++; continue; }

      // Resolve or create parent
      let parent = await db.parent.findFirst({ where: { phone: row.parentPhone, schoolId } });

      if (!parent) {
        // Check if phone is taken globally
        const existingUser = await db.user.findUnique({ where: { phone: row.parentPhone } });
        if (existingUser) {
          result.errors.push({ row: rowNum, admissionNo: row.admissionNo, message: `Parent phone ${row.parentPhone} already linked to another account.` });
          continue;
        }

        const parentUser = await db.user.create({
          data: {
            name:      `${row.parentFirstName} ${row.parentLastName}`,
            firstName: row.parentFirstName,
            lastName:  row.parentLastName,
            phone:     row.parentPhone,
            email:     row.parentEmail ?? null,
            password:  await bcrypt.hash(row.parentPhone, 10),
            userType:  UserType.PARENT,
            schoolId,
            status:    true,
            isVerfied: false,
          },
        });

        parent = await db.parent.create({
          data: {
            firstName:    row.parentFirstName,
            lastName:     row.parentLastName,
            name:         `${row.parentFirstName} ${row.parentLastName}`,
            phone:        row.parentPhone,
            email:        row.parentEmail ?? null,
            relationship: row.parentRelationship ?? "Guardian",
            userId:       parentUser.id,
            schoolId,
          },
        });
      }

      // Student phone — use provided or auto-generate unique
      const studentPhone = row.phone && row.phone.trim()
        ? row.phone.trim()
        : `0${++phoneCounter}`;

      // Ensure student phone not taken
      const phoneTaken = await db.user.findUnique({ where: { phone: studentPhone } });
      if (phoneTaken) {
        result.errors.push({ row: rowNum, admissionNo: row.admissionNo, message: `Phone ${studentPhone} already in use.` });
        continue;
      }

      const fullName = [row.firstName, row.otherNames, row.lastName].filter(Boolean).join(" ");
      const hashedPw = await bcrypt.hash(row.admissionNo, 10);

      await db.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: fullName, firstName: row.firstName, lastName: row.lastName,
            phone: studentPhone, email: null, password: hashedPw,
            userType: UserType.STUDENT, loginId: row.admissionNo,
            schoolId, status: true, isVerfied: false,
          },
        });

        const student = await tx.student.create({
          data: {
            firstName: row.firstName, lastName: row.lastName, otherNames: row.otherNames,
            admissionNo: row.admissionNo,
            dob: new Date(row.dob),
            gender: row.gender.toUpperCase(),
            nationality: row.nationality || "Ugandan",
            parentId: parent!.id, schoolId,
            userId: newUser.id,
            village: row.village, religion: row.religion,
            previousSchool: row.previousSchool,
            admissionDate: new Date(),
            isActive: true,
          },
        });

        // Enrollment
        await tx.enrollment.create({
          data: {
            studentId: student.id, classYearId: row.classYearId,
            streamId: row.streamId ?? null,
            academicYearId: activeYear.id, termId: activeTerm.id,
            enrollmentType: EnrollmentType.NEW, status: EnrollmentStatus.ACTIVE,
          },
        });

        // Auto-enroll in compulsory subjects across all terms
        if (row.streamId) {
          await enrollStudentAnnually(tx, {
            studentId: student.id, streamId: row.streamId,
            classYearId: row.classYearId, academicYearId: activeYear.id,
            baseTermId: activeTerm.id,
          });
        }
      });

      result.created++;
    } catch (err: any) {
      result.errors.push({ row: rowNum, admissionNo: row.admissionNo, message: err.message ?? "Unknown error" });
    }
  }

  if (result.created > 0) revalidatePath(`/school/${slug}/users/students`);
  return result;
}
