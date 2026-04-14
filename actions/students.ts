"use server";

import { db }                    from "@/prisma/db";
import { revalidatePath }        from "next/cache";
import bcrypt                    from "bcryptjs";
import {
  EnrollmentStatus,
  EnrollmentType,
  SubjectEnrollmentStatus,
}                                from "@prisma/client";
import { enrollStudentAnnually } from "@/lib/db-helpers/annual-enrollment";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type UpdateStudentPayload = {
  studentId:  string;
  schoolId:   string;

  firstName:   string;
  lastName:    string;
  otherNames?: string;
  dob:         Date;
  gender:      string;
  nationality: string;
  parentId:    string;
  imageUrl?:   string | null;

  NIN?:               string;
  bloodGroup?:        string;
  village?:           string;
  religion?:          string;
  medicalConditions?: string;
  disability?:        string;
  previousSchool?:    string;
};

export type TransferStreamPayload = {
  enrollmentId:    string;
  studentId:       string;
  newStreamId:     string;
  newClassYearId?: string;
  schoolId:        string;
  transferredById: string;
  reason?:         string;
};

export type PromoteStudentPayload = {
  studentId:         string;
  fromEnrollmentId:  string;
  toClassYearId:     string;
  toStreamId?:       string | null;
  toTermId?:         string;
  toAcademicYearId?: string;
  schoolId:          string;
  promotedById:      string;
};

// ════════════════════════════════════════════════════════════════════════════
// GET ALL STUDENTS (with active enrollment)
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentsWithEnrollment(schoolId: string) {
  try {
    const students = await db.student.findMany({
      where: { schoolId },
      include: {
        parent: {
          select: { id: true, name: true, phone: true, email: true },
        },
        user: {
          select: { id: true, loginId: true, status: true, lastLoginAt: true },
        },
        enrollments: {
          where:   { status: EnrollmentStatus.ACTIVE },
          orderBy: { createdAt: "desc" },
          take:    1,
          include: {
            classYear: {
              include: {
                classTemplate: { select: { name: true, code: true } },
              },
            },
            stream:       { select: { id: true, name: true } },
            term:         { select: { id: true, name: true, termNumber: true } },
            academicYear: { select: { id: true, year: true } },
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return { ok: true, students };
  } catch (error: any) {
    console.error("❌ getStudentsWithEnrollment error:", error);
    return { ok: false, message: error.message || "Failed to fetch students", students: [] };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET SINGLE STUDENT (full profile)
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentById(studentId: string, schoolId: string) {
  try {
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        parent: {
          select: {
            id: true, name: true, phone: true, email: true,
            address: true, occupation: true, relationship: true,
          },
        },
        user: {
          select: {
            id: true, loginId: true, email: true, phone: true,
            status: true, lastLoginAt: true, isVerfied: true,
            failedLoginAttempts: true, lockedUntil: true,
          },
        },
        enrollments: {
          orderBy: { createdAt: "desc" },
          include: {
            classYear: {
              include: {
                classTemplate: { select: { name: true, code: true, level: true } },
              },
            },
            stream:       { select: { id: true, name: true } },
            term:         { select: { id: true, name: true, termNumber: true } },
            academicYear: { select: { id: true, year: true } },
            promotedFrom: {
              select: {
                id: true, classYearId: true, streamId: true,
                classYear: { include: { classTemplate: { select: { name: true } } } },
                stream:    { select: { name: true } },
              },
            },
            promotedTo: {
              select: {
                id: true, classYearId: true, streamId: true,
                classYear: { include: { classTemplate: { select: { name: true } } } },
                stream:    { select: { name: true } },
              },
            },
            subjectEnrollments: {
              include: {
                streamSubject: {
                  include: {
                    subject:      { select: { id: true, name: true, code: true } },
                    subjectPaper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
                  },
                },
                subjectResult: {
                  select: { totalPercentage: true, finalGrade: true, gradeDescriptor: true },
                },
                aoiScores:    { orderBy: { enteredAt: "desc" }, take: 5 },
                aoiUnits:     { orderBy: { unitNumber: "asc" } },
                examMarks:    { orderBy: { enteredAt: "desc" }, take: 10 },
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
        },
      },
    });

    if (!student) return { ok: false, message: "Student not found", student: null };

    return { ok: true, student };
  } catch (error: any) {
    console.error("❌ getStudentById error:", error);
    return { ok: false, message: error.message || "Failed to fetch student", student: null };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE STUDENT
// ════════════════════════════════════════════════════════════════════════════

export async function updateStudent(data: UpdateStudentPayload) {
  try {
    const existing = await db.student.findFirst({
      where:  { id: data.studentId, schoolId: data.schoolId },
      select: { id: true, userId: true, firstName: true, lastName: true, imageUrl: true },
    });
    if (!existing) throw new Error("Student not found.");

    const parent = await db.parent.findFirst({
      where: { id: data.parentId, schoolId: data.schoolId },
    });
    if (!parent) throw new Error("Parent not found.");

    const student = await db.student.update({
      where: { id: data.studentId },
      data: {
        firstName:         data.firstName,
        lastName:          data.lastName,
        otherNames:        data.otherNames ?? null,
        dob:               data.dob,
        gender:            data.gender,
        nationality:       data.nationality,
        parentId:          data.parentId,
        imageUrl:          data.imageUrl ?? null,
        NIN:               data.NIN ?? null,
        bloodGroup:        data.bloodGroup ?? null,
        village:           data.village ?? null,
        religion:          data.religion ?? null,
        medicalConditions: data.medicalConditions ?? null,
        disability:        data.disability ?? null,
        previousSchool:    data.previousSchool ?? null,
      },
    });

    if (existing.userId) {
      await db.user.update({
        where: { id: existing.userId },
        data: {
          name:      `${data.firstName} ${data.lastName}`,
          firstName: data.firstName,
          lastName:  data.lastName,
          image:     data.imageUrl ?? null,
        },
      });
    }

    revalidatePath(`/school/${data.schoolId}/users/students`);

    return { ok: true, student };
  } catch (error: any) {
    console.error("❌ updateStudent error:", error);
    return { ok: false, message: error.message || "Failed to update student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE STUDENT
// ════════════════════════════════════════════════════════════════════════════

export async function deleteStudent(data: {
  studentId: string;
  schoolId:  string;
}) {
  try {
    const student = await db.student.findFirst({
      where:  { id: data.studentId, schoolId: data.schoolId },
      select: { id: true, userId: true, admissionNo: true, firstName: true, lastName: true },
    });
    if (!student) throw new Error("Student not found.");

    await db.$transaction(async (tx) => {
      await tx.student.delete({ where: { id: data.studentId } });
      if (student.userId) {
        await tx.user.delete({ where: { id: student.userId } });
      }
    });

    revalidatePath(`/school/${data.schoolId}/users/students`);
    revalidatePath(`/school/${data.schoolId}/finance/fees/accounts`);

    return {
      ok:          true,
      admissionNo: student.admissionNo,
      name:        `${student.firstName} ${student.lastName}`,
    };
  } catch (error: any) {
    console.error("❌ deleteStudent error:", error);
    return { ok: false, message: error.message || "Failed to delete student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TOGGLE STUDENT STATUS
// ════════════════════════════════════════════════════════════════════════════

export async function toggleStudentStatus(data: {
  studentId: string;
  schoolId:  string;
  active:    boolean;
}) {
  try {
    const student = await db.student.findFirst({
      where:  { id: data.studentId, schoolId: data.schoolId },
      select: { id: true, userId: true },
    });
    if (!student) throw new Error("Student not found.");

    await db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: data.studentId },
        data:  { isActive: data.active },
      });
      if (student.userId) {
        await tx.user.update({
          where: { id: student.userId },
          data:  { status: data.active },
        });
      }
    });

    revalidatePath(`/school/${data.schoolId}/users/students`);

    return { ok: true, active: data.active };
  } catch (error: any) {
    console.error("❌ toggleStudentStatus error:", error);
    return { ok: false, message: error.message || "Failed to update student status" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TRANSFER STUDENT TO DIFFERENT STREAM (within same term)
// ════════════════════════════════════════════════════════════════════════════

export async function transferStudentStream(data: TransferStreamPayload) {
  try {
    return await db.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findFirst({
        where:  { id: data.enrollmentId, studentId: data.studentId },
        select: {
          id: true, termId: true, academicYearId: true,
          classYearId: true, streamId: true, status: true,
        },
      });
      if (!enrollment) throw new Error("Enrollment not found.");
      // FIX [5]: Use enum — EnrollmentStatus.ACTIVE
      if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new Error("Can only transfer from an active enrollment.");
      }

      const newStream = await tx.stream.findFirst({
        where: {
          id:          data.newStreamId,
          classYearId: data.newClassYearId ?? enrollment.classYearId,
        },
      });
      if (!newStream) throw new Error("Target stream not found.");

      const targetClassYearId = data.newClassYearId ?? enrollment.classYearId;

      // FIX [5]: Use EnrollmentStatus enum
      await tx.enrollment.update({
        where: { id: data.enrollmentId },
        data:  { status: EnrollmentStatus.TRANSFERRED },
      });

      const newEnrollment = await tx.enrollment.create({
        data: {
          studentId:      data.studentId,
          classYearId:    targetClassYearId,
          streamId:       data.newStreamId,
          termId:         enrollment.termId,
          academicYearId: enrollment.academicYearId,
          status:         EnrollmentStatus.ACTIVE,
          enrollmentType: EnrollmentType.TRANSFER,
          promotedFromId: data.enrollmentId,
        },
      });

      let subjectCount = 0;

      const streamSubjects = await tx.streamSubject.findMany({
        where: {
          streamId:    data.newStreamId,
          termId:      enrollment.termId,
          subjectType: "COMPULSORY",
          isActive:    true,
        },
        select: { id: true },
      });

      if (streamSubjects.length > 0) {
        await tx.studentSubjectEnrollment.createMany({
          data: streamSubjects.map((ss) => ({
            enrollmentId:    newEnrollment.id,
            streamSubjectId: ss.id,
            isCompulsory:    true,
            isAutoEnrolled:  true,
            // FIX [5]: Use SubjectEnrollmentStatus enum
            status:          SubjectEnrollmentStatus.ACTIVE,
          })),
          skipDuplicates: true,
        });
        subjectCount = streamSubjects.length;
      }

      revalidatePath(`/school/${data.schoolId}/users/students`);

      return { ok: true, newEnrollment, subjectsEnrolled: subjectCount };
    });
  } catch (error: any) {
    console.error("❌ transferStudentStream error:", error);
    return { ok: false, message: error.message || "Failed to transfer student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PROMOTE STUDENT TO NEXT CLASS / YEAR
// ════════════════════════════════════════════════════════════════════════════

export async function promoteStudent(data: PromoteStudentPayload) {
  try {
    return await db.$transaction(async (tx) => {
      let toAcademicYearId = data.toAcademicYearId;
      if (!toAcademicYearId) {
        const activeYear = await tx.academicYear.findFirst({
          where: { schoolId: data.schoolId, isActive: true },
        });
        if (!activeYear) throw new Error("No active academic year found.");
        toAcademicYearId = activeYear.id;
      }

      let toTermId = data.toTermId;
      if (!toTermId) {
        const activeTerm = await tx.academicTerm.findFirst({
          where: { academicYearId: toAcademicYearId, isActive: true },
        });
        if (!activeTerm) throw new Error("No active term found.");
        toTermId = activeTerm.id;
      }

      const fromEnrollment = await tx.enrollment.findFirst({
        where:  { id: data.fromEnrollmentId, studentId: data.studentId },
        select: { id: true, status: true, classYearId: true },
      });
      if (!fromEnrollment) throw new Error("Source enrollment not found.");
      // FIX [6]: Use EnrollmentStatus enum
      if (fromEnrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new Error("Can only promote from an active enrollment.");
      }

      const toClassYear = await tx.classYear.findFirst({
        where: { id: data.toClassYearId, academicYearId: toAcademicYearId },
      });
      if (!toClassYear) throw new Error("Target class not found in the active academic year.");

      if (data.toStreamId) {
        const toStream = await tx.stream.findFirst({
          where: { id: data.toStreamId, classYearId: data.toClassYearId },
        });
        if (!toStream) throw new Error("Target stream does not belong to the target class.");
      }

      const existingNewEnrollment = await tx.enrollment.findFirst({
        where: { studentId: data.studentId, termId: toTermId, status: EnrollmentStatus.ACTIVE },
      });
      if (existingNewEnrollment) {
        throw new Error("Student already has an active enrollment in the target term.");
      }

      // FIX [6]: Use EnrollmentStatus enum
      await tx.enrollment.update({
        where: { id: data.fromEnrollmentId },
        data:  { status: EnrollmentStatus.COMPLETED },
      });

      const newEnrollment = await tx.enrollment.create({
        data: {
          studentId:      data.studentId,
          classYearId:    data.toClassYearId,
          streamId:       data.toStreamId ?? null,
          termId:         toTermId,
          academicYearId: toAcademicYearId,
          status:         EnrollmentStatus.ACTIVE,
          enrollmentType: EnrollmentType.PROMOTED,
          promotedFromId: data.fromEnrollmentId,
        },
      });

      let subjectCount = 0;

      if (data.toStreamId) {
        // Enroll in compulsory subjects for ALL terms in the target academic year
        subjectCount = await enrollStudentAnnually(tx, {
          studentId:      data.studentId,
          streamId:       data.toStreamId,
          classYearId:    data.toClassYearId,
          academicYearId: toAcademicYearId,
          baseTermId:     toTermId,
        });
      }

      revalidatePath(`/school/${data.schoolId}/users/students`);
      revalidatePath(`/school/${data.schoolId}/users/students/${data.studentId}`);

      return {
        ok: true, newEnrollment,
        fromEnrollmentId: data.fromEnrollmentId,
        subjectsEnrolled: subjectCount,
      };
    });
  } catch (error: any) {
    console.error("❌ promoteStudent error:", error);
    return { ok: false, message: error.message || "Failed to promote student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// RESET STUDENT PASSWORD
// ════════════════════════════════════════════════════════════════════════════

export async function resetStudentPassword(data: {
  studentId:   string;
  newPassword: string;
  schoolId:    string;
}) {
  try {
    const student = await db.student.findFirst({
      where:  { id: data.studentId, schoolId: data.schoolId },
      select: { id: true, userId: true, admissionNo: true },
    });

    if (!student)        throw new Error("Student not found.");
    if (!student.userId) throw new Error("Student has no user account.");

    const hashed = await bcrypt.hash(data.newPassword, 10);

    await db.user.update({
      where: { id: student.userId },
      data:  { password: hashed, failedLoginAttempts: 0, lockedUntil: null },
    });

    return { ok: true, admissionNo: student.admissionNo };
  } catch (error: any) {
    console.error("❌ resetStudentPassword error:", error);
    return { ok: false, message: error.message || "Failed to reset password" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE STUDENT LOGIN CONTACT
// ════════════════════════════════════════════════════════════════════════════

export async function updateStudentLoginContact(data: {
  studentId: string;
  schoolId:  string;
  phone?:    string;
  email?:    string;
}) {
  try {
    const student = await db.student.findFirst({
      where:  { id: data.studentId, schoolId: data.schoolId },
      select: { id: true, userId: true },
    });

    if (!student)        throw new Error("Student not found.");
    if (!student.userId) throw new Error("Student has no user account.");

    if (data.phone) {
      const phoneConflict = await db.user.findFirst({
        where: { phone: data.phone, NOT: { id: student.userId } },
      });
      if (phoneConflict) throw new Error(`Phone ${data.phone} is already in use.`);
    }

    if (data.email) {
      const emailConflict = await db.user.findFirst({
        where: { email: data.email, NOT: { id: student.userId } },
      });
      if (emailConflict) throw new Error(`Email ${data.email} is already in use.`);
    }

    await db.user.update({
      where: { id: student.userId },
      data: {
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email ?? null } : {}),
      },
    });

    revalidatePath(`/school/${data.schoolId}/users/students`);

    return { ok: true };
  } catch (error: any) {
    console.error("❌ updateStudentLoginContact error:", error);
    return { ok: false, message: error.message || "Failed to update contact" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// WITHDRAW STUDENT
// ════════════════════════════════════════════════════════════════════════════

export async function withdrawStudent(data: {
  enrollmentId: string;
  studentId:    string;
  schoolId:     string;
  reason?:      string;
}) {
  try {
    const enrollment = await db.enrollment.findFirst({
      where: {
        id:        data.enrollmentId,
        studentId: data.studentId,
        student:   { schoolId: data.schoolId },
        status:    EnrollmentStatus.ACTIVE,
      },
    });
    if (!enrollment) throw new Error("Active enrollment not found.");

    await db.enrollment.update({
      where: { id: data.enrollmentId },
      data:  { status: EnrollmentStatus.DROPPED },
    });

    await db.student.update({
      where: { id: data.studentId },
      data:  { isActive: false },
    });

    revalidatePath(`/school/${data.schoolId}/users/students`);
    revalidatePath(`/school/${data.schoolId}/users/students/${data.studentId}`);

    return { ok: true };
  } catch (error: any) {
    console.error("❌ withdrawStudent error:", error);
    return { ok: false, message: error.message || "Failed to withdraw student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET A-LEVEL SUBJECTS FOR REGISTRATION (no termId needed — uses isActive)
// Used when adding a new student to pick their subject combination
// ════════════════════════════════════════════════════════════════════════════

// ── Internal helper: ensure General Paper is in the returned subject list ──
// If GP exists as a school subject but wasn't added to the stream, inject it.
async function injectGPIfMissing(
  subjects: Array<{
    id: string; name: string; code: string | null;
    aLevelCategory: "MAJOR" | "SUBSIDIARY" | null;
    subjectLevel: string; isGeneralPaper: boolean;
  }>,
  schoolId: string,
) {
  const alreadyHasGP = subjects.some(
    s => s.isGeneralPaper || /general\s*paper/i.test(s.name),
  );
  if (alreadyHasGP) {
    // Ensure the flag is set even if it was detected by name
    for (const s of subjects) {
      if (!s.isGeneralPaper && /general\s*paper/i.test(s.name)) {
        s.isGeneralPaper = true;
      }
    }
    return subjects;
  }

  // Search school-level subjects for GP
  const gpSubject = await db.subject.findFirst({
    where: {
      schoolId,
      OR: [
        { isGeneralPaper: true },
        { name: { contains: "General Paper", mode: "insensitive" } },
      ],
    },
    select: {
      id: true, name: true, code: true,
      aLevelCategory: true, subjectLevel: true, isGeneralPaper: true,
    },
  });

  if (gpSubject) {
    subjects.push({
      id:             gpSubject.id,
      name:           gpSubject.name,
      code:           gpSubject.code,
      aLevelCategory: "SUBSIDIARY",
      subjectLevel:   gpSubject.subjectLevel,
      isGeneralPaper: true,
    });
  }

  return subjects;
}

export async function getALevelSubjectsForRegistration(streamId: string) {
  try {
    const stream = await db.stream.findUnique({
      where:  { id: streamId },
      select: { schoolId: true },
    });

    const streamSubjects = await db.streamSubject.findMany({
      where:  { streamId, isActive: true },
      select: {
        subjectId: true,
        subject: {
          select: {
            id: true, name: true, code: true,
            aLevelCategory: true, subjectLevel: true, isGeneralPaper: true,
          },
        },
      },
      orderBy: { subject: { name: "asc" } },
    });

    const seen = new Set<string>();
    const subjects = streamSubjects
      .filter(ss => {
        if (seen.has(ss.subjectId)) return false;
        seen.add(ss.subjectId);
        return true;
      })
      .map(ss => ({
        id:             ss.subject.id,
        name:           ss.subject.name,
        code:           ss.subject.code,
        aLevelCategory: ss.subject.aLevelCategory as "MAJOR" | "SUBSIDIARY" | null,
        subjectLevel:   ss.subject.subjectLevel,
        isGeneralPaper: ss.subject.isGeneralPaper,
      }));

    // Inject GP from school subjects if not already in stream
    if (stream?.schoolId) {
      await injectGPIfMissing(subjects, stream.schoolId);
    }

    return { ok: true as const, data: subjects };
  } catch (error) {
    console.error("getALevelSubjectsForRegistration error:", error);
    return { ok: false as const, data: [], message: "Failed to load subjects" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET A-LEVEL SUBJECTS FOR A STREAM + TERM (for subject selection on enroll)
// Returns distinct subjects grouped with their category (MAJOR/SUBSIDIARY)
// ════════════════════════════════════════════════════════════════════════════

export async function getALevelSubjectsForStream(streamId: string, termId: string) {
  try {
    const stream = await db.stream.findUnique({
      where:  { id: streamId },
      select: { schoolId: true },
    });

    const streamSubjects = await db.streamSubject.findMany({
      where:  { streamId, termId, isActive: true },
      select: {
        subjectId: true,
        subject: {
          select: {
            id: true, name: true, code: true,
            aLevelCategory: true, subjectLevel: true, isGeneralPaper: true,
          },
        },
      },
      orderBy: { subject: { name: "asc" } },
    });

    // Deduplicate by subjectId (multiple papers per subject)
    const seen = new Set<string>();
    const subjects = streamSubjects
      .filter(ss => {
        if (seen.has(ss.subjectId)) return false;
        seen.add(ss.subjectId);
        return true;
      })
      .map(ss => ({
        id:             ss.subject.id,
        name:           ss.subject.name,
        code:           ss.subject.code,
        aLevelCategory: ss.subject.aLevelCategory as "MAJOR" | "SUBSIDIARY" | null,
        subjectLevel:   ss.subject.subjectLevel,
        isGeneralPaper: ss.subject.isGeneralPaper,
      }));

    // Inject GP from school subjects if not already in stream
    if (stream?.schoolId) {
      await injectGPIfMissing(subjects, stream.schoolId);
    }

    return { ok: true as const, data: subjects };
  } catch (error) {
    console.error("getALevelSubjectsForStream error:", error);
    return { ok: false as const, data: [], message: "Failed to load subjects" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPER — auto-create StreamSubject for General Paper if missing
// Called inside a transaction before creating StudentSubjectEnrollment rows.
// Returns the StreamSubject IDs created (or already existing).
// ════════════════════════════════════════════════════════════════════════════

export async function ensureGPStreamSubjects(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  streamId:    string,
  classYearId: string,
  termId:      string,
  schoolId:    string,
): Promise<string[]> {
  // 1. Find GP subject in school
  const gpSubject = await tx.subject.findFirst({
    where: {
      schoolId,
      OR: [
        { isGeneralPaper: true },
        { name: { contains: "General Paper", mode: "insensitive" } },
      ],
    },
    include: {
      papers: { where: { isActive: true }, orderBy: { paperNumber: "asc" } },
    },
  });
  if (!gpSubject) return [];

  // 2. Already in stream? Return existing IDs.
  const existing = await tx.streamSubject.findMany({
    where:  { streamId, termId, subjectId: gpSubject.id },
    select: { id: true },
  });
  if (existing.length > 0) return existing.map(e => e.id);

  // 3. Find or create ClassSubject (subject-in-classYear record)
  let classSubject = await tx.classSubject.findUnique({
    where:  { classYearId_subjectId: { classYearId, subjectId: gpSubject.id } },
    select: { id: true },
  });
  if (!classSubject) {
    classSubject = await tx.classSubject.create({
      data:   { classYearId, subjectId: gpSubject.id, subjectType: "SUBSIDIARY" },
      select: { id: true },
    });
  }

  // 4. Create StreamSubject rows (one per paper, or one paperless row)
  const newIds: string[] = [];
  const papers = gpSubject.papers;

  if (papers.length > 0) {
    for (const paper of papers) {
      const ss = await tx.streamSubject.create({
        data: {
          streamId,
          subjectId:      gpSubject.id,
          classSubjectId: classSubject.id,
          termId,
          subjectType:    "SUBSIDIARY",
          subjectPaperId: paper.id,
          isActive:       true,
        },
        select: { id: true },
      });
      newIds.push(ss.id);
    }
  } else {
    // Subject has no papers — one row with null subjectPaperId
    const ss = await tx.streamSubject.create({
      data: {
        streamId,
        subjectId:      gpSubject.id,
        classSubjectId: classSubject.id,
        termId,
        subjectType:    "SUBSIDIARY",
        subjectPaperId: null,
        isActive:       true,
      },
      select: { id: true },
    });
    newIds.push(ss.id);
  }

  return newIds;
}

// ════════════════════════════════════════════════════════════════════════════
// ENROLL A-LEVEL STUDENT WITH SUBJECT SELECTION
// Wraps enrollStudent but enrols in specific selected subjects' papers
// ════════════════════════════════════════════════════════════════════════════

export async function enrollALevelStudent(data: {
  studentId:          string;
  classYearId:        string;
  streamId?:          string | null;
  academicYearId:     string;
  termId:             string;
  enrollmentType:     EnrollmentType;
  schoolId:           string;
  enrolledById:       string;
  selectedSubjectIds: string[];  // subject IDs (not streamSubject IDs)
}) {
  try {
    return await db.$transaction(async (tx) => {
      const student = await tx.student.findFirst({
        where: { id: data.studentId, schoolId: data.schoolId, isActive: true },
      });
      if (!student) return { ok: false as const, message: "Student not found or inactive." };

      const classYear = await tx.classYear.findFirst({
        where: { id: data.classYearId, academicYearId: data.academicYearId },
      });
      if (!classYear) return { ok: false as const, message: "Class not found in this academic year." };

      const term = await tx.academicTerm.findFirst({
        where: { id: data.termId, academicYearId: data.academicYearId },
      });
      if (!term) return { ok: false as const, message: "Term not found in this academic year." };

      if (data.streamId) {
        const stream = await tx.stream.findFirst({ where: { id: data.streamId, classYearId: data.classYearId } });
        if (!stream) return { ok: false as const, message: "Stream not found in this class." };
      }

      const existing = await tx.enrollment.findFirst({
        where: { studentId: data.studentId, termId: data.termId },
      });
      if (existing) return { ok: false as const, message: `Student is already enrolled in ${term.name}.` };

      const enrollment = await tx.enrollment.create({
        data: {
          studentId:      data.studentId,
          classYearId:    data.classYearId,
          streamId:       data.streamId ?? null,
          academicYearId: data.academicYearId,
          termId:         data.termId,
          enrollmentType: data.enrollmentType,
          status:         EnrollmentStatus.ACTIVE,
        },
      });

      if (data.streamId && data.selectedSubjectIds.length > 0) {
        // Auto-create GP StreamSubject if GP isn't already in the stream
        await ensureGPStreamSubjects(
          tx, data.streamId, data.classYearId, data.termId, data.schoolId,
        );

        // Find all StreamSubjects for the selected subjects (all papers) + GP
        const streamSubjects = await tx.streamSubject.findMany({
          where: {
            streamId: data.streamId,
            termId:   data.termId,
            isActive: true,
            OR: [
              { subjectId: { in: data.selectedSubjectIds } },
              { subject:   { isGeneralPaper: true } },
              { subject:   { name: { contains: "General Paper", mode: "insensitive" } } },
            ],
          },
          select: {
            id: true,
            subject: { select: { isGeneralPaper: true, name: true } },
          },
        });
        if (streamSubjects.length > 0) {
          await tx.studentSubjectEnrollment.createMany({
            data: streamSubjects.map((ss) => {
              const isGP = ss.subject.isGeneralPaper ||
                /general\s*paper/i.test(ss.subject.name);
              return {
                enrollmentId:    enrollment.id,
                streamSubjectId: ss.id,
                status:          SubjectEnrollmentStatus.ACTIVE,
                isCompulsory:    isGP,
                isAutoEnrolled:  isGP,
              };
            }),
            skipDuplicates: true,
          });
        }
      }

      revalidatePath("/school");
      return {
        ok:      true as const,
        message: `Student enrolled in ${term.name} with ${data.selectedSubjectIds.length} subject(s).`,
        data:    { enrollmentId: enrollment.id },
      };
    });
  } catch (error) {
    console.error("enrollALevelStudent error:", error);
    return { ok: false as const, message: "Failed to enroll student. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET TERMS BY ACADEMIC YEAR
// ════════════════════════════════════════════════════════════════════════════

export async function getTermsByAcademicYear(academicYearId: string) {
  try {
    const terms = await db.academicTerm.findMany({
      where:   { academicYearId },
      select:  {
        id: true, name: true, termNumber: true,
        isActive: true, startDate: true, endDate: true,
      },
      orderBy: { termNumber: "asc" },
    });
    return { ok: true as const, data: terms };
  } catch (error) {
    console.error("getTermsByAcademicYear error:", error);
    return { ok: false as const, data: [], message: "Failed to fetch terms" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STREAMS BY CLASS YEAR
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamsByClassYear(classYearId: string) {
  try {
    const streams = await db.stream.findMany({
      where:   { classYearId },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return { ok: true as const, data: streams };
  } catch (error) {
    console.error("getStreamsByClassYear error:", error);
    return { ok: false as const, data: [], message: "Failed to fetch streams" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ENROLL STUDENT IN A TERM
// ════════════════════════════════════════════════════════════════════════════

export async function enrollStudent(data: {
  studentId:      string;
  classYearId:    string;
  streamId?:      string | null;
  academicYearId: string;
  termId:         string;
  // FIX [7]: Typed as the enum rather than a loose union string
  enrollmentType: EnrollmentType;
  schoolId:       string;
  enrolledById:   string;
}) {
  try {
    return await db.$transaction(async (tx) => {
      const student = await tx.student.findFirst({
        where: { id: data.studentId, schoolId: data.schoolId, isActive: true },
      });
      if (!student) return { ok: false as const, message: "Student not found or inactive." };

      const classYear = await tx.classYear.findFirst({
        where: { id: data.classYearId, academicYearId: data.academicYearId },
      });
      if (!classYear) return { ok: false as const, message: "Class not found in this academic year." };

      const term = await tx.academicTerm.findFirst({
        where: { id: data.termId, academicYearId: data.academicYearId },
      });
      if (!term) return { ok: false as const, message: "Term not found in this academic year." };

      if (data.streamId) {
        const stream = await tx.stream.findFirst({
          where: { id: data.streamId, classYearId: data.classYearId },
        });
        if (!stream) return { ok: false as const, message: "Stream not found in this class." };
      }

      const existing = await tx.enrollment.findFirst({
        where: { studentId: data.studentId, termId: data.termId },
      });
      if (existing) {
        return { ok: false as const, message: `Student is already enrolled in ${term.name}.` };
      }

      const enrollment = await tx.enrollment.create({
        data: {
          studentId:      data.studentId,
          classYearId:    data.classYearId,
          streamId:       data.streamId ?? null,
          academicYearId: data.academicYearId,
          termId:         data.termId,
          enrollmentType: data.enrollmentType,
          status:         EnrollmentStatus.ACTIVE,
        },
      });

      if (data.streamId) {
        const streamSubjects = await tx.streamSubject.findMany({
          where: {
            streamId:    data.streamId,
            termId:      data.termId,
            isActive:    true,
            subjectType: "COMPULSORY",
          },
          select: { id: true },
        });
        if (streamSubjects.length > 0) {
          await tx.studentSubjectEnrollment.createMany({
            data: streamSubjects.map((ss) => ({
              enrollmentId:    enrollment.id,
              streamSubjectId: ss.id,
              status:          SubjectEnrollmentStatus.ACTIVE,
              isCompulsory:    true,
              isAutoEnrolled:  true,
            })),
            skipDuplicates: true,
          });
        }
      }

      revalidatePath("/school");

      return {
        ok:      true as const,
        message: `Student enrolled in ${term.name} successfully.`,
        data:    { enrollmentId: enrollment.id },
      };
    });
  } catch (error) {
    console.error("enrollStudent error:", error);
    return { ok: false as const, message: "Failed to enroll student. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TRANSFER STUDENT TO A DIFFERENT STREAM
// ════════════════════════════════════════════════════════════════════════════

export async function transferStudentToStream(data: {
  enrollmentId: string;
  newStreamId:  string;
  schoolId:     string;
  reason?:      string;
}) {
  try {
    return await db.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findUnique({
        where:   { id: data.enrollmentId },
        include: { stream: { select: { id: true, name: true } } },
      });

      if (!enrollment) return { ok: false as const, message: "Enrollment not found." };
      // FIX [8]: Use EnrollmentStatus enum
      if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        return { ok: false as const, message: "Only active enrollments can be transferred." };
      }

      const newStream = await tx.stream.findFirst({
        where: { id: data.newStreamId, classYearId: enrollment.classYearId },
      });
      if (!newStream) return { ok: false as const, message: "Target stream not found in this class." };

      if (enrollment.streamId === data.newStreamId) {
        return { ok: false as const, message: "Student is already in this stream." };
      }

      // FIX [8]: Use SubjectEnrollmentStatus enum
      await tx.studentSubjectEnrollment.updateMany({
        where: { enrollmentId: data.enrollmentId, status: SubjectEnrollmentStatus.ACTIVE },
        data:  { status: SubjectEnrollmentStatus.DROPPED },
      });

      await tx.enrollment.update({
        where: { id: data.enrollmentId },
        data:  { streamId: data.newStreamId },
      });

      const streamSubjects = await tx.streamSubject.findMany({
        where: {
          streamId:    data.newStreamId,
          termId:      enrollment.termId,
          isActive:    true,
          subjectType: "COMPULSORY",
        },
        select: { id: true },
      });

      if (streamSubjects.length > 0) {
        await tx.studentSubjectEnrollment.createMany({
          data: streamSubjects.map((ss) => ({
            enrollmentId:    data.enrollmentId,
            streamSubjectId: ss.id,
            status:          SubjectEnrollmentStatus.ACTIVE,
            isCompulsory:    true,
            isAutoEnrolled:  true,
          })),
          skipDuplicates: true,
        });
      }

      revalidatePath("/school");

      return {
        ok:      true as const,
        message: `Student transferred to ${newStream.name} successfully.`,
        data:    { newStreamId: data.newStreamId, newStreamName: newStream.name },
      };
    });
  } catch (error) {
    console.error("transferStudentToStream error:", error);
    return { ok: false as const, message: "Failed to transfer student. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE STUDENT SUBJECT ENROLLMENTS (change/re-enroll subjects)
// ════════════════════════════════════════════════════════════════════════════

export async function updateStudentSubjectEnrollments(data: {
  enrollmentId: string;
  newSubjectIds: string[];   // Subject IDs the student should be enrolled in
  schoolId:     string;
}) {
  try {
    return await db.$transaction(async (tx) => {
      // 1. Load enrollment + current subject enrollments + their marks
      const enrollment = await tx.enrollment.findUnique({
        where:   { id: data.enrollmentId },
        include: {
          stream: { select: { id: true, schoolId: true } },
          subjectEnrollments: {
            include: {
              streamSubject: {
                select: {
                  id: true, subjectId: true,
                  subject: { select: { id: true, name: true, isGeneralPaper: true } },
                },
              },
              examMarks:  { select: { id: true, status: true }, take: 1 },
              aoiScores:  { select: { id: true },               take: 1 },
              aoiUnits:   { select: { id: true },               take: 1 },
            },
          },
        },
      });

      if (!enrollment) return { ok: false as const, message: "Enrollment not found." };
      if (enrollment.status !== EnrollmentStatus.ACTIVE)
        return { ok: false as const, message: "Only active enrollments can be updated." };
      if (!enrollment.streamId)
        return { ok: false as const, message: "This enrollment has no stream — subject changes are not applicable." };
      if (enrollment.stream?.schoolId !== data.schoolId)
        return { ok: false as const, message: "Unauthorized." };

      // 2. Ensure GP has StreamSubject records in this stream (creates them if missing).
      await ensureGPStreamSubjects(
        tx,
        enrollment.streamId!,
        enrollment.classYearId,
        enrollment.termId,
        data.schoolId,
      );

      // 3. Build set of StreamSubject IDs for subjects that should be enrolled.
      //    Always force-include General Paper (by flag or name).
      const targetStreamSubjects = await tx.streamSubject.findMany({
        where: {
          streamId: enrollment.streamId,
          termId:   enrollment.termId,
          isActive: true,
          OR: [
            { subjectId: { in: data.newSubjectIds } },
            { subject: { isGeneralPaper: true } },
            { subject: { name: { contains: "General Paper", mode: "insensitive" } } },
          ],
        },
        select: {
          id: true, subjectId: true,
          subject: { select: { isGeneralPaper: true, name: true } },
        },
      });

      const targetStreamSubjectIds = new Set(targetStreamSubjects.map(ss => ss.id));

      // 3. Partition current enrollments into keep / drop
      const toDropIds:    string[] = [];
      const lockedNames:  string[] = [];

      for (const se of enrollment.subjectEnrollments) {
        const ssId = se.streamSubjectId;
        if (targetStreamSubjectIds.has(ssId)) continue; // still selected — keep

        // GP is non-removable
        const isGP = se.streamSubject.subject.isGeneralPaper ||
          /general\s*paper/i.test(se.streamSubject.subject.name);
        if (isGP) continue;

        // Block removal if marks exist
        const hasMarks = (se.examMarks?.length ?? 0) > 0 ||
                         (se.aoiScores?.length ?? 0)  > 0 ||
                         (se.aoiUnits?.length  ?? 0)  > 0;
        if (hasMarks) {
          lockedNames.push(se.streamSubject.subject.name);
          continue;
        }

        toDropIds.push(se.id);
      }

      if (lockedNames.length > 0) {
        return {
          ok:      false as const,
          message: `Cannot remove subjects with marks already entered: ${lockedNames.join(", ")}. Please contact the marks administrator.`,
        };
      }

      // 4. Drop deselected subjects (soft-delete via DROPPED status)
      if (toDropIds.length > 0) {
        await tx.studentSubjectEnrollment.updateMany({
          where: { id: { in: toDropIds } },
          data:  { status: SubjectEnrollmentStatus.DROPPED },
        });
      }

      // 5. Add newly selected subjects not already enrolled (any status)
      const existingStreamSubjectIds = new Set(
        enrollment.subjectEnrollments.map(se => se.streamSubjectId)
      );
      const toAdd = targetStreamSubjects.filter(ss => !existingStreamSubjectIds.has(ss.id));

      if (toAdd.length > 0) {
        await tx.studentSubjectEnrollment.createMany({
          data: toAdd.map(ss => {
            const isGP = ss.subject.isGeneralPaper ||
              /general\s*paper/i.test(ss.subject.name);
            return {
              enrollmentId:    data.enrollmentId,
              streamSubjectId: ss.id,
              status:          SubjectEnrollmentStatus.ACTIVE,
              isCompulsory:    isGP,
              isAutoEnrolled:  isGP,
            };
          }),
          skipDuplicates: true,
        });
      }

      // 6. Re-activate any previously DROPPED subjects that are re-selected
      const droppedToReactivate = enrollment.subjectEnrollments.filter(
        se => se.status === SubjectEnrollmentStatus.DROPPED && targetStreamSubjectIds.has(se.streamSubjectId)
      );
      if (droppedToReactivate.length > 0) {
        await tx.studentSubjectEnrollment.updateMany({
          where: { id: { in: droppedToReactivate.map(se => se.id) } },
          data:  { status: SubjectEnrollmentStatus.ACTIVE },
        });
      }

      revalidatePath("/school");
      return {
        ok:      true  as const,
        message: `Subject enrollment updated. Added ${toAdd.length}, removed ${toDropIds.length}.`,
      };
    });
  } catch (error) {
    console.error("updateStudentSubjectEnrollments error:", error);
    return { ok: false as const, message: "Failed to update subjects. Please try again." };
  }
}