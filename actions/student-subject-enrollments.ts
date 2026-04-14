// actions/student-subject-enrollments.ts
"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
// FIX [8]: Import SubjectEnrollmentStatus enum for type-safe status values.
import { SubjectEnrollmentStatus } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-ENROLL STUDENT IN COMPULSORY SUBJECTS
// ═══════════════════════════════════════════════════════════════════════════

export async function autoEnrollStudentInCompulsorySubjects(enrollmentId: string) {
  try {
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { stream: true },
    });

    if (!enrollment) return { ok: false, message: "Enrollment not found" };
    if (!enrollment.streamId) {
      return { ok: false, message: "Student must be assigned to a stream for subject enrollment" };
    }

    const compulsoryStreamSubjects = await db.streamSubject.findMany({
      where: {
        streamId:    enrollment.streamId,
        termId:      enrollment.termId,
        subjectType: "COMPULSORY",
      },
      include: {
        subject: {
          include: {
            papers: { where: { isActive: true }, orderBy: { paperNumber: "asc" } },
          },
        },
        subjectPaper: {
          select: { id: true, name: true, paperCode: true, paperNumber: true },
        },
        teacherAssignments: { where: { status: "ACTIVE" } },
        // FIX [1]: Removed paperTeachers include — StreamSubjectPaperTeacher model
        // has been removed from the schema. Paper-level teacher context is now
        // available via StreamSubjectTeacher.streamSubject.subjectPaper.
      },
    });

    if (compulsoryStreamSubjects.length === 0) {
      return { ok: false, message: "No compulsory subjects found for this stream" };
    }

    const result = await db.$transaction(async (tx) => {
      const subjectEnrollments = [];

      for (const streamSubject of compulsoryStreamSubjects) {
        const existingEnrollment = await tx.studentSubjectEnrollment.findFirst({
          where: { enrollmentId, streamSubjectId: streamSubject.id },
        });
        if (existingEnrollment) continue;

        const subjectEnrollment = await tx.studentSubjectEnrollment.create({
          data: {
            enrollmentId,
            streamSubjectId: streamSubject.id,
            // FIX [8]: Use enum value
            status:          SubjectEnrollmentStatus.ACTIVE,
            isCompulsory:    true,
            isAutoEnrolled:  true,
          },
        });
        subjectEnrollments.push(subjectEnrollment);
      }

      const uniqueSubjects = new Set(compulsoryStreamSubjects.map((ss) => ss.subject.id));

      return {
        subjectEnrollments,
        uniqueSubjectsCount: uniqueSubjects.size,
        totalPapersCount:    subjectEnrollments.length,
      };
    });

    revalidatePath("/dashboard/students");
    revalidatePath(`/dashboard/enrollments/${enrollmentId}`);

    return {
      ok: true,
      data: result,
      message: `Student enrolled in ${result.uniqueSubjectsCount} compulsory subject(s) (${result.totalPapersCount} total papers)`,
    };
  } catch (error: any) {
    console.error("❌ Error auto-enrolling student in subjects:", error);
    return { ok: false, message: error?.message ?? "Failed to enroll student in subjects" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENROLL STUDENT IN OPTIONAL SUBJECT
// ═══════════════════════════════════════════════════════════════════════════

export async function enrollStudentInOptionalSubject(data: {
  enrollmentId:    string;
  streamSubjectId: string;
}) {
  try {
    const { enrollmentId, streamSubjectId } = data;

    const streamSubject = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      include: {
        subject: {
          include: {
            papers: { where: { isActive: true }, orderBy: { paperNumber: "asc" } },
          },
        },
        subjectPaper: {
          select: { name: true, paperCode: true },
        },
        teacherAssignments: { where: { status: "ACTIVE" } },
        // FIX [2]: Removed paperTeachers include — model removed from schema.
      },
    });

    if (!streamSubject) return { ok: false, message: "Stream subject not found" };
    if (streamSubject.subjectType === "COMPULSORY") {
      return { ok: false, message: "Cannot manually enroll in compulsory subjects" };
    }

    const existing = await db.studentSubjectEnrollment.findFirst({
      where: { enrollmentId, streamSubjectId },
    });
    if (existing) {
      return { ok: false, message: "Student is already enrolled in this subject" };
    }

    const subjectEnrollment = await db.studentSubjectEnrollment.create({
      data: {
        enrollmentId,
        streamSubjectId,
        status:         SubjectEnrollmentStatus.ACTIVE,
        isCompulsory:   false,
        isAutoEnrolled: false,
      },
    });

    revalidatePath("/dashboard/students");
    revalidatePath(`/dashboard/enrollments/${enrollmentId}`);

    const subjectName = streamSubject.subjectPaper
      ? `${streamSubject.subject.name} (${streamSubject.subjectPaper.name})`
      : streamSubject.subject.name;

    return {
      ok:      true,
      data:    subjectEnrollment,
      message: `Student enrolled in ${subjectName} successfully`,
    };
  } catch (error: any) {
    console.error("❌ Error enrolling student in optional subject:", error);
    return { ok: false, message: error?.message ?? "Failed to enroll student" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENROLL STUDENT IN ALL PAPERS OF AN OPTIONAL SUBJECT
// ═══════════════════════════════════════════════════════════════════════════

export async function enrollStudentInAllPapersOfSubject(data: {
  enrollmentId: string;
  subjectId:    string;
  streamId:     string;
  termId:       string;
}) {
  try {
    const { enrollmentId, subjectId, streamId, termId } = data;

    const streamSubjects = await db.streamSubject.findMany({
      where: { subjectId, streamId, termId, isActive: true },
      include: {
        subject:      { select: { name: true, code: true } },
        subjectPaper: { select: { name: true, paperCode: true, paperNumber: true } },
      },
      // FIX [6]: Changed from orderBy: { subjectPaper: { paperNumber: "asc" } }.
      // subjectPaperId is nullable — ordering by an optional relation's field
      // silently excludes rows where the FK is null. createdAt is stable and safe.
      orderBy: { createdAt: "asc" },
    });

    if (streamSubjects.length === 0) {
      return { ok: false, message: "No papers found for this subject" };
    }

    const hasCompulsory = streamSubjects.some((ss) => ss.subjectType === "COMPULSORY");
    if (hasCompulsory) {
      return { ok: false, message: "Cannot manually enroll in compulsory subjects" };
    }

    const existingEnrollments = await db.studentSubjectEnrollment.findMany({
      where: {
        enrollmentId,
        streamSubjectId: { in: streamSubjects.map((ss) => ss.id) },
      },
      select: { streamSubjectId: true },
    });

    const existingIds = new Set(existingEnrollments.map((e) => e.streamSubjectId));
    const newStreamSubjects = streamSubjects.filter((ss) => !existingIds.has(ss.id));

    if (newStreamSubjects.length === 0) {
      return { ok: false, message: "Student is already enrolled in all papers of this subject" };
    }

    await db.studentSubjectEnrollment.createMany({
      data: newStreamSubjects.map((ss) => ({
        enrollmentId,
        streamSubjectId: ss.id,
        status:          SubjectEnrollmentStatus.ACTIVE,
        isCompulsory:    false,
        isAutoEnrolled:  false,
      })),
    });

    revalidatePath("/dashboard/students");
    revalidatePath(`/dashboard/enrollments/${enrollmentId}`);

    const subjectName = streamSubjects[0].subject.name;

    return {
      ok:      true,
      message: `Student enrolled in ${subjectName} (${newStreamSubjects.length} paper${newStreamSubjects.length > 1 ? "s" : ""}) successfully`,
    };
  } catch (error: any) {
    console.error("❌ Error enrolling student in all papers:", error);
    return { ok: false, message: error?.message ?? "Failed to enroll student" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BULK ENROLL STUDENTS IN SUBJECT
// ═══════════════════════════════════════════════════════════════════════════

export async function bulkEnrollStudentsInSubject(data: {
  enrollmentIds:   string[];
  streamSubjectId: string;
}) {
  try {
    const { enrollmentIds, streamSubjectId } = data;

    if (enrollmentIds.length === 0) return { ok: false, message: "No students selected" };

    const streamSubject = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      include: {
        subject: {
          include: {
            papers: { where: { isActive: true } },
          },
        },
        subjectPaper: { select: { name: true, paperCode: true } },
        teacherAssignments: { where: { status: "ACTIVE" } },
        // FIX [3]: Removed paperTeachers include — model removed from schema.
      },
    });

    if (!streamSubject) return { ok: false, message: "Stream subject not found" };

    const existingEnrollments = await db.studentSubjectEnrollment.findMany({
      where: { enrollmentId: { in: enrollmentIds }, streamSubjectId },
      select: { enrollmentId: true },
    });

    const existingEnrollmentIds = new Set(existingEnrollments.map((e) => e.enrollmentId));
    const newEnrollmentIds = enrollmentIds.filter((id) => !existingEnrollmentIds.has(id));

    if (newEnrollmentIds.length === 0) {
      return { ok: false, message: "All selected students are already enrolled in this subject" };
    }

    const result = await db.$transaction(async (tx) => {
      const subjectEnrollments = [];
      for (const enrollmentId of newEnrollmentIds) {
        const subjectEnrollment = await tx.studentSubjectEnrollment.create({
          data: {
            enrollmentId,
            streamSubjectId,
            status:         SubjectEnrollmentStatus.ACTIVE,
            isCompulsory:   streamSubject.subjectType === "COMPULSORY",
            isAutoEnrolled: false,
          },
        });
        subjectEnrollments.push(subjectEnrollment);
      }
      return { subjectEnrollments };
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/streams");

    const subjectName = streamSubject.subjectPaper
      ? `${streamSubject.subject.name} (${streamSubject.subjectPaper.name})`
      : streamSubject.subject.name;

    return {
      ok:      true,
      data:    result,
      message: `Successfully enrolled ${result.subjectEnrollments.length} student(s) in ${subjectName}`,
    };
  } catch (error: any) {
    console.error("❌ Error bulk enrolling students:", error);
    return { ok: false, message: error?.message ?? "Failed to enroll students" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UNENROLL STUDENT FROM SUBJECT
// ═══════════════════════════════════════════════════════════════════════════

export async function unenrollStudentFromSubject(subjectEnrollmentId: string) {
  try {
    const subjectEnrollment = await db.studentSubjectEnrollment.findUnique({
      where: { id: subjectEnrollmentId },
      include: {
        streamSubject: {
          include: {
            subject:      true,
            subjectPaper: { select: { name: true, paperCode: true } },
          },
        },
        _count: {
          select: {
            aoiScores: true,
            aoiUnits:  true,
            examMarks: true,
            // FIX [4]: Removed _count.marks — 'marks' is not a relation on
            // StudentSubjectEnrollment. Valid back-relations are: aoiScores,
            // aoiUnits, examMarks, paperResults. Including a non-existent
            // relation causes a Prisma runtime error.
            paperResults: true,
          },
        },
      },
    });

    if (!subjectEnrollment) return { ok: false, message: "Subject enrollment not found" };
    if (subjectEnrollment.isCompulsory) {
      return { ok: false, message: "Cannot unenroll from compulsory subjects" };
    }

    const hasAnyMarks =
      subjectEnrollment._count.aoiScores > 0 ||
      subjectEnrollment._count.aoiUnits > 0 ||
      subjectEnrollment._count.examMarks > 0 ||
      subjectEnrollment._count.paperResults > 0; // FIX [4]: removed marks check

    if (hasAnyMarks) {
      return { ok: false, message: "Cannot unenroll. Student has marks recorded for this subject." };
    }

    await db.studentSubjectEnrollment.delete({ where: { id: subjectEnrollmentId } });

    revalidatePath("/dashboard/students");

    const subjectName = subjectEnrollment.streamSubject.subjectPaper
      ? `${subjectEnrollment.streamSubject.subject.name} (${subjectEnrollment.streamSubject.subjectPaper.name})`
      : subjectEnrollment.streamSubject.subject.name;

    return { ok: true, message: `Student unenrolled from ${subjectName} successfully` };
  } catch (error: any) {
    console.error("❌ Error unenrolling student:", error);
    return { ok: false, message: error?.message ?? "Failed to unenroll student" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET STUDENT'S SUBJECT ENROLLMENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function getStudentSubjectEnrollments(enrollmentId: string) {
  try {
    const subjectEnrollments = await db.studentSubjectEnrollment.findMany({
      where: { enrollmentId },
      include: {
        streamSubject: {
          include: {
            subject: {
              include: {
                papers: { where: { isActive: true }, orderBy: { paperNumber: "asc" } },
              },
            },
            subjectPaper: {
              select: { id: true, paperNumber: true, name: true, paperCode: true },
            },
            teacherAssignments: {
              where:   { status: "ACTIVE" },
              include: {
                teacher: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
              },
            },
            // FIX [5]: Removed paperTeachers include — StreamSubjectPaperTeacher
            // model removed from schema. Teacher assignment per paper is now via
            // StreamSubjectTeacher.streamSubject.subjectPaper (paper-scoped StreamSubjects).
          },
        },
        paperResults: {
          include: {
            subjectPaper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
          },
        },
        subjectResult:    true,
        subjectFinalMark: true,
      },
      orderBy: [
        { streamSubject: { subject:      { name:        "asc" } } },
        { streamSubject: { subjectPaper: { paperNumber: "asc" } } },
      ],
    });

    return subjectEnrollments;
  } catch (error) {
    console.error("❌ Error fetching student subject enrollments:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET AVAILABLE OPTIONAL SUBJECTS FOR STUDENT
// ═══════════════════════════════════════════════════════════════════════════

export async function getAvailableOptionalSubjects(enrollmentId: string) {
  try {
    const enrollment = await db.enrollment.findUnique({
      where:   { id: enrollmentId },
      include: {
        subjectEnrollments: { select: { streamSubjectId: true } },
      },
    });

    if (!enrollment || !enrollment.streamId) return [];

    const enrolledSubjectIds = new Set(enrollment.subjectEnrollments.map((se) => se.streamSubjectId));

    const availableSubjects = await db.streamSubject.findMany({
      where: {
        streamId:    enrollment.streamId,
        termId:      enrollment.termId,
        subjectType: { in: ["OPTIONAL", "SUBSIDIARY"] },
        id:          { notIn: Array.from(enrolledSubjectIds) },
      },
      include: {
        subject: {
          include: {
            papers: { where: { isActive: true }, orderBy: { paperNumber: "asc" } },
          },
        },
        subjectPaper: {
          select: { id: true, paperNumber: true, name: true, paperCode: true },
        },
        teacherAssignments: {
          where:   { status: "ACTIVE" },
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { studentEnrollments: true } },
      },
      // FIX [7]: Changed from two-level nullable-relation orderBy.
      // Original: [{ subject: { name: "asc" } }, { subjectPaper: { paperNumber: "asc" } }]
      // subjectPaperId is nullable — ordering by its field at the top-level findMany
      // can silently exclude rows. Use subject.name only (safe, always present).
      orderBy: { subject: { name: "asc" } },
    });

    return availableSubjects;
  } catch (error) {
    console.error("❌ Error fetching available optional subjects:", error);
    return [];
  }
}