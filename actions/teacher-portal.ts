// actions/teacher-portal.ts
"use server";

import { db }                                                   from "@/prisma/db";
import { MarkStatus, EnrollmentStatus, EnrollmentType,
         SubjectEnrollmentStatus }                              from "@prisma/client";
import { revalidatePath }                                       from "next/cache";

// ════════════════════════════════════════════════════════════════════════════
// GET TEACHER STUDENTS
// Returns all students enrolled in the teacher's assigned stream subjects
// ════════════════════════════════════════════════════════════════════════════

export async function getTeacherStudents(userId: string) {
  try {
    const teacher = await db.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) return { ok: false as const, message: "Teacher not found" };

    const assignments = await db.streamSubjectTeacher.findMany({
      where: { teacherId: teacher.id, status: "ACTIVE" },
      include: {
        streamSubject: {
          include: {
            subject:      { select: { id: true, name: true, code: true } },
            subjectPaper: { select: { paperNumber: true, name: true } },
            stream: {
              select: {
                id: true, name: true,
                classYear: { select: { classTemplate: { select: { name: true } } } },
              },
            },
            term: { select: { id: true, name: true, isActive: true } },
            studentEnrollments: {
              where: { status: "ACTIVE" },
              include: {
                enrollment: {
                  select: {
                    student: {
                      select: {
                        id: true, firstName: true, lastName: true,
                        admissionNo: true, imageUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Build flat list of subject+students
    const subjects = assignments.map(({ streamSubject: ss }) => ({
      streamSubjectId: ss.id,
      subjectName: ss.subject.name,
      subjectCode: ss.subject.code,
      paperNumber: ss.subjectPaper?.paperNumber ?? null,
      paperName:   ss.subjectPaper?.name ?? null,
      className:   ss.stream.classYear.classTemplate.name,
      streamName:  ss.stream.name,
      streamId:    ss.stream.id,
      termName:    ss.term.name,
      isActiveTerm: ss.term.isActive,
      students: ss.studentEnrollments.map(se => ({
        enrollmentId: se.id,
        studentId:    se.enrollment.student.id,
        firstName:    se.enrollment.student.firstName,
        lastName:     se.enrollment.student.lastName,
        admissionNo:  se.enrollment.student.admissionNo,
        photo:        se.enrollment.student.imageUrl,
      })),
    }));

    return { ok: true as const, data: subjects };
  } catch (error: any) {
    return { ok: false as const, message: error?.message ?? "Failed to load students" };
  }
}

export async function getTeacherByUserId(userId: string) {
  try {
    const teacher = await db.teacher.findUnique({
      where:  { userId },
      select: {
        id: true, firstName: true, lastName: true,
        staffNo: true, role: true, status: true,
        profilePhoto: true,
        school: { select: { id: true, slug: true, name: true } },
      },
    });
    return { ok: true as const, data: teacher };
  } catch (error: any) {
    return { ok: false as const, message: error?.message ?? "Failed to load teacher" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET TEACHER DASHBOARD DATA
// Returns all active stream subjects assigned to the teacher with
// per-subject mark stats, student counts, and links for navigation.
// ════════════════════════════════════════════════════════════════════════════

export async function getTeacherDashboardData(userId: string) {
  try {
    const teacher = await db.teacher.findUnique({
      where: { userId },
      select: { id: true, firstName: true, lastName: true, staffNo: true, role: true },
    });

    if (!teacher) return { ok: false as const, message: "Teacher record not found for this user" };

    // Fetch ALL assignments (ACTIVE + COMPLETED) so teachers can see history.
    // CANCELLED / REMOVED assignments are excluded — those were never worked on.
    const assignments = await db.streamSubjectTeacher.findMany({
      where:   {
        teacherId: teacher.id,
        status:    { in: ["ACTIVE", "COMPLETED", "REASSIGNED"] },
      },
      include: {
        streamSubject: {
          include: {
            subject:      { select: { id: true, name: true, code: true, subjectLevel: true } },
            subjectPaper: { select: { id: true, name: true, paperNumber: true, paperCode: true } },
            stream: {
              select: {
                id: true, name: true, schoolId: true,
                classYear: {
                  select: {
                    id: true,
                    classTemplate: { select: { name: true, level: true } },
                    academicYear:  { select: { id: true, year: true, isActive: true } },
                  },
                },
              },
            },
            term: { select: { id: true, name: true, termNumber: true, isActive: true } },
            studentEnrollments: {
              where:  { status: "ACTIVE" },
              select: {
                id: true,
                examMarks: { select: { id: true, status: true } },
                aoiScores: { select: { id: true, status: true } },
                aoiUnits:  { select: { id: true, status: true } },
              },
            },
          },
        },
      },
      orderBy: [
        { streamSubject: { stream: { classYear: { academicYear: { year: "desc" } } } } },
        { streamSubject: { term:  { termNumber: "asc" } } },
        { streamSubject: { stream: { classYear: { classTemplate: { level: "asc" } } } } },
        { streamSubject: { stream: { name: "asc" } } },
        { streamSubject: { subject: { name: "asc" } } },
      ],
    });

    // ── Compute per-subject mark stats ─────────────────────────────────────
    const subjects = assignments.map(({ streamSubject: ss, status: assignmentStatus }) => {
      let draft = 0, submitted = 0, approved = 0;

      for (const se of ss.studentEnrollments) {
        for (const m of [...se.examMarks, ...se.aoiScores, ...se.aoiUnits]) {
          if (m.status === MarkStatus.DRAFT)    draft++;
          if (m.status === MarkStatus.SUBMITTED) submitted++;
          if (m.status === MarkStatus.APPROVED)  approved++;
        }
      }

      const totalStudents = ss.studentEnrollments.length;
      const totalMarks    = draft + submitted + approved;
      const allApproved   = totalMarks > 0 && draft === 0 && submitted === 0;
      const ay            = ss.stream.classYear.academicYear;

      return {
        streamSubjectId:  ss.id,
        subjectName:      ss.subject.name,
        subjectCode:      ss.subject.code,
        subjectLevel:     ss.subject.subjectLevel,
        paperName:        ss.subjectPaper?.name       ?? null,
        paperNumber:      ss.subjectPaper?.paperNumber ?? null,
        paperCode:        ss.subjectPaper?.paperCode   ?? null,
        className:        ss.stream.classYear.classTemplate.name,
        streamId:         ss.stream.id,
        streamName:       ss.stream.name,
        schoolId:         ss.stream.schoolId,
        termId:           ss.term.id,
        termName:         ss.term.name,
        termNumber:       ss.term.termNumber,
        isActiveTerm:     ss.term.isActive,
        academicYearId:   ay.id,
        academicYear:     ay.year,
        isActiveYear:     ay.isActive,
        assignmentStatus,                   // "ACTIVE" | "COMPLETED" | "REASSIGNED"
        totalStudents,
        marksDraft:       draft,
        marksSubmitted:   submitted,
        marksApproved:    approved,
        hasAnyMarks:      totalMarks > 0,
        allApproved,
        pendingApproval:  submitted > 0,
      };
    });

    // ── Summary — based on ACTIVE assignments in the active term only ───────
    const activeSubs = subjects.filter(s => s.isActiveTerm && s.assignmentStatus === "ACTIVE");
    const summary = {
      totalSubjects:      activeSubs.length,
      totalStudents:      activeSubs.reduce((s, sub) => s + sub.totalStudents, 0),
      pendingApproval:    activeSubs.filter(s => s.pendingApproval).length,
      fullyApproved:      activeSubs.filter(s => s.allApproved).length,
      activeTermSubjects: activeSubs.length,
    };

    // ── Headed streams (class-head role) ──────────────────────────────────
    const headedStreamsList = await db.stream.findMany({
      where:  { classHeadId: teacher.id },
      select: {
        id: true, name: true,
        classYear: {
          select: {
            classTemplate: { select: { name: true } },
            academicYear:  { select: { year: true, isActive: true } },
          },
        },
        _count: {
          select: { enrollments: { where: { status: "ACTIVE" } } },
        },
      },
    });

    const headedStreams = await Promise.all(
      headedStreamsList.map(async (s) => {
        const pendingReviews = await db.examMark.count({
          where: {
            status: "SUBMITTED",
            studentSubjectEnrollment: {
              streamSubject: { streamId: s.id },
            },
          },
        });
        return {
          streamId:     s.id,
          streamName:   s.name,
          className:    s.classYear.classTemplate.name,
          academicYear: s.classYear.academicYear.year,
          isActiveYear: s.classYear.academicYear.isActive,
          studentCount: s._count.enrollments,
          pendingReviews,
        };
      })
    );

    return {
      ok:   true as const,
      data: { teacher, subjects, summary, headedStreams },
    };
  } catch (error: any) {
    console.error("❌ getTeacherDashboardData:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load teacher dashboard" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET NEXT-TERM ENROLLMENT DATA FOR TEACHER SUBJECT
// Returns next-term info and which students are already enrolled there.
// Only works within the same academic year.
// ════════════════════════════════════════════════════════════════════════════

export async function getTeacherSubjectNextTermData(
  streamSubjectId: string,
  userId: string,
) {
  try {
    const teacher = await db.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) return { ok: false as const, message: "Teacher not found" };

    // Verify this teacher is actively assigned to the subject
    const assignment = await db.streamSubjectTeacher.findFirst({
      where: { teacherId: teacher.id, streamSubjectId, status: "ACTIVE" },
    });
    if (!assignment) return { ok: false as const, message: "You are not assigned to this subject" };

    // Load current stream-subject with full context
    const ss = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      include: {
        subject:      { select: { id: true, name: true, code: true } },
        subjectPaper: { select: { id: true, paperNumber: true, name: true } },
        term:         { select: { id: true, name: true, termNumber: true, academicYearId: true } },
        stream:       { select: { id: true, name: true, classYearId: true } },
        studentEnrollments: {
          where: { status: "ACTIVE" },
          include: {
            enrollment: {
              select: {
                id: true,
                studentId: true,
                classYearId: true,
                academicYearId: true,
                streamId: true,
                student: {
                  select: { id: true, firstName: true, lastName: true, admissionNo: true },
                },
              },
            },
          },
        },
      },
    });
    if (!ss) return { ok: false as const, message: "Stream subject not found" };

    // Find the next term within the same academic year
    const nextTerm = await db.academicTerm.findFirst({
      where: {
        academicYearId: ss.term.academicYearId,
        termNumber: ss.term.termNumber + 1,
      },
      select: { id: true, name: true, termNumber: true },
    });
    if (!nextTerm) {
      return { ok: false as const, message: "No next term available in this academic year" };
    }

    // Find the equivalent stream-subject for next term
    const nextTermStreamSubject = await db.streamSubject.findFirst({
      where: {
        streamId:     ss.stream.id,
        subjectId:    ss.subject.id,
        termId:       nextTerm.id,
        subjectPaperId: ss.subjectPaper?.id ?? null,
      },
      select: { id: true },
    });
    if (!nextTermStreamSubject) {
      return {
        ok: false as const,
        message: `${ss.subject.name} is not yet configured for ${nextTerm.name}. Ask the DOS/admin to set it up first.`,
      };
    }

    // Build student list
    const students = ss.studentEnrollments.map(se => ({
      studentSubjectEnrollmentId: se.id,
      studentId:                  se.enrollment.student.id,
      firstName:                  se.enrollment.student.firstName,
      lastName:                   se.enrollment.student.lastName,
      admissionNo:                se.enrollment.student.admissionNo,
      currentEnrollmentId:        se.enrollment.id,
    }));

    // Which students already have a subject enrollment in next term's stream-subject?
    const studentIds = students.map(s => s.studentId);
    const alreadyInNextSubject = await db.studentSubjectEnrollment.findMany({
      where: {
        streamSubjectId: nextTermStreamSubject.id,
        enrollment: { studentId: { in: studentIds } },
      },
      include: { enrollment: { select: { studentId: true } } },
    });
    const alreadySet = new Set(alreadyInNextSubject.map(e => e.enrollment.studentId));

    return {
      ok: true as const,
      data: {
        currentTermName:         ss.term.name,
        nextTerm:                { id: nextTerm.id, name: nextTerm.name },
        nextTermStreamSubjectId: nextTermStreamSubject.id,
        subjectName:             ss.subject.name,
        subjectCode:             ss.subject.code,
        paperName:               ss.subjectPaper?.name ?? null,
        streamName:              ss.stream.name,
        classYearId:             ss.stream.classYearId,
        academicYearId:          ss.term.academicYearId,
        streamId:                ss.stream.id,
        students: students.map(s => ({
          ...s,
          alreadyEnrolledNextTerm: alreadySet.has(s.studentId),
        })),
      },
    };
  } catch (error: any) {
    console.error("❌ getTeacherSubjectNextTermData:", error);
    return { ok: false as const, message: "Failed to load next-term data" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ENROLL STUDENTS TO NEXT TERM  (teacher-initiated, subject-scoped)
// Creates Enrollment (if missing) + StudentSubjectEnrollment for next term.
// Preserves all previous-term marks/results — nothing is deleted or altered.
// ════════════════════════════════════════════════════════════════════════════

export async function enrollStudentsToNextTermSubject(data: {
  studentIds:              string[];
  currentStreamSubjectId:  string;
  nextTermStreamSubjectId: string;
  nextTermId:              string;
  classYearId:             string;
  academicYearId:          string;
  streamId:                string;
  userId:                  string;
}) {
  try {
    const {
      studentIds, currentStreamSubjectId, nextTermStreamSubjectId,
      nextTermId, classYearId, academicYearId, streamId, userId,
    } = data;

    if (studentIds.length === 0) return { ok: false as const, message: "No students selected" };

    // Verify teacher owns the current stream-subject
    const teacher = await db.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) return { ok: false as const, message: "Teacher not found" };

    const assignment = await db.streamSubjectTeacher.findFirst({
      where: { teacherId: teacher.id, streamSubjectId: currentStreamSubjectId, status: "ACTIVE" },
    });
    if (!assignment) return { ok: false as const, message: "Not authorised to enroll for this subject" };

    // Confirm students are currently enrolled in this subject (ACTIVE)
    const currentEnrollments = await db.studentSubjectEnrollment.findMany({
      where: {
        streamSubjectId: currentStreamSubjectId,
        enrollment: { studentId: { in: studentIds } },
        status: "ACTIVE",
      },
      include: { enrollment: { select: { studentId: true } } },
    });
    const validStudentIds = new Set(currentEnrollments.map(e => e.enrollment.studentId));

    // Existing term-level enrollments for next term (avoids unique-constraint error)
    const existingTermEnrollments = await db.enrollment.findMany({
      where: { studentId: { in: studentIds }, termId: nextTermId },
      select: { id: true, studentId: true },
    });
    const existingTermMap = new Map(existingTermEnrollments.map(e => [e.studentId, e.id]));

    // Students already enrolled in the next term's subject
    const alreadyInSubject = await db.studentSubjectEnrollment.findMany({
      where: {
        streamSubjectId: nextTermStreamSubjectId,
        enrollment: { studentId: { in: studentIds } },
      },
      include: { enrollment: { select: { studentId: true } } },
    });
    const alreadySubjectSet = new Set(alreadyInSubject.map(e => e.enrollment.studentId));

    const result = await db.$transaction(async (tx) => {
      let newTermEnrollments    = 0;
      let newSubjectEnrollments = 0;
      let skipped               = 0;

      for (const studentId of studentIds) {
        if (!validStudentIds.has(studentId))  { skipped++; continue; }
        if (alreadySubjectSet.has(studentId)) { skipped++; continue; }

        let enrollmentId = existingTermMap.get(studentId);

        // Create a term-level enrollment if this student has none for next term
        if (!enrollmentId) {
          const enrollment = await tx.enrollment.create({
            data: {
              studentId, classYearId, academicYearId,
              termId:         nextTermId,
              streamId,
              status:         EnrollmentStatus.ACTIVE,
              enrollmentType: EnrollmentType.CONTINUING,
            },
          });
          enrollmentId = enrollment.id;
          newTermEnrollments++;
        }

        // Enroll in the subject for next term
        await tx.studentSubjectEnrollment.create({
          data: {
            enrollmentId,
            streamSubjectId: nextTermStreamSubjectId,
            status:          SubjectEnrollmentStatus.ACTIVE,
            isCompulsory:    false,
            isAutoEnrolled:  false,
          },
        });
        newSubjectEnrollments++;
      }

      return { newTermEnrollments, newSubjectEnrollments, skipped };
    });

    revalidatePath(`/school/[slug]/teacher/dashboard`);

    const skippedNote = result.skipped > 0 ? ` (${result.skipped} already enrolled or invalid)` : "";
    return {
      ok: true as const,
      message: `${result.newSubjectEnrollments} student(s) enrolled for next term.${skippedNote}`,
    };
  } catch (error: any) {
    console.error("❌ enrollStudentsToNextTermSubject:", error);
    if (error?.code === "P2002") {
      return { ok: false as const, message: "Duplicate enrollment detected — some students may already be enrolled." };
    }
    return { ok: false as const, message: "Failed to enroll students" };
  }
}
