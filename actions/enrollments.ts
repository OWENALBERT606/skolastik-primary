// actions/enrollments.ts
"use server";

import { db }                          from "@/prisma/db";
import { revalidatePath }              from "next/cache";
import {
  EnrollmentStatus,
  EnrollmentType,
  SubjectEnrollmentStatus,
}                                      from "@prisma/client";
import { enrollStudentAnnually }       from "@/lib/db-helpers/annual-enrollment";

// ════════════════════════════════════════════════════════════════════════════
// ENROLL STUDENTS INTO STREAM  (dashboard variant)
// Fetches all subjects including paper breakdown for stats messaging.
// Used by the admin dashboard stream management pages.
// ════════════════════════════════════════════════════════════════════════════

export async function enrollStudentsToStream(data: {
  streamId:       string;
  classYearId:    string;
  academicYearId: string;
  termId:         string;
  studentIds:     string[];
}) {
  try {
    const { streamId, classYearId, academicYearId, termId, studentIds } = data;

    if (studentIds.length === 0) {
      return { ok: false, message: "No students selected" };
    }

    const stream = await db.stream.findUnique({
      where:  { id: streamId },
      select: { id: true },
    });
    if (!stream) return { ok: false, message: "Stream not found" };

    // Guard: already enrolled in this term AND stream
    const existingEnrollments = await db.enrollment.findMany({
      where:  { studentId: { in: studentIds }, termId, streamId },
      select: { studentId: true },
    });
    const alreadyEnrolled = new Set(existingEnrollments.map(e => e.studentId));
    const newStudentIds   = studentIds.filter(id => !alreadyEnrolled.has(id));

    if (newStudentIds.length === 0) {
      return { ok: false, message: "All selected students are already enrolled" };
    }

    const result = await db.$transaction(async (tx) => {
      let enrollmentCount        = 0;
      let subjectEnrollmentCount = 0;

      for (const studentId of newStudentIds) {
        // Create the primary (base) enrollment for the requested term
        await tx.enrollment.create({
          data: {
            studentId, classYearId, academicYearId, termId, streamId,
            status:         EnrollmentStatus.ACTIVE,
            enrollmentType: EnrollmentType.CONTINUING,
          },
        });
        enrollmentCount++;

        // Enroll in compulsory subjects for ALL terms in the academic year
        const count = await enrollStudentAnnually(tx, {
          studentId, streamId, classYearId, academicYearId, baseTermId: termId,
        });
        subjectEnrollmentCount += count;
      }

      return { enrollmentCount, subjectEnrollmentCount };
    });

    revalidatePath(`/dashboard/streams/${streamId}`);

    return {
      ok:      true,
      message: `Successfully enrolled ${result.enrollmentCount} student(s) with ${result.subjectEnrollmentCount} subject enrollment(s) across all terms`,
    };
  } catch (error: any) {
    console.error("❌ Error enrolling students:", error);
    return { ok: false, message: "Failed to enroll students" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ENROLL STUDENTS INTO STREAM  (school portal variant)
// Supports configurable enrollmentType and autoEnrollInSubjects toggle.
// Returns enrollment objects. Used by school portal stream pages.
// ════════════════════════════════════════════════════════════════════════════

export async function enrollStudentsInStream(data: {
  studentIds:            string[];
  streamId:              string;
  classYearId:           string;
  academicYearId:        string;
  termId:                string;
  enrollmentType?:       EnrollmentType;
  autoEnrollInSubjects?: boolean;
}) {
  try {
    const {
      studentIds, streamId, classYearId, academicYearId, termId,
      enrollmentType = EnrollmentType.CONTINUING,
      autoEnrollInSubjects = true,
    } = data;

    const stream = await db.stream.findUnique({
      where:  { id: streamId },
      select: { id: true },
    });
    if (!stream) return { ok: false, message: "Stream not found" };

    // Guard: already enrolled in this term (term-wide, not stream-specific)
    const existingEnrollments = await db.enrollment.findMany({
      where: { studentId: { in: studentIds }, termId },
      select: {
        studentId: true,
        student:   { select: { firstName: true, lastName: true } },
      },
    });

    if (existingEnrollments.length > 0) {
      const names = existingEnrollments
        .map(e => `${e.student.firstName} ${e.student.lastName}`)
        .join(", ");
      return {
        ok: false,
        message: `The following students are already enrolled this term: ${names}`,
      };
    }

    const result = await db.$transaction(async (tx) => {
      const enrollments = await Promise.all(
        studentIds.map(studentId =>
          tx.enrollment.create({
            data: {
              studentId, classYearId, streamId, academicYearId, termId,
              enrollmentType,
              status: EnrollmentStatus.ACTIVE,
            },
            include: {
              student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
            },
          })
        )
      );

      let subjectEnrollmentsCount = 0;

      if (autoEnrollInSubjects) {
        // Enroll each student in compulsory subjects for ALL terms in the academic year
        for (const enrollment of enrollments) {
          const count = await enrollStudentAnnually(tx, {
            studentId:     enrollment.studentId,
            streamId,
            classYearId,
            academicYearId,
            baseTermId:    termId,
          });
          subjectEnrollmentsCount += count;
        }
      }

      return { enrollments, subjectEnrollmentsCount };
    });

    revalidatePath(`/school/[slug]/academics/streams/${streamId}`);

    return {
      ok: true,
      message: `${result.enrollments.length} student(s) enrolled successfully${
        result.subjectEnrollmentsCount > 0
          ? ` with ${result.subjectEnrollmentsCount} subject enrollment(s) across all terms`
          : ""
      }`,
      data: result.enrollments,
    };
  } catch (error) {
    console.error("Enroll students error:", error);
    return { ok: false, message: "Failed to enroll students" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// REMOVE STUDENT FROM STREAM
// ════════════════════════════════════════════════════════════════════════════

export async function removeStudentFromStream(enrollmentId: string) {
  try {
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        subjectEnrollments: {
          include: {
            _count: {
              select: { aoiScores: true, aoiUnits: true, examMarks: true, marks: true },
            },
          },
        },
      },
    });
    if (!enrollment) return { ok: false, message: "Enrollment not found" };

    const hasMarks = enrollment.subjectEnrollments.some(
      se =>
        se._count.aoiScores > 0 ||
        se._count.aoiUnits  > 0 ||
        se._count.examMarks > 0 ||
        se._count.marks     > 0
    );

    if (hasMarks) {
      return {
        ok: false,
        message:
          "Cannot remove student. They have marks entered. Please delete marks first or change enrollment status instead.",
      };
    }

    await db.enrollment.delete({ where: { id: enrollmentId } });
    revalidatePath(`/school/[slug]/academics/streams`);

    return { ok: true, message: "Student removed from stream successfully" };
  } catch (error) {
    console.error("Remove student error:", error);
    return { ok: false, message: "Failed to remove student from stream" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE ENROLLMENT STATUS
// ════════════════════════════════════════════════════════════════════════════

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus
) {
  try {
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
    });
    revalidatePath(`/school/[slug]/academics/streams`);
    return { ok: true, message: `Enrollment status updated to ${status}` };
  } catch (error) {
    console.error("Update enrollment status error:", error);
    return { ok: false, message: "Failed to update enrollment status" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET AVAILABLE STUDENTS FOR ENROLLMENT
// ════════════════════════════════════════════════════════════════════════════

export async function getAvailableStudentsForEnrollment(data: {
  schoolId:     string;
  termId:       string;
  classYearId?: string;
}) {
  try {
    const { schoolId, termId, classYearId } = data;

    const students = await db.student.findMany({
      where: {
        schoolId,
        isActive: true,
        enrollments: {
          none: { termId },
          ...(classYearId && { some: { classYearId } }),
        },
      },
      select: {
        id: true, firstName: true, lastName: true,
        admissionNo: true, gender: true, dob: true,
        parent: { select: { firstName: true, lastName: true, phone: true } },
        enrollments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            classYear: { include: { classTemplate: true } },
            stream: true,
          },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return students;
  } catch (error) {
    console.error("Get available students error:", error);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ENROLL STUDENT IN SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function enrollStudentInSubject(data: {
  enrollmentId:    string;
  streamSubjectId: string;
  isCompulsory?:   boolean;
}) {
  try {
    const { enrollmentId, streamSubjectId, isCompulsory = false } = data;

    const existing = await db.studentSubjectEnrollment.findUnique({
      where: { enrollmentId_streamSubjectId: { enrollmentId, streamSubjectId } },
    });
    if (existing) return { ok: false, message: "Student is already enrolled in this subject" };

    await db.studentSubjectEnrollment.create({
      data: {
        enrollmentId, streamSubjectId,
        status:         SubjectEnrollmentStatus.ACTIVE,
        isCompulsory,
        isAutoEnrolled: false,
      },
    });

    revalidatePath(`/school/[slug]/academics/streams`);
    return { ok: true, message: "Student enrolled in subject successfully" };
  } catch (error) {
    console.error("Enroll student in subject error:", error);
    return { ok: false, message: "Failed to enroll student in subject" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BULK ENROLL STUDENTS IN SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function bulkEnrollStudentsInSubject(data: {
  enrollmentIds:   string[];
  streamSubjectId: string;
  isCompulsory?:   boolean;
}) {
  try {
    const { enrollmentIds, streamSubjectId, isCompulsory = false } = data;

    const existing = await db.studentSubjectEnrollment.findMany({
      where: { enrollmentId: { in: enrollmentIds }, streamSubjectId },
      select: { enrollmentId: true },
    });
    const existingIds      = new Set(existing.map(e => e.enrollmentId));
    const newEnrollmentIds = enrollmentIds.filter(id => !existingIds.has(id));

    if (newEnrollmentIds.length === 0) {
      return { ok: false, message: "All selected students are already enrolled in this subject" };
    }

    await db.studentSubjectEnrollment.createMany({
      data: newEnrollmentIds.map(enrollmentId => ({
        enrollmentId, streamSubjectId,
        status:         SubjectEnrollmentStatus.ACTIVE,
        isCompulsory,
        isAutoEnrolled: false,
      })),
      skipDuplicates: true,
    });

    revalidatePath(`/school/[slug]/academics/streams`);
    return {
      ok: true,
      message: `${newEnrollmentIds.length} student(s) enrolled in subject successfully`,
    };
  } catch (error) {
    console.error("Bulk enroll students error:", error);
    return { ok: false, message: "Failed to enroll students in subject" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// REMOVE STUDENT FROM SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function removeStudentFromSubject(subjectEnrollmentId: string) {
  try {
    const enrollment = await db.studentSubjectEnrollment.findUnique({
      where: { id: subjectEnrollmentId },
      include: {
        _count: {
          select: { aoiScores: true, aoiUnits: true, examMarks: true, marks: true },
        },
      },
    });
    if (!enrollment) return { ok: false, message: "Subject enrollment not found" };

    const hasMarks =
      enrollment._count.aoiScores > 0 ||
      enrollment._count.aoiUnits  > 0 ||
      enrollment._count.examMarks > 0 ||
      enrollment._count.marks     > 0;

    if (hasMarks) {
      return {
        ok: false,
        message: "Cannot remove student from subject. They have marks entered. Please delete marks first.",
      };
    }

    await db.studentSubjectEnrollment.delete({ where: { id: subjectEnrollmentId } });
    revalidatePath(`/school/[slug]/academics/streams`);
    return { ok: true, message: "Student removed from subject successfully" };
  } catch (error) {
    console.error("Remove student from subject error:", error);
    return { ok: false, message: "Failed to remove student from subject" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TRANSFER STUDENT TO ANOTHER STREAM (WITH HISTORY)
// ════════════════════════════════════════════════════════════════════════════

export async function transferStudentToStream(data: {
  enrollmentId:     string;
  targetStreamId:   string;
  reason?:          string;
  transferredById?: string;
}) {
  try {
    const { enrollmentId, targetStreamId, reason, transferredById } = data;

    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { select: { firstName: true, lastName: true } },
        stream:  { select: { id: true, name: true } },
      },
    });
    if (!enrollment)          return { ok: false, message: "Enrollment not found" };
    if (!enrollment.streamId) return { ok: false, message: "Student has no current stream assignment" };

    const targetStream = await db.stream.findUnique({
      where: { id: targetStreamId },
      select: { id: true, name: true, classYearId: true },
    });
    if (!targetStream) return { ok: false, message: "Target stream not found" };
    if (targetStream.classYearId !== enrollment.classYearId) {
      return { ok: false, message: "Cannot transfer to a stream in a different class" };
    }
    if (enrollment.streamId === targetStreamId) {
      return { ok: false, message: "Student is already in this stream" };
    }

    const transferReason = reason ||
      (enrollment.stream
        ? `Transferred from ${enrollment.stream.name} to ${targetStream.name}`
        : `Transferred to ${targetStream.name}`);

    await db.$transaction([
      db.enrollment.update({
        where: { id: enrollmentId },
        data:  { streamId: targetStreamId, status: EnrollmentStatus.TRANSFERRED },
      }),
      db.enrollmentTransferHistory.create({
        data: {
          enrollmentId,
          fromStreamId: enrollment.streamId,
          toStreamId:   targetStreamId,
          reason:       transferReason,
          ...(transferredById && { transferredById }),
        },
      }),
    ]);

    revalidatePath(`/school/[slug]/academics/streams`);

    return {
      ok: true,
      message: `${enrollment.student.firstName} ${enrollment.student.lastName} transferred successfully to ${targetStream.name}`,
    };
  } catch (error) {
    console.error("Transfer student error:", error);
    return { ok: false, message: "Failed to transfer student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BATCH TRANSFER STUDENTS TO ANOTHER STREAM (WITH HISTORY)
// ════════════════════════════════════════════════════════════════════════════

export async function batchTransferStudents(data: {
  enrollmentIds:    string[];
  targetStreamId:   string;
  reason?:          string;
  transferredById?: string;
}) {
  try {
    const { enrollmentIds, targetStreamId, reason, transferredById } = data;

    if (enrollmentIds.length === 0) return { ok: false, message: "No students selected" };

    const targetStream = await db.stream.findUnique({
      where: { id: targetStreamId },
      select: { id: true, name: true, classYearId: true },
    });
    if (!targetStream) return { ok: false, message: "Target stream not found" };

    const enrollments = await db.enrollment.findMany({
      where: { id: { in: enrollmentIds } },
      include: {
        student: { select: { firstName: true, lastName: true } },
        stream:  { select: { id: true, name: true } },
      },
    });

    const validEnrollments = enrollments.filter(e => e.streamId !== null);
    if (validEnrollments.length === 0) {
      return { ok: false, message: "No valid enrollments found with stream assignments" };
    }
    if (validEnrollments.length < enrollments.length) {
      console.warn(`Skipping ${enrollments.length - validEnrollments.length} enrollment(s) without stream assignment`);
    }

    const invalidEnrollments = validEnrollments.filter(
      e => e.classYearId !== targetStream.classYearId
    );
    if (invalidEnrollments.length > 0) {
      return { ok: false, message: "Cannot transfer students from different classes" };
    }

    const alreadyInTarget = validEnrollments.filter(e => e.streamId === targetStreamId);
    if (alreadyInTarget.length > 0) {
      const names = alreadyInTarget
        .map(e => `${e.student.firstName} ${e.student.lastName}`)
        .join(", ");
      return {
        ok: false,
        message: `The following students are already in ${targetStream.name}: ${names}`,
      };
    }

    const transferOperations = validEnrollments.flatMap(enrollment => {
      const transferReason = reason ||
        (enrollment.stream
          ? `Batch transfer from ${enrollment.stream.name} to ${targetStream.name}`
          : `Batch transfer to ${targetStream.name}`);

      return [
        db.enrollment.update({
          where: { id: enrollment.id },
          data:  { streamId: targetStreamId, status: EnrollmentStatus.TRANSFERRED },
        }),
        db.enrollmentTransferHistory.create({
          data: {
            enrollmentId: enrollment.id,
            fromStreamId: enrollment.streamId!,
            toStreamId:   targetStreamId,
            reason:       transferReason,
            ...(transferredById && { transferredById }),
          },
        }),
      ];
    });

    await db.$transaction(transferOperations);
    revalidatePath(`/school/[slug]/academics/streams`);

    return {
      ok: true,
      message: `Successfully transferred ${validEnrollments.length} student(s) to ${targetStream.name}`,
    };
  } catch (error) {
    console.error("Batch transfer error:", error);
    return { ok: false, message: "Failed to transfer students" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STUDENT TRANSFER HISTORY
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentTransferHistory(enrollmentId: string) {
  try {
    const history = await db.enrollmentTransferHistory.findMany({
      where: { enrollmentId },
      include: {
        fromStream:    { select: { name: true } },
        toStream:      { select: { name: true } },
        transferredBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { transferredAt: "desc" },
    });
    return history;
  } catch (error) {
    console.error("Get transfer history error:", error);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STREAM TRANSFER STATISTICS
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamTransferStats(streamId: string) {
  try {
    const [transfersIn, transfersOut] = await Promise.all([
      db.enrollmentTransferHistory.count({ where: { toStreamId:   streamId } }),
      db.enrollmentTransferHistory.count({ where: { fromStreamId: streamId } }),
    ]);

    const recentTransfers = await db.enrollmentTransferHistory.findMany({
      where: { OR: [{ toStreamId: streamId }, { fromStreamId: streamId }] },
      include: {
        enrollment: {
          include: {
            student: { select: { firstName: true, lastName: true, admissionNo: true } },
          },
        },
        fromStream: { select: { name: true } },
        toStream:   { select: { name: true } },
      },
      orderBy: { transferredAt: "desc" },
      take: 10,
    });

    return {
      transfersIn,
      transfersOut,
      netChange: transfersIn - transfersOut,
      recentTransfers,
    };
  } catch (error) {
    console.error("Get stream transfer stats error:", error);
    return { transfersIn: 0, transfersOut: 0, netChange: 0, recentTransfers: [] };
  }
}