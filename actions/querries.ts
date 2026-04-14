// actions/queries.ts
"use server";

import { db } from "@/prisma/db";
// FIX [1-7]: Import enums for type-safe status values used in Prisma queries.
// Using plain string literals ('ACTIVE') compiles but loses type safety — a
// future enum rename would silently produce wrong queries.
import { EnrollmentStatus, AssignmentStatus } from "@prisma/client";

/** ============================
 * CLASS YEAR QUERIES
 * ============================*/

export async function getActiveClassYears(schoolId: string) {
  try {
    return await db.classYear.findMany({
      where: {
        academicYear: { schoolId, isActive: true },
        isActive: true,
      },
      include: {
        classTemplate: true,
        academicYear: true,
      },
      orderBy: [
        { academicYear: { year: "desc" } },
        { classTemplate: { name: "asc" } },
      ],
    });
  } catch (error) {
    console.error("❌ Error fetching active class years:", error);
    return [];
  }
}

export async function getClassYearById(classYearId: string) {
  try {
    return await db.classYear.findUnique({
      where: { id: classYearId },
      include: {
        classTemplate: true,
        academicYear: {
          include: {
            terms: { where: { isActive: true }, orderBy: { termNumber: "asc" } },
          },
        },
        classSubjects: {
          include: {
            subject: {
              include: {
                papers: { where: { isActive: true }, orderBy: { paperNumber: "asc" } },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching class year:", error);
    return null;
  }
}

/** ============================
 * TEACHER QUERIES
 * ============================*/

export async function getActiveTeachers(schoolId: string) {
  try {
    return await db.teacher.findMany({
      where: { schoolId, currentStatus: "ACTIVE" },
      select: {
        id: true, firstName: true, lastName: true,
        staffNo: true, email: true, specialization: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
  } catch (error) {
    console.error("❌ Error fetching active teachers:", error);
    return [];
  }
}

export async function getAvailableTeachersForSubject(
  schoolId:     string,
  subjectName?: string
) {
  try {
    return await db.teacher.findMany({
      where: { schoolId, currentStatus: "ACTIVE" },
      select: {
        id: true, firstName: true, lastName: true,
        staffNo: true, specialization: true, email: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
  } catch (error) {
    console.error("❌ Error fetching available teachers:", error);
    return [];
  }
}

export async function getAvailableClassHeads(
  schoolId:         string,
  classYearId:      string,
  excludeStreamId?: string
) {
  try {
    return await db.teacher.findMany({
      where: {
        schoolId,
        currentStatus: "ACTIVE",
        OR: [
          { headedStreams: { none: {} } },
          ...(excludeStreamId
            ? [{ headedStreams: { every: { id: excludeStreamId, classYearId } } }]
            : []),
        ],
      },
      select: { id: true, firstName: true, lastName: true, staffNo: true, email: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
  } catch (error) {
    console.error("❌ Error fetching available class heads:", error);
    return [];
  }
}

/** ============================
 * TERM QUERIES
 * ============================*/

export async function getActiveTerms(academicYearId: string) {
  try {
    return await db.academicTerm.findMany({
      where: { academicYearId, isActive: true },
      orderBy: { termNumber: "asc" },
    });
  } catch (error) {
    console.error("❌ Error fetching active terms:", error);
    return [];
  }
}

export async function getCurrentTerm(academicYearId: string) {
  try {
    const now = new Date();

    const currentTerm = await db.academicTerm.findFirst({
      where: {
        academicYearId,
        isActive:  true,
        startDate: { lte: now },
        endDate:   { gte: now },
      },
      orderBy: { termNumber: "asc" },
    });

    if (!currentTerm) {
      return await db.academicTerm.findFirst({
        where: { academicYearId, isActive: true },
        orderBy: { termNumber: "asc" },
      });
    }

    return currentTerm;
  } catch (error) {
    console.error("❌ Error fetching current term:", error);
    return null;
  }
}

/** ============================
 * STUDENT QUERIES
 * ============================*/

export async function getUnenrolledStudents(
  schoolId:    string,
  classYearId: string
) {
  try {
    const allStudents = await db.student.findMany({
      where: { schoolId, isActive: true },
      select: {
        id: true, firstName: true, lastName: true,
        admissionNo: true, gender: true, dob: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    const enrolledStudents = await db.enrollment.findMany({
      where: {
        classYearId,
        // FIX [1]: Use EnrollmentStatus enum
        status: EnrollmentStatus.ACTIVE,
      },
      select: { studentId: true },
    });

    const enrolledIds = new Set(enrolledStudents.map((e) => e.studentId));
    return allStudents.filter((student) => !enrolledIds.has(student.id));
  } catch (error) {
    console.error("❌ Error fetching unenrolled students:", error);
    return [];
  }
}

export async function getStudentsByStream(streamId: string) {
  try {
    return await db.enrollment.findMany({
      where: {
        streamId,
        // FIX [2]: Use EnrollmentStatus enum
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true,
            admissionNo: true, gender: true, dob: true,
          },
        },
        term: true,
      },
      orderBy: { student: { firstName: "asc" } },
    });
  } catch (error) {
    console.error("❌ Error fetching students by stream:", error);
    return [];
  }
}

export async function getStudentsByClassYear(classYearId: string) {
  try {
    return await db.enrollment.findMany({
      where: {
        classYearId,
        // FIX [3]: Use EnrollmentStatus enum
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true,
            admissionNo: true, gender: true,
          },
        },
        stream: { select: { id: true, name: true } },
      },
      orderBy: { student: { firstName: "asc" } },
    });
  } catch (error) {
    console.error("❌ Error fetching students by class year:", error);
    return [];
  }
}

/** ============================
 * SUBJECT QUERIES
 * ============================*/

export async function getActiveSubjects(schoolId: string) {
  try {
    return await db.subject.findMany({
      where: { schoolId, isActive: true },
      include: {
        papers: { where: { isActive: true }, orderBy: { paperNumber: "asc" } },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("❌ Error fetching active subjects:", error);
    return [];
  }
}

export async function getSubjectsByClassYear(classYearId: string) {
  try {
    return await db.classSubject.findMany({
      where: { classYearId },
      include: {
        subject: {
          include: {
            papers: { where: { isActive: true }, orderBy: { paperNumber: "asc" } },
          },
        },
      },
      orderBy: { subject: { name: "asc" } },
    });
  } catch (error) {
    console.error("❌ Error fetching subjects by class year:", error);
    return [];
  }
}

/** ============================
 * ACADEMIC YEAR QUERIES
 * ============================*/

export async function getActiveAcademicYear(schoolId: string) {
  try {
    return await db.academicYear.findFirst({
      where: { schoolId, isActive: true },
      include: {
        terms: { where: { isActive: true }, orderBy: { termNumber: "asc" } },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching active academic year:", error);
    return null;
  }
}

export async function getAcademicYearById(academicYearId: string) {
  try {
    return await db.academicYear.findUnique({
      where: { id: academicYearId },
      include: {
        terms: { where: { isActive: true }, orderBy: { termNumber: "asc" } },
        classYears: {
          where:   { isActive: true },
          include: { classTemplate: true },
          orderBy: { classTemplate: { name: "asc" } },
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching academic year:", error);
    return null;
  }
}

/** ============================
 * STREAM QUERIES
 * ============================*/

export async function getStreamsByClassYear(classYearId: string) {
  try {
    return await db.stream.findMany({
      where: { classYearId },
      include: {
        classHead: {
          select: { id: true, firstName: true, lastName: true, staffNo: true },
        },
        _count: { select: { enrollments: true, streamSubjects: true } },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("❌ Error fetching streams by class year:", error);
    return [];
  }
}

/** ============================
 * ENROLLMENT STATISTICS
 * ============================*/

export async function getEnrollmentStats(streamId: string) {
  try {
    const [totalStudents, maleCount, femaleCount, subjectCount] = await Promise.all([
      db.enrollment.count({
        // FIX [4a]: Use EnrollmentStatus enum
        where: { streamId, status: EnrollmentStatus.ACTIVE },
      }),
      db.enrollment.count({
        // FIX [4b]: Use EnrollmentStatus enum
        where: { streamId, status: EnrollmentStatus.ACTIVE, student: { gender: "Male" } },
      }),
      db.enrollment.count({
        // FIX [4c]: Use EnrollmentStatus enum
        where: { streamId, status: EnrollmentStatus.ACTIVE, student: { gender: "Female" } },
      }),
      db.streamSubject.count({ where: { streamId } }),
    ]);

    return { totalStudents, maleCount, femaleCount, subjectCount };
  } catch (error) {
    console.error("❌ Error fetching enrollment stats:", error);
    return { totalStudents: 0, maleCount: 0, femaleCount: 0, subjectCount: 0 };
  }
}

/** ============================
 * TEACHER ASSIGNMENT QUERIES
 * ============================*/

export async function getTeacherAssignmentsByStream(streamId: string) {
  try {
    return await db.streamSubjectTeacher.findMany({
      where: {
        streamSubject: { streamId },
        // FIX [5]: Use AssignmentStatus enum
        status: AssignmentStatus.ACTIVE,
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, staffNo: true, email: true },
        },
        streamSubject: {
          include: { subject: true, subjectPaper: true, term: true },
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching teacher assignments:", error);
    return [];
  }
}

export async function getUnassignedStreamSubjects(streamId: string) {
  try {
    const streamSubjects = await db.streamSubject.findMany({
      where: {
        streamId,
        teacherAssignments: {
          // FIX [6]: Use AssignmentStatus enum
          none: { status: AssignmentStatus.ACTIVE },
        },
      },
      include: {
        subject:      true,
        subjectPaper: true,
        term:         true,
        _count:       { select: { studentEnrollments: true } },
      },
      orderBy: [
        { term:    { termNumber: "asc" } },
        { subject: { name:       "asc" } },
      ],
    });

    return streamSubjects;
  } catch (error) {
    console.error("❌ Error fetching unassigned stream subjects:", error);
    return [];
  }
}

/** ============================
 * VALIDATION QUERIES
 * ============================*/

export async function isStudentEnrolled(
  studentId:   string,
  classYearId: string,
  termId:      string
) {
  try {
    const enrollment = await db.enrollment.findFirst({
      where: {
        studentId,
        classYearId,
        termId,
        // FIX [7]: Use EnrollmentStatus enum
        status: EnrollmentStatus.ACTIVE,
      },
    });
    return !!enrollment;
  } catch (error) {
    console.error("❌ Error checking student enrollment:", error);
    return false;
  }
}

export async function isTeacherAvailable(teacherId: string) {
  try {
    const teacher = await db.teacher.findUnique({
      where:  { id: teacherId },
      select: { currentStatus: true },
    });
    // Note: currentStatus comparison is in-memory JS (not a Prisma query filter),
    // so string comparison is fine here without importing TeacherStatus.
    return teacher?.currentStatus === "ACTIVE";
  } catch (error) {
    console.error("❌ Error checking teacher availability:", error);
    return false;
  }
}

export async function canTeacherBeClassHead(
  teacherId:        string,
  classYearId:      string,
  excludeStreamId?: string
) {
  try {
    const existingHeadship = await db.stream.findFirst({
      where: {
        classHeadId: teacherId,
        classYearId,
        ...(excludeStreamId && { id: { not: excludeStreamId } }),
      },
    });
    return !existingHeadship;
  } catch (error) {
    console.error("❌ Error checking class head eligibility:", error);
    return false;
  }
}