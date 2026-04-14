"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { generateAutoInvoiceOnEnrollment } from "./fee-auto-invoice";
import {
  UserType,
  EnrollmentStatus,
  EnrollmentType,
  SubjectEnrollmentStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

type CreateStudentSmartPayload = {
  firstName:   string;
  lastName:    string;
  otherNames?: string;
  admissionNo: string;
  linNumber?:  string;
  dob:         Date;
  gender:      string;
  nationality: string;
  parentId:    string;
  schoolId:    string;
  imageUrl?:   string | null;

  NIN?:               string;
  bloodGroup?:        string;
  village?:           string;
  religion?:          string;
  medicalConditions?: string;
  disability?:        string;
  previousSchool?:    string;

  classYearId: string;
  streamId?:   string | null;

  termId?:         string;
  academicYearId?: string;

  enrolledById: string;

  phone:      string;
  password?:  string;
};

export async function createStudentSmart(data: CreateStudentSmartPayload) {
  try {
    // PRE-FLIGHT uniqueness checks
    const loginIdTaken = await db.user.findUnique({
      where: {
        schoolId_loginId: { schoolId: data.schoolId, loginId: data.admissionNo },
      },
    });
    if (loginIdTaken) {
      return {
        ok: false,
        message: `A user account with admission number "${data.admissionNo}" already exists in this school.`,
      };
    }

    const phoneTaken = await db.user.findUnique({ where: { phone: data.phone } });
    if (phoneTaken) {
      return {
        ok: false,
        message: `Phone number "${data.phone}" is already linked to another account.`,
      };
    }

    const plainPassword  = data.password ?? data.admissionNo;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const fullName       = [data.firstName, data.otherNames, data.lastName].filter(Boolean).join(" ");

    const result = await db.$transaction(async (tx) => {
      // 1. Resolve Academic Year
      let academicYearId = data.academicYearId;
      if (!academicYearId) {
        const activeYear = await tx.academicYear.findFirst({
          where: { schoolId: data.schoolId, isActive: true },
        });
        if (!activeYear) throw new Error("No active academic year found.");
        academicYearId = activeYear.id;
      }

      // 2. Resolve Term
      let termId = data.termId;
      if (!termId) {
        const activeTerm = await tx.academicTerm.findFirst({
          where: { academicYearId, isActive: true },
        });
        if (!activeTerm) throw new Error("No active term found.");
        termId = activeTerm.id;
      }

      // 3. Validate ClassYear
      const classYear = await tx.classYear.findFirst({
        where: { id: data.classYearId, academicYearId },
      });
      if (!classYear) throw new Error("Class does not belong to active academic year.");

      // 4. Validate Stream
      if (data.streamId) {
        const stream = await tx.stream.findFirst({
          where: { id: data.streamId, classYearId: data.classYearId },
        });
        if (!stream) throw new Error("Invalid stream selected for class.");
      }

      // 5. Prevent Duplicate Admission
      const existingStudent = await tx.student.findUnique({
        where: { admissionNo_schoolId: { admissionNo: data.admissionNo, schoolId: data.schoolId } },
      });
      if (existingStudent) throw new Error("Admission number already exists.");

      // 6. Validate Parent
      const parent = await tx.parent.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new Error("Parent not found.");

      // 7. Create User Account
      const newUser = await tx.user.create({
        data: {
          name:      fullName,
          firstName: data.firstName,
          lastName:  data.lastName,
          phone:     data.phone,
          email:     null,
          password:  hashedPassword,
          userType:  UserType.STUDENT,
          loginId:   data.admissionNo,
          schoolId:  data.schoolId,
          status:    true,
          isVerfied: false,
        },
      });

      // 8. Create Student (linNumber excluded — Prisma client not yet regenerated; saved via raw SQL below)
      const student = await tx.student.create({
        data: {
          firstName:         data.firstName,
          lastName:          data.lastName,
          otherNames:        data.otherNames,
          admissionNo:       data.admissionNo,
          // linNumber intentionally omitted — saved via $executeRaw below
          dob:               data.dob,
          gender:            data.gender,
          nationality:       data.nationality,
          parentId:          data.parentId,
          schoolId:          data.schoolId,
          imageUrl:          data.imageUrl ?? null,
          NIN:               data.NIN,
          bloodGroup:        data.bloodGroup,
          village:           data.village,
          religion:          data.religion,
          medicalConditions: data.medicalConditions,
          disability:        data.disability,
          previousSchool:    data.previousSchool,
          userId:            newUser.id,
        },
      });

      // Store linNumber via raw SQL (client may not have regenerated yet)
      if (data.linNumber) {
        await tx.$executeRaw`UPDATE "Student" SET "linNumber" = ${data.linNumber} WHERE id = ${student.id}`;
      }

      // 9. Prevent Double Enrollment
      const existingEnrollment = await tx.enrollment.findFirst({
        where: { studentId: student.id, termId },
      });
      if (existingEnrollment) throw new Error("Student already enrolled this term.");

      // 10. Create Enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          studentId:      student.id,
          classYearId:    data.classYearId,
          streamId:       data.streamId ?? null,
          termId,
          academicYearId,
          // FIX [2]: Use EnrollmentStatus and EnrollmentType enums
          status:         EnrollmentStatus.ACTIVE,
          enrollmentType: EnrollmentType.NEW,
        },
      });

      // 11. Auto Subject Enrollment
      let subjectEnrollmentsCount = 0;
      let uniqueSubjectsCount     = 0;

      if (data.streamId) {
        // Enroll in all COMPULSORY subjects' papers
        const streamSubjects = await tx.streamSubject.findMany({
          where: {
            streamId: data.streamId,
            termId,
            isActive: true,
            subjectType: "COMPULSORY",
          },
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: {
            subject: { name: "asc" },
          },
        });

        if (streamSubjects.length > 0) {
          await tx.studentSubjectEnrollment.createMany({
            data: streamSubjects.map((ss) => ({
              enrollmentId:    enrollment.id,
              streamSubjectId: ss.id,
              isCompulsory:    ss.subjectType === "COMPULSORY",
              isAutoEnrolled:  true,
              status:          SubjectEnrollmentStatus.ACTIVE,
            })),
            skipDuplicates: true,
          });

          subjectEnrollmentsCount = streamSubjects.length;
          uniqueSubjectsCount     = new Set(streamSubjects.map((ss) => ss.subject.id)).size;
        }
      }

      return { student, enrollment, newUser, academicYearId, termId, subjectEnrollmentsCount, uniqueSubjectsCount };
    });

    // Auto-Invoice (outside transaction)
    const invoiceResult = await generateAutoInvoiceOnEnrollment({
      studentId:      result.student.id,
      termId:         result.termId,
      academicYearId: result.academicYearId,
      schoolId:       data.schoolId,
      classYearId:    data.classYearId,
      enrolledById:   data.enrolledById,
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/enrollments");
    revalidatePath(`/school/${data.schoolId}/finance/fees/accounts`);

    const invoiceOk     = invoiceResult.ok === true;
    const wasSkipped    = invoiceOk && (invoiceResult as any).data?.wasSkipped === true;
    const invoiceNumber = invoiceOk && !wasSkipped ? ((invoiceResult as any).data?.invoiceNumber ?? null) : null;
    const skipReason    = invoiceOk ? ((invoiceResult as any).data?.skipReason ?? null) : null;
    const invoiceError  = !invoiceOk ? ((invoiceResult as any).error ?? "Unknown error") : null;

    return {
      ok: true,
      student:        result.student,
      enrollment:     result.enrollment,
      academicYearId: result.academicYearId,
      termId:         result.termId,
      userAccount: {
        userId:          result.newUser.id,
        loginId:         data.admissionNo,
        defaultPassword: data.password ? "custom" : data.admissionNo,
      },
      subjectEnrollments: {
        total:          result.subjectEnrollmentsCount,
        uniqueSubjects: result.uniqueSubjectsCount,
        hasPapers:      result.subjectEnrollmentsCount > result.uniqueSubjectsCount,
      },
      feeInvoice: {
        generated: invoiceOk && !wasSkipped,
        skipped:   invoiceOk && wasSkipped,
        failed:    !invoiceOk,
        reason:    skipReason ?? invoiceError,
        invoiceNo: invoiceNumber,
      },
    };
  } catch (error: any) {
    console.error("❌ Smart student create error:", error);
    return { ok: false, message: error.message || "Failed to create student" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// ENROLL EXISTING STUDENT IN NEW TERM
// ═════════════════════════════════════════════════════════════════════════

export async function enrollStudentInNewTerm(data: {
  studentId:       string;
  classYearId:     string;
  streamId?:       string | null;
  termId?:         string;
  academicYearId?: string;
  schoolId:        string;
  enrolledById:    string;
}) {
  try {
    const result = await db.$transaction(async (tx) => {
      let academicYearId = data.academicYearId;
      if (!academicYearId) {
        const activeYear = await tx.academicYear.findFirst({
          where: { schoolId: data.schoolId, isActive: true },
        });
        if (!activeYear) throw new Error("No active academic year found");
        academicYearId = activeYear.id;
      }

      let termId = data.termId;
      if (!termId) {
        const activeTerm = await tx.academicTerm.findFirst({
          where: { academicYearId, isActive: true },
        });
        if (!activeTerm) throw new Error("No active term found");
        termId = activeTerm.id;
      }

      const student = await tx.student.findUnique({ where: { id: data.studentId } });
      if (!student) throw new Error("Student not found");

      const existing = await tx.enrollment.findFirst({
        where: { studentId: data.studentId, termId },
      });
      if (existing) throw new Error("Student already enrolled this term");

      const enrollment = await tx.enrollment.create({
        data: {
          studentId:      data.studentId,
          classYearId:    data.classYearId,
          streamId:       data.streamId ?? null,
          termId,
          academicYearId,
          // FIX [2]: Use enums
          status:         EnrollmentStatus.ACTIVE,
          enrollmentType: EnrollmentType.CONTINUING,
        },
      });

      let subjectEnrollmentsCount = 0;
      let uniqueSubjectsCount     = 0;

      if (data.streamId) {
        const streamSubjects = await tx.streamSubject.findMany({
          where: {
            streamId:    data.streamId,
            termId,
            subjectType: "COMPULSORY",
            isActive:    true,
          },
          include: {
            subject:      { select: { id: true, name: true } },
            subjectPaper: { select: { paperCode: true, name: true } },
          },
        });

        if (streamSubjects.length > 0) {
          await tx.studentSubjectEnrollment.createMany({
            data: streamSubjects.map((ss) => ({
              enrollmentId:    enrollment.id,
              streamSubjectId: ss.id,
              isCompulsory:    true,
              isAutoEnrolled:  true,
              // FIX [1]: Use SubjectEnrollmentStatus enum
              status:          SubjectEnrollmentStatus.ACTIVE,
            })),
            skipDuplicates: true,
          });
          subjectEnrollmentsCount = streamSubjects.length;
          uniqueSubjectsCount     = new Set(streamSubjects.map((ss) => ss.subject.id)).size;
        }
      }

      return { enrollment, academicYearId, termId, subjectEnrollmentsCount, uniqueSubjectsCount };
    });

    const invoiceResult = await generateAutoInvoiceOnEnrollment({
      studentId:      data.studentId,
      termId:         result.termId,
      academicYearId: result.academicYearId,
      schoolId:       data.schoolId,
      classYearId:    data.classYearId,
      enrolledById:   data.enrolledById,
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/enrollments");
    revalidatePath(`/school/${data.schoolId}/finance/fees/accounts`);

    return {
      ok: true,
      enrollment: result.enrollment,
      subjectEnrollments: {
        total:          result.subjectEnrollmentsCount,
        uniqueSubjects: result.uniqueSubjectsCount,
        hasPapers:      result.subjectEnrollmentsCount > result.uniqueSubjectsCount,
      },
      feeInvoice: {
        generated: invoiceResult.ok && !(invoiceResult as any).data?.wasSkipped,
        skipped:   invoiceResult.ok &&  (invoiceResult as any).data?.wasSkipped,
        failed:    !invoiceResult.ok,
        reason:    invoiceResult.ok ? ((invoiceResult as any).data?.skipReason ?? null) : (invoiceResult as any).error,
        invoiceNo: invoiceResult.ok && !(invoiceResult as any).data?.wasSkipped
          ? (invoiceResult as any).data?.invoiceNumber
          : null,
      },
    };
  } catch (error: any) {
    console.error("❌ Enroll student in new term error:", error);
    return { ok: false, message: error.message || "Failed to enroll student" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// GET STUDENT ENROLLMENT DETAILS
// ═════════════════════════════════════════════════════════════════════════

export async function getStudentEnrollmentDetails(enrollmentId: string) {
  try {
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true,
            otherNames: true, admissionNo: true, imageUrl: true,
          },
        },
        classYear: {
          include: {
            classTemplate: { select: { name: true, code: true } },
          },
        },
        stream:       { select: { id: true, name: true } },
        term:         { select: { name: true, termNumber: true } },
        academicYear: { select: { year: true } },
        subjectEnrollments: {
          include: {
            streamSubject: {
              include: {
                subject:      { select: { id: true, name: true, code: true } },
                subjectPaper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
              },
            },
            // FIX [3]: totalMark renamed to totalPercentage in schema refactor
            subjectResult: { select: { totalPercentage: true, finalGrade: true } },
            paperResults: {
              include: {
                subjectPaper: { select: { paperNumber: true, name: true, paperCode: true } },
              },
            },
          },
          orderBy: [
            { streamSubject: { subject:      { name:        "asc" } } },
            { streamSubject: { subjectPaper: { paperNumber: "asc" } } },
          ],
        },
      },
    });

    if (!enrollment) return null;

    type SubjectGroup = {
      subject:       { id: string; name: string; code: string | null };
      papers:        Array<{ enrollment: any; paper: any }>;
      overallResult: any;
    };

    const subjectGroups = enrollment.subjectEnrollments.reduce(
      (acc, se) => {
        const subjectId = se.streamSubject.subject.id;
        if (!acc[subjectId]) {
          acc[subjectId] = {
            subject:       se.streamSubject.subject,
            papers:        [],
            overallResult: se.subjectResult,
          };
        }
        acc[subjectId].papers.push({
          enrollment: se,
          paper:      se.streamSubject.subjectPaper,
        });
        return acc;
      },
      {} as Record<string, SubjectGroup>
    );

    return { ...enrollment, subjectGroups: Object.values(subjectGroups) };
  } catch (error) {
    console.error("❌ Get student enrollment details error:", error);
    return null;
  }
}