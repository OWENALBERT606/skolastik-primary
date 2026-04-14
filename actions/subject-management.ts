// actions/subject-management.ts
"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
// FIX [3,4,5]: Import enums for type-safe status values.
// Using plain string literals ('ACTIVE') compiles but loses enum exhaustiveness checks.
import {
  AssignmentStatus,
  SubjectEnrollmentStatus,
} from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// ENROLL STUDENTS IN SUBJECT (FROM STREAM)
// ════════════════════════════════════════════════════════════════════════════

export async function enrollStudentsInSubject(data: {
  streamSubjectId: string;
  enrollmentIds: string[];
  isCompulsory?: boolean;
  schoolId: string;
}) {
  try {
    const { streamSubjectId, enrollmentIds, isCompulsory = false } = data;

    if (enrollmentIds.length === 0) {
      return { ok: false, message: "No students selected" };
    }

    const streamSubject = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      include: {
        subject: { select: { name: true } },
        subjectPaper: { select: { name: true, paperCode: true } },
      },
    });

    if (!streamSubject) {
      return { ok: false, message: "Subject not found" };
    }

    const existing = await db.studentSubjectEnrollment.findMany({
      where: { streamSubjectId, enrollmentId: { in: enrollmentIds } },
      select: {
        enrollmentId: true,
        enrollment: {
          select: { student: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (existing.length > 0) {
      const names = existing
        .map((e) => `${e.enrollment.student.firstName} ${e.enrollment.student.lastName}`)
        .join(", ");
      return { ok: false, message: `Already enrolled: ${names}` };
    }

    await db.studentSubjectEnrollment.createMany({
      data: enrollmentIds.map((enrollmentId) => ({
        enrollmentId,
        streamSubjectId,
        // FIX [5]: Use enum value — SubjectEnrollmentStatus.ACTIVE
        status: SubjectEnrollmentStatus.ACTIVE,
        isCompulsory,
        isAutoEnrolled: false,
      })),
      skipDuplicates: true,
    });

    revalidatePath(`/school/[slug]/academics/streams`);

    const subjectName = streamSubject.subjectPaper
      ? `${streamSubject.subject.name} (${streamSubject.subjectPaper.name})`
      : streamSubject.subject.name;

    return {
      ok: true,
      message: `Successfully enrolled ${enrollmentIds.length} student(s) in ${subjectName}`,
    };
  } catch (error) {
    console.error("Enroll students in subject error:", error);
    return { ok: false, message: "Failed to enroll students" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BULK ENROLL STUDENTS IN ALL PAPERS OF A SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function enrollStudentsInAllPapers(data: {
  subjectId: string;
  streamId: string;
  termId: string;
  enrollmentIds: string[];
  isCompulsory?: boolean;
  schoolId: string;
}) {
  try {
    const { subjectId, streamId, termId, enrollmentIds, isCompulsory = false } = data;

    if (enrollmentIds.length === 0) {
      return { ok: false, message: "No students selected" };
    }

    const streamSubjects = await db.streamSubject.findMany({
      where: { subjectId, streamId, termId, isActive: true },
      include: {
        subject: { select: { name: true, code: true } },
        subjectPaper: { select: { name: true, paperCode: true, paperNumber: true } },
      },
      // FIX [1]: Changed from `orderBy: { subjectPaper: { paperNumber: "asc" } }`.
      // subjectPaperId is nullable — ordering by an optional relation field in Prisma
      // silently excludes rows where the FK is null. Using createdAt is stable and safe.
      orderBy: { createdAt: "asc" },
    });

    if (streamSubjects.length === 0) {
      return { ok: false, message: "No papers found for this subject" };
    }

    const enrollmentData = streamSubjects.flatMap((streamSubject) =>
      enrollmentIds.map((enrollmentId) => ({
        enrollmentId,
        streamSubjectId: streamSubject.id,
        // FIX [5]: Use enum value
        status: SubjectEnrollmentStatus.ACTIVE,
        isCompulsory,
        isAutoEnrolled: false,
      }))
    );

    await db.studentSubjectEnrollment.createMany({
      data: enrollmentData,
      skipDuplicates: true,
    });

    revalidatePath(`/school/[slug]/academics/streams`);

    const subject = streamSubjects[0].subject;
    const paperCount = streamSubjects.length;

    return {
      ok: true,
      message: `Successfully enrolled ${enrollmentIds.length} student(s) in ${subject.name} (${paperCount} paper${paperCount > 1 ? "s" : ""})`,
    };
  } catch (error) {
    console.error("Enroll students in all papers error:", error);
    return { ok: false, message: "Failed to enroll students" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UNENROLL STUDENTS FROM SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function unenrollStudentsFromSubject(data: {
  studentSubjectEnrollmentIds: string[];
  schoolId: string;
}) {
  try {
    const { studentSubjectEnrollmentIds } = data;

    if (studentSubjectEnrollmentIds.length === 0) {
      return { ok: false, message: "No students selected" };
    }

    const enrollments = await db.studentSubjectEnrollment.findMany({
      where: { id: { in: studentSubjectEnrollmentIds } },
      include: {
        _count: {
          select: {
            aoiScores: true,
            aoiUnits: true,
            examMarks: true,
            // FIX [2]: Removed _count.marks — 'marks' is not a relation on
            // StudentSubjectEnrollment. Valid relations are: aoiScores, aoiUnits,
            // examMarks, paperResults. Including a non-existent relation causes a
            // Prisma runtime error.
            paperResults: true,
          },
        },
        enrollment: {
          include: {
            student: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const withMarks = enrollments.filter(
      (e) =>
        e._count.aoiScores > 0 ||
        e._count.aoiUnits > 0 ||
        e._count.examMarks > 0 ||
        e._count.paperResults > 0
    );

    if (withMarks.length > 0) {
      const names = withMarks
        .map((e) => `${e.enrollment.student.firstName} ${e.enrollment.student.lastName}`)
        .join(", ");
      return { ok: false, message: `Cannot unenroll students with marks: ${names}` };
    }

    await db.studentSubjectEnrollment.deleteMany({
      where: { id: { in: studentSubjectEnrollmentIds } },
    });

    revalidatePath(`/school/[slug]/academics/streams`);

    return {
      ok: true,
      message: `Successfully unenrolled ${studentSubjectEnrollmentIds.length} student(s)`,
    };
  } catch (error) {
    console.error("Unenroll students error:", error);
    return { ok: false, message: "Failed to unenroll students" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE SUBJECT ENROLLMENT STATUS
// ════════════════════════════════════════════════════════════════════════════

export async function updateSubjectEnrollmentStatus(data: {
  studentSubjectEnrollmentId: string;
  status: SubjectEnrollmentStatus;
  schoolId: string;
}) {
  try {
    const { studentSubjectEnrollmentId, status } = data;

    await db.studentSubjectEnrollment.update({
      where: { id: studentSubjectEnrollmentId },
      data: { status },
    });

    revalidatePath(`/school/[slug]/academics/streams`);

    return { ok: true, message: `Status updated to ${status}` };
  } catch (error) {
    console.error("Update subject enrollment status error:", error);
    return { ok: false, message: "Failed to update status" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET UNENROLLED STUDENTS FOR SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function getUnenrolledStudentsForSubject(data: {
  streamSubjectId: string;
  schoolId: string;
}) {
  try {
    const { streamSubjectId } = data;

    const streamSubject = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      select: { streamId: true, termId: true },
    });
    if (!streamSubject) return [];

    const allEnrollments = await db.enrollment.findMany({
      where: {
        streamId: streamSubject.streamId,
        termId: streamSubject.termId,
        status: "ACTIVE",
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true, gender: true },
        },
        subjectEnrollments: {
          where: { streamSubjectId },
          select: { id: true },
        },
      },
    });

    return allEnrollments.filter((e) => e.subjectEnrollments.length === 0);
  } catch (error) {
    console.error("Get unenrolled students error:", error);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET UNENROLLED STUDENTS FOR ALL PAPERS OF A SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function getUnenrolledStudentsForAllPapers(data: {
  subjectId: string;
  streamId: string;
  termId: string;
  schoolId: string;
}) {
  try {
    const { subjectId, streamId, termId } = data;

    const streamSubjects = await db.streamSubject.findMany({
      where: { subjectId, streamId, termId, isActive: true },
      select: { id: true },
    });
    if (streamSubjects.length === 0) return [];

    const streamSubjectIds = streamSubjects.map((ss) => ss.id);

    const allEnrollments = await db.enrollment.findMany({
      where: { streamId, termId, status: "ACTIVE" },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true, gender: true },
        },
        subjectEnrollments: {
          where: { streamSubjectId: { in: streamSubjectIds } },
          select: { id: true, streamSubjectId: true },
        },
      },
    });

    return allEnrollments.filter((e) => e.subjectEnrollments.length === 0);
  } catch (error) {
    console.error("Get unenrolled students for all papers error:", error);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ASSIGN TEACHER TO SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function assignTeacherToStreamSubject(data: {
  streamSubjectId: string;
  teacherId: string;
  role?: string;
  schoolId: string;
}) {
  try {
    const { streamSubjectId, teacherId, role = "TEACHER" } = data;

    const existing = await db.streamSubjectTeacher.findUnique({
      where: { streamSubjectId_teacherId: { streamSubjectId, teacherId } },
    });

    if (existing) {
      return { ok: false, message: "Teacher already assigned to this subject" };
    }

    await db.streamSubjectTeacher.create({
      data: {
        streamSubjectId,
        teacherId,
        role,
        // FIX [3]: Use AssignmentStatus enum value instead of plain string 'ACTIVE'
        status: AssignmentStatus.ACTIVE,
      },
    });

    revalidatePath(`/school/[slug]/academics/streams`);

    return { ok: true, message: "Teacher assigned successfully" };
  } catch (error) {
    console.error("Assign teacher error:", error);
    return { ok: false, message: "Failed to assign teacher" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// REMOVE TEACHER FROM SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function removeTeacherFromStreamSubject(data: {
  assignmentId: string;
  schoolId: string;
}) {
  try {
    const { assignmentId } = data;

    await db.streamSubjectTeacher.delete({ where: { id: assignmentId } });

    revalidatePath(`/school/[slug]/academics/streams`);

    return { ok: true, message: "Teacher removed successfully" };
  } catch (error) {
    console.error("Remove teacher error:", error);
    return { ok: false, message: "Failed to remove teacher" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET AVAILABLE TEACHERS FOR ASSIGNMENT
// ════════════════════════════════════════════════════════════════════════════

export async function getAvailableTeachersForSubject(data: {
  streamSubjectId: string;
  schoolId: string;
}) {
  try {
    const { streamSubjectId, schoolId } = data;

    const assigned = await db.streamSubjectTeacher.findMany({
      where: {
        streamSubjectId,
        // FIX [4]: Use AssignmentStatus enum value
        status: AssignmentStatus.ACTIVE,
      },
      select: { teacherId: true },
    });

    const assignedIds = assigned.map((a) => a.teacherId);

    const teachers = await db.teacher.findMany({
      where: {
        schoolId,
        currentStatus: "ACTIVE",
        id: { notIn: assignedIds },
      },
      select: {
        id: true, firstName: true, lastName: true,
        staffNo: true, email: true, phone: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return teachers;
  } catch (error) {
    console.error("Get available teachers error:", error);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BULK UPDATE SUBJECT TYPE (COMPULSORY/OPTIONAL)
// ════════════════════════════════════════════════════════════════════════════

export async function bulkUpdateSubjectEnrollmentType(data: {
  studentSubjectEnrollmentIds: string[];
  isCompulsory: boolean;
  schoolId: string;
}) {
  try {
    const { studentSubjectEnrollmentIds, isCompulsory } = data;

    await db.studentSubjectEnrollment.updateMany({
      where: { id: { in: studentSubjectEnrollmentIds } },
      data: { isCompulsory },
    });

    revalidatePath(`/school/[slug]/academics/streams`);

    return {
      ok: true,
      message: `Updated ${studentSubjectEnrollmentIds.length} enrollment(s)`,
    };
  } catch (error) {
    console.error("Bulk update error:", error);
    return { ok: false, message: "Failed to update enrollments" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET SUBJECT ENROLLMENT STATISTICS
// ════════════════════════════════════════════════════════════════════════════

export async function getSubjectEnrollmentStats(data: {
  streamSubjectId: string;
  schoolId: string;
}) {
  try {
    const { streamSubjectId } = data;

    const enrollments = await db.studentSubjectEnrollment.findMany({
      where: { streamSubjectId },
      include: {
        _count: {
          select: {
            aoiScores: true,
            aoiUnits: true,
            examMarks: true,
            paperResults: true,
          },
        },
      },
    });

    const total     = enrollments.length;
    const active    = enrollments.filter((e) => e.status === "ACTIVE").length;
    const dropped   = enrollments.filter((e) => e.status === "DROPPED").length;
    const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
    const compulsory = enrollments.filter((e) => e.isCompulsory).length;
    const optional   = enrollments.filter((e) => !e.isCompulsory).length;

    const withAOI     = enrollments.filter((e) => e._count.aoiScores > 0).length;
    const withExams   = enrollments.filter((e) => e._count.examMarks > 0).length;
    const withResults = enrollments.filter((e) => e._count.paperResults > 0).length;

    return {
      ok: true,
      data: {
        total, active, dropped, completed, compulsory, optional,
        withAOI, withExams, withResults,
        aoiCompletion:     total > 0 ? Math.round((withAOI     / total) * 100) : 0,
        examCompletion:    total > 0 ? Math.round((withExams   / total) * 100) : 0,
        resultsCompletion: total > 0 ? Math.round((withResults / total) * 100) : 0,
      },
    };
  } catch (error) {
    console.error("Get enrollment stats error:", error);
    return { ok: false, data: null };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET AGGREGATED STATS FOR ALL PAPERS OF A SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function getSubjectEnrollmentStatsAggregated(data: {
  subjectId: string;
  streamId: string;
  termId: string;
  schoolId: string;
}) {
  try {
    const { subjectId, streamId, termId } = data;

    const streamSubjects = await db.streamSubject.findMany({
      where: { subjectId, streamId, termId, isActive: true },
      select: {
        id: true,
        subjectPaper: { select: { name: true, paperCode: true } },
      },
    });

    if (streamSubjects.length === 0) {
      return { ok: false, data: null, message: "No papers found" };
    }

    const paperStats = await Promise.all(
      streamSubjects.map(async (ss) => {
        const result = await getSubjectEnrollmentStats({
          streamSubjectId: ss.id,
          schoolId: data.schoolId,
        });
        return { paper: ss.subjectPaper, stats: result.data };
      })
    );

    const overallTotal = Math.max(...paperStats.map((p) => p.stats?.total || 0));

    return {
      ok: true,
      data: { paperCount: streamSubjects.length, overallTotal, papers: paperStats },
    };
  } catch (error) {
    console.error("Get aggregated stats error:", error);
    return { ok: false, data: null, message: "Failed to get stats" };
  }
}