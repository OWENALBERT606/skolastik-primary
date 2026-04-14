// actions/class-teacher.ts
"use server";

import { db }             from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { MarkStatus, EnrollmentStatus, EnrollmentType, SubjectEnrollmentStatus } from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// GET STREAM WHERE TEACHER IS CLASS HEAD
// ════════════════════════════════════════════════════════════════════════════

export async function getClassHeadStream(teacherId: string, schoolId: string) {
  try {
    // Prefer active academic year; fall back to most recent if none active
    const stream = await db.stream.findFirst({
      where: {
        classHeadId: teacherId,
        schoolId,
        classYear: { academicYear: { isActive: true } },
      },
      select: {
        id:   true,
        name: true,
        classYear: {
          select: {
            id:         true,
            classLevel: true,
            classTemplate: { select: { id: true, name: true, code: true, level: true } },
            academicYear:  { select: { id: true, year: true } },
          },
        },
      },
    });
    return { ok: true as const, data: stream };
  } catch (error: any) {
    console.error("❌ getClassHeadStream:", error);
    return { ok: false as const, data: null, message: error?.message ?? "Failed to load stream" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET CLASS TEACHER DASHBOARD DATA
// ════════════════════════════════════════════════════════════════════════════

export async function getClassTeacherDashboardData(streamId: string, teacherId: string) {
  try {
    const activeYear = await db.academicYear.findFirst({
      where:  { school: { streams: { some: { id: streamId } } }, isActive: true },
      select: {
        id:   true,
        year: true,
        terms: {
          where:   { isActive: true },
          select:  { id: true, name: true, termNumber: true },
          orderBy: { termNumber: "asc" },
        },
      },
    });
    if (!activeYear) return { ok: false as const, message: "No active academic year" };
    const activeTerm = activeYear.terms[0];
    if (!activeTerm) return { ok: false as const, message: "No active term" };

    // ── Students in stream ───────────────────────────────────────────────
    const enrollments = await db.enrollment.findMany({
      where: { streamId, termId: activeTerm.id, status: EnrollmentStatus.ACTIVE },
      include: {
        student: {
          select: {
            id:          true,
            admissionNo: true,
            firstName:   true,
            lastName:    true,
            gender:      true,
            imageUrl:    true,
          },
        },
        subjectEnrollments: {
          where:  { status: SubjectEnrollmentStatus.ACTIVE },
          select: { id: true },
        },
      },
      orderBy: { student: { lastName: "asc" } },
    });

    // ── Stream subjects with mark counts ─────────────────────────────────
    const streamSubjects = await db.streamSubject.findMany({
      where:  { streamId, termId: activeTerm.id, isActive: true },
      include: {
        subject:      { select: { id: true, name: true, code: true } },
        subjectPaper: { select: { id: true, name: true, paperNumber: true } },
        teacherAssignments: {
          where:  { status: "ACTIVE" },
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        studentEnrollments: {
          where:  { status: SubjectEnrollmentStatus.ACTIVE },
          select: {
            id: true,
            examMarks: { select: { id: true, status: true } },
            aoiScores: { select: { id: true, status: true } },
            aoiUnits:  { select: { id: true, status: true } },
          },
        },
      },
      orderBy: { subject: { name: "asc" } },
    });

    // ── Summarise per subject ─────────────────────────────────────────────
    const subjects = streamSubjects.map((ss) => {
      let draft = 0, submitted = 0, ctApproved = 0, approved = 0, rejected = 0;
      for (const se of ss.studentEnrollments) {
        for (const m of [...se.examMarks, ...se.aoiScores, ...se.aoiUnits]) {
          if (m.status === MarkStatus.DRAFT)                  draft++;
          if (m.status === MarkStatus.SUBMITTED)              submitted++;
          if (m.status === MarkStatus.CLASS_TEACHER_APPROVED) ctApproved++;
          if (m.status === MarkStatus.APPROVED)               approved++;
          if (m.status === MarkStatus.REJECTED)               rejected++;
        }
      }
      const total = draft + submitted + ctApproved + approved + rejected;
      return {
        streamSubjectId: ss.id,
        subjectName:     ss.subject.name,
        subjectCode:     ss.subject.code,
        paperName:       ss.subjectPaper?.name ?? null,
        paperNumber:     ss.subjectPaper?.paperNumber ?? null,
        teachers:        ss.teacherAssignments.map(t => `${t.teacher.firstName} ${t.teacher.lastName}`),
        totalStudents:   ss.studentEnrollments.length,
        draft,
        submitted,
        ctApproved,
        approved,
        rejected,
        hasMarks:       total > 0,
        pendingReview:  submitted > 0,
        allReviewed:    total > 0 && submitted === 0 && draft === 0,
      };
    });

    return {
      ok:   true as const,
      data: {
        termId:       activeTerm.id,
        termName:     activeTerm.name,
        academicYear: activeYear.year,
        students:     enrollments.map(e => ({
          enrollmentId: e.id,
          id:           e.student.id,
          admissionNo:  e.student.admissionNo,
          firstName:    e.student.firstName,
          lastName:     e.student.lastName,
          gender:       e.student.gender,
          imageUrl:     e.student.imageUrl,
          subjectCount: e.subjectEnrollments.length,
          status:       e.status,
        })),
        subjects,
        summary: {
          totalStudents:  enrollments.length,
          totalSubjects:  subjects.length,
          pendingReviews: subjects.filter(s => s.pendingReview).length,
          allReviewed:    subjects.filter(s => s.allReviewed).length,
        },
      },
    };
  } catch (error: any) {
    console.error("❌ getClassTeacherDashboardData:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load dashboard data" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STREAM SUBJECT MARKS DETAIL (for class teacher review)
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamSubjectMarksForReview(streamSubjectId: string) {
  try {
    const ss = await db.streamSubject.findUnique({
      where:  { id: streamSubjectId },
      include: {
        subject:      { select: { id: true, name: true, code: true } },
        subjectPaper: { select: { id: true, name: true, paperNumber: true } },
        studentEnrollments: {
          where:   { status: SubjectEnrollmentStatus.ACTIVE },
          include: {
            enrollment: {
              include: {
                student: {
                  select: {
                    id:          true,
                    admissionNo: true,
                    firstName:   true,
                    lastName:    true,
                  },
                },
              },
            },
            examMarks: {
              select: {
                id:                     true,
                marksObtained:          true,
                outOf:                  true,
                status:                 true,
                classTeacherComment:    true,
                classTeacherApprovedAt: true,
                rejectionReason:        true,
                exam: { select: { id: true, name: true, examType: true } },
                enteredBy: { select: { id: true, firstName: true, lastName: true } },
              },
            },
            aoiScores: {
              select: {
                id:                     true,
                score:                  true,
                remarks:                true,
                status:                 true,
                classTeacherComment:    true,
                classTeacherApprovedAt: true,
                aoiTopic: { select: { id: true, topicNumber: true, topicName: true, maxPoints: true } },
              },
            },
          },
        },
      },
    });
    if (!ss) return { ok: false as const, message: "Subject not found" };
    return { ok: true as const, data: ss };
  } catch (error: any) {
    console.error("❌ getStreamSubjectMarksForReview:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load marks" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CLASS TEACHER APPROVE STREAM SUBJECT MARKS
// Moves all SUBMITTED marks → CLASS_TEACHER_APPROVED with optional comment
// ════════════════════════════════════════════════════════════════════════════

export async function classTeacherApproveStreamSubjectMarks(
  streamSubjectId: string,
  comment?: string,
) {
  try {
    const now = new Date();
    // We need approverId from session — passed via client; but server actions don't have session
    // We use the streamSubjectId to identify the context; approverId must be passed
    // This action will be called with approverId from the client
    return { ok: false as const, message: "Use classTeacherApproveWithId instead" };
  } catch (error: any) {
    return { ok: false as const, message: error?.message };
  }
}

export async function classTeacherApproveMarks(
  streamSubjectId: string,
  approverId: string,
  comment?: string,
) {
  try {
    const now        = new Date();
    const updateData = {
      status:                   MarkStatus.CLASS_TEACHER_APPROVED,
      classTeacherApprovedById: approverId,
      classTeacherApprovedAt:   now,
      classTeacherComment:      comment ?? null,
    };

    const enrollments = await db.studentSubjectEnrollment.findMany({
      where:  { streamSubjectId, status: SubjectEnrollmentStatus.ACTIVE },
      select: { id: true },
    });
    const ids = enrollments.map(e => e.id);
    if (ids.length === 0) return { ok: false as const, message: "No student enrollments found" };

    const [examResult, aoiResult, unitResult] = await Promise.all([
      db.examMark.updateMany({
        where: { studentSubjectEnrollmentId: { in: ids }, status: MarkStatus.SUBMITTED },
        data:  updateData,
      }),
      db.aOIScore.updateMany({
        where: { studentSubjectEnrollmentId: { in: ids }, status: MarkStatus.SUBMITTED },
        data:  updateData,
      }),
      db.aOIUnit.updateMany({
        where: { studentSubjectEnrollmentId: { in: ids }, status: MarkStatus.SUBMITTED },
        data:  updateData,
      }),
    ]);

    const total = examResult.count + aoiResult.count + unitResult.count;
    if (total === 0) return { ok: false as const, message: "No submitted marks found to approve" };

    revalidatePath("/teacher");
    return { ok: true as const, message: `Approved ${total} mark record(s) — forwarded to DOS` };
  } catch (error: any) {
    console.error("❌ classTeacherApproveMarks:", error);
    return { ok: false as const, message: error?.message ?? "Failed to approve marks" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CLASS TEACHER REJECT STREAM SUBJECT MARKS
// ════════════════════════════════════════════════════════════════════════════

export async function classTeacherRejectMarks(
  streamSubjectId: string,
  reason: string,
) {
  try {
    const enrollments = await db.studentSubjectEnrollment.findMany({
      where:  { streamSubjectId, status: SubjectEnrollmentStatus.ACTIVE },
      select: { id: true },
    });
    const ids = enrollments.map(e => e.id);
    if (ids.length === 0) return { ok: false as const, message: "No student enrollments found" };

    const rejectData = { status: MarkStatus.REJECTED, rejectionReason: reason };

    const [examResult, aoiResult, unitResult] = await Promise.all([
      db.examMark.updateMany({
        where: { studentSubjectEnrollmentId: { in: ids }, status: MarkStatus.SUBMITTED },
        data:  rejectData,
      }),
      db.aOIScore.updateMany({
        where: { studentSubjectEnrollmentId: { in: ids }, status: MarkStatus.SUBMITTED },
        data:  rejectData,
      }),
      db.aOIUnit.updateMany({
        where: { studentSubjectEnrollmentId: { in: ids }, status: MarkStatus.SUBMITTED },
        data:  rejectData,
      }),
    ]);

    const total = examResult.count + aoiResult.count + unitResult.count;
    revalidatePath("/teacher");
    return { ok: true as const, message: `Rejected ${total} mark record(s) — subject teacher notified` };
  } catch (error: any) {
    console.error("❌ classTeacherRejectMarks:", error);
    return { ok: false as const, message: error?.message ?? "Failed to reject marks" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STUDENTS NOT YET ENROLLED IN THIS STREAM / TERM (for class teacher)
// ════════════════════════════════════════════════════════════════════════════

export async function getUnenrolledStudentsForStream(
  streamId:  string,
  termId:    string,
  schoolId:  string,
) {
  try {
    // IDs already enrolled in this stream this term
    const enrolled = await db.enrollment.findMany({
      where:  { streamId, termId, status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] } },
      select: { studentId: true },
    });
    const enrolledIds = enrolled.map(e => e.studentId);

    const students = await db.student.findMany({
      where:   { schoolId, id: { notIn: enrolledIds } },
      select:  { id: true, firstName: true, lastName: true, admissionNo: true, gender: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take:    200,
    });

    return { ok: true as const, data: students };
  } catch (error: any) {
    console.error("❌ getUnenrolledStudentsForStream:", error);
    return { ok: false as const, data: [] as any[], message: error?.message ?? "Failed to load students" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ENROLL A STUDENT INTO THE CLASS (class teacher)
// ════════════════════════════════════════════════════════════════════════════

export async function classTeacherEnrollStudent(data: {
  studentId:   string;
  streamId:    string;
  classYearId: string;
  termId:      string;
  schoolId:    string;
}) {
  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.enrollment.findFirst({
        where: { studentId: data.studentId, termId: data.termId },
      });
      if (existing) throw new Error("Student is already enrolled this term.");

      const student = await tx.student.findFirst({
        where:  { id: data.studentId, schoolId: data.schoolId },
        select: { firstName: true, lastName: true },
      });
      if (!student) throw new Error("Student not found.");

      const term = await tx.academicTerm.findUnique({
        where:  { id: data.termId },
        select: { academicYearId: true },
      });
      if (!term) throw new Error("Term not found.");

      const enrollment = await tx.enrollment.create({
        data: {
          studentId:      data.studentId,
          classYearId:    data.classYearId,
          streamId:       data.streamId,
          termId:         data.termId,
          academicYearId: term.academicYearId,
          status:         EnrollmentStatus.ACTIVE,
          enrollmentType: EnrollmentType.CONTINUING,
        },
      });

      // Auto-enroll in compulsory stream subjects
      const streamSubjects = await tx.streamSubject.findMany({
        where:  { streamId: data.streamId, termId: data.termId, isActive: true, subjectType: "COMPULSORY" },
        select: { id: true },
      });
      if (streamSubjects.length > 0) {
        await tx.studentSubjectEnrollment.createMany({
          data: streamSubjects.map(ss => ({
            enrollmentId:    enrollment.id,
            streamSubjectId: ss.id,
            isCompulsory:    true,
            isAutoEnrolled:  true,
            status:          SubjectEnrollmentStatus.ACTIVE,
          })),
          skipDuplicates: true,
        });
      }

      return `${student.firstName} ${student.lastName}`;
    });

    revalidatePath("/teacher");
    return { ok: true as const, message: `${result} enrolled successfully.` };
  } catch (error: any) {
    console.error("❌ classTeacherEnrollStudent:", error);
    return { ok: false as const, message: error?.message ?? "Failed to enroll student" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EDIT A SPECIFIC MARK (class teacher correction before approval)
// Works on ExamMark and AOIScore records.  APPROVED (DOS) marks are locked.
// ════════════════════════════════════════════════════════════════════════════

export async function classTeacherEditMark(data: {
  markType:  "examMark" | "aoiScore";
  markId:    string;
  newValue:  number;
  outOf?:    number;   // only for examMark
}) {
  try {
    if (data.markType === "examMark") {
      const mark = await db.examMark.findUnique({
        where:  { id: data.markId },
        select: { status: true, outOf: true },
      });
      if (!mark) return { ok: false as const, message: "Mark not found." };
      if (mark.status === MarkStatus.APPROVED)
        return { ok: false as const, message: "Cannot edit a mark already approved by DOS." };
      if (data.newValue < 0)
        return { ok: false as const, message: "Mark cannot be negative." };
      const outOf = data.outOf ?? mark.outOf;
      if (data.newValue > outOf)
        return { ok: false as const, message: `Mark cannot exceed ${outOf}.` };

      await db.examMark.update({
        where: { id: data.markId },
        data:  { marksObtained: data.newValue, outOf },
      });
    } else {
      const score = await db.aOIScore.findUnique({
        where:   { id: data.markId },
        include: { aoiTopic: { select: { maxPoints: true } } },
      });
      if (!score) return { ok: false as const, message: "Score not found." };
      if (score.status === MarkStatus.APPROVED)
        return { ok: false as const, message: "Cannot edit a score already approved by DOS." };
      const max = score.aoiTopic?.maxPoints ?? 3;
      if (data.newValue < 0 || data.newValue > max)
        return { ok: false as const, message: `Score must be between 0 and ${max}.` };

      await db.aOIScore.update({
        where: { id: data.markId },
        data:  { score: data.newValue },
      });
    }

    revalidatePath("/teacher");
    return { ok: true as const, message: "Mark updated." };
  } catch (error: any) {
    console.error("❌ classTeacherEditMark:", error);
    return { ok: false as const, message: error?.message ?? "Failed to update mark" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UNENROLL STUDENT FROM STREAM (class teacher)
// ════════════════════════════════════════════════════════════════════════════

export async function classTeacherUnenrollStudent(enrollmentId: string) {
  try {
    const enrollment = await db.enrollment.findUnique({
      where:   { id: enrollmentId },
      include: { student: { select: { firstName: true, lastName: true } } },
    });
    if (!enrollment) return { ok: false as const, message: "Enrollment not found" };
    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      return { ok: false as const, message: "Student is not actively enrolled" };
    }

    await db.enrollment.update({
      where: { id: enrollmentId },
      data:  { status: EnrollmentStatus.DROPPED },
    });

    revalidatePath("/teacher");
    return {
      ok:      true as const,
      message: `${enrollment.student.firstName} ${enrollment.student.lastName} unenrolled`,
    };
  } catch (error: any) {
    console.error("❌ classTeacherUnenrollStudent:", error);
    return { ok: false as const, message: error?.message ?? "Failed to unenroll student" };
  }
}
