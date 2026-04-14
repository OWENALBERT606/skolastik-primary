// actions/marks-entry.ts
"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
// FIX [1-3]: Import MarkStatus and SubjectEnrollmentStatus enums.
import { MarkStatus, SubjectEnrollmentStatus } from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ActionResponse<T = null> = {
  ok: boolean;
  message: string;
  data?: T;
};


// ════════════════════════════════════════════════════════════════════════════
// LOCK GUARD HELPER
// ════════════════════════════════════════════════════════════════════════════

async function checkNotLocked(streamSubjectId: string | undefined): Promise<string | null> {
  // Guard: if no streamSubjectId is provided, allow entry (backward compat)
  if (!streamSubjectId) return null;

  try {
    // Find the ClassAssessmentConfig for this stream subject's class+term
    const ss = await db.streamSubject.findUnique({
      where:  { id: streamSubjectId },
      select: {
        termId: true,
        stream: { select: { classYear: { select: { id: true } } } },
      },
    });
    if (!ss) return null; // stream subject not found — don't block entry

    const cfg = await db.classAssessmentConfig.findUnique({
      where:  { classYearId_termId: { classYearId: ss.stream.classYear.id, termId: ss.termId } },
      select: { isLocked: true },
    });

    // If no config exists yet, allow entry (config not set up)
    // Only block if isLocked is explicitly true
    const locked = (cfg as any)?.isLocked === true;
    if (locked) return "Mark entry is locked for this class/term. Ask an administrator to unlock.";
    return null;
  } catch {
    // If anything fails in the lock check, allow entry rather than blocking
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 1. SAVE AOI TOPIC SCORES
// ════════════════════════════════════════════════════════════════════════════

export async function saveAOIScores(data: {
  aoiTopicId:      string;
  streamSubjectId?: string;  // needed for lock check (optional for backward compat)
  scores: Array<{
    studentSubjectEnrollmentId: string;
    score:         number;  // already converted (0–aoiMaxPoints) — dialog does raw→converted
    remarks?:      string;
    genericSkills?: string;
  }>;
  teacherId: string | null;
  schoolId:  string;
}): Promise<ActionResponse> {
  try {
    const { aoiTopicId, scores, teacherId, streamSubjectId } = data;

    // Lock guard
    const lockError = await checkNotLocked(streamSubjectId);
    if (lockError) return { ok: false, message: lockError };

    const aoiTopic = await db.aOITopic.findUnique({
      where: { id: aoiTopicId },
      include: {
        subjectPaper: {
          select: { id: true, paperNumber: true, name: true, paperCode: true },
        },
        classSubject: {
          select: { id: true, subject: { select: { name: true, code: true } } },
        },
      },
    });
    if (!aoiTopic) return { ok: false, message: "AOI topic not found" };

    const invalidScores = scores.filter(s => s.score < 0 || s.score > aoiTopic.maxPoints);
    if (invalidScores.length > 0) {
      return {
        ok: false,
        message: `Invalid scores detected. Scores must be between 0 and ${aoiTopic.maxPoints}`,
      };
    }

    const operations = scores.map((scoreData) => {
      const normalizedRemarks      = scoreData.remarks?.trim()       || null;
      const normalizedGenericSkills = scoreData.genericSkills?.trim() || null;

      return db.aOIScore.upsert({
        where: {
          aoiTopicId_studentSubjectEnrollmentId: {
            aoiTopicId,
            studentSubjectEnrollmentId: scoreData.studentSubjectEnrollmentId,
          },
        },
        update: {
          score:         scoreData.score,
          remarks:       normalizedRemarks,
          genericSkills: normalizedGenericSkills,
          enteredById:   teacherId ?? undefined,
          enteredAt:     teacherId ? new Date() : undefined,
          status:        MarkStatus.SUBMITTED,
        },
        create: {
          aoiTopicId,
          studentSubjectEnrollmentId: scoreData.studentSubjectEnrollmentId,
          score:         scoreData.score,
          remarks:       normalizedRemarks,
          genericSkills: normalizedGenericSkills,
          enteredById:   teacherId ?? undefined,
          enteredAt:     teacherId ? new Date() : undefined,
          status:        MarkStatus.SUBMITTED,
        },
      });
    });

    await db.$transaction(operations);
    revalidatePath(`/school/[slug]/academics/streams`);

    const paperInfo = aoiTopic.subjectPaper
      ? ` for ${aoiTopic.subjectPaper.name} (${aoiTopic.subjectPaper.paperCode})`
      : "";

    return { ok: true, message: `Successfully saved ${scores.length} AOI score(s)${paperInfo}` };
  } catch (error) {
    console.error("Save AOI scores error:", error);
    return { ok: false, message: "Failed to save AOI scores" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. SAVE AOI UNITS
// ════════════════════════════════════════════════════════════════════════════

export async function saveAOIUnits(data: {
  streamSubjectId?: string;  // needed for lock check (optional for backward compat)
  units: Array<{
    studentSubjectEnrollmentId: string;
    unitNumber:      number;
    score:           number;
    subjectPaperId?: string | null;
  }>;
  teacherId: string | null;
  schoolId:  string;
}): Promise<ActionResponse> {
  try {
    const { units, teacherId, streamSubjectId } = data;

    // Lock guard
    const lockError = await checkNotLocked(streamSubjectId);
    if (lockError) return { ok: false, message: lockError };

    const invalidUnits = units.filter(u => u.score < 0 || u.score > 3);
    if (invalidUnits.length > 0) {
      return { ok: false, message: "Invalid unit scores detected. Units must be between 0 and 3" };
    }

    const operations = units.map((unitData) => {
      if (!unitData.subjectPaperId) {
        // Single-paper subject
        return db.aOIUnit.upsert({
          where: {
            studentSubjectEnrollmentId_unitNumber: {
              studentSubjectEnrollmentId: unitData.studentSubjectEnrollmentId,
              unitNumber: unitData.unitNumber,
            },
          },
          update: {
            score: unitData.score, enteredById: teacherId,
            enteredAt: new Date(), status: MarkStatus.SUBMITTED,
          },
          create: {
            studentSubjectEnrollmentId: unitData.studentSubjectEnrollmentId,
            unitNumber: unitData.unitNumber, score: unitData.score,
            enteredById: teacherId, enteredAt: new Date(),
            status: MarkStatus.SUBMITTED,
          },
        });
      } else {
        // Multi-paper subject
        return db.aOIUnit.upsert({
          where: {
            studentSubjectEnrollmentId_unitNumber_subjectPaperId: {
              studentSubjectEnrollmentId: unitData.studentSubjectEnrollmentId,
              unitNumber:     unitData.unitNumber,
              subjectPaperId: unitData.subjectPaperId,
            },
          },
          update: {
            score: unitData.score, enteredById: teacherId,
            enteredAt: new Date(), status: MarkStatus.SUBMITTED,
          },
          create: {
            studentSubjectEnrollmentId: unitData.studentSubjectEnrollmentId,
            unitNumber:     unitData.unitNumber,
            score:          unitData.score,
            subjectPaperId: unitData.subjectPaperId,
            enteredById:    teacherId,
            enteredAt:      new Date(),
            status:         MarkStatus.SUBMITTED,
          },
        });
      }
    });

    await db.$transaction(operations);
    revalidatePath(`/school/[slug]/academics/streams`);

    const paperUnitsCount   = units.filter(u => u.subjectPaperId).length;
    const regularUnitsCount = units.length - paperUnitsCount;

    return {
      ok: true,
      message: `Successfully saved ${units.length} AOI unit(s)${
        paperUnitsCount > 0
          ? ` (${regularUnitsCount} regular, ${paperUnitsCount} paper-specific)`
          : ""
      }`,
    };
  } catch (error) {
    console.error("Save AOI units error:", error);
    return { ok: false, message: "Failed to save AOI units" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 3. SAVE EXAM MARKS
// ════════════════════════════════════════════════════════════════════════════

export async function saveExamMarks(data: {
  examId:           string;
  streamSubjectId?: string;
  marks: Array<{
    studentSubjectEnrollmentId: string;
    marksObtained: number;
    outOf:         number;
  }>;
  teacherId: string | null;
  schoolId:  string;
}): Promise<ActionResponse> {
  try {
    const { examId, marks, teacherId, streamSubjectId } = data;

    const lockError = await checkNotLocked(streamSubjectId);
    if (lockError) return { ok: false, message: lockError };

    const exam = await db.exam.findUnique({
      where:  { id: examId },
      select: { id: true, name: true, examType: true, maxMarks: true },
    });
    if (!exam) return { ok: false, message: "Exam not found" };

    const invalidMarks = marks.filter(m => m.marksObtained < 0 || m.marksObtained > m.outOf);
    if (invalidMarks.length > 0) {
      return { ok: false, message: "Invalid marks: cannot exceed maximum marks" };
    }

    const operations = marks.map(markData =>
      db.examMark.upsert({
        where: {
          examId_studentSubjectEnrollmentId: {
            examId,
            studentSubjectEnrollmentId: markData.studentSubjectEnrollmentId,
          },
        },
        update: {
          marksObtained: markData.marksObtained,
          outOf:         markData.outOf,
          enteredById:   teacherId,
          enteredAt:     new Date(),
          status:        MarkStatus.SUBMITTED,
        },
        create: {
          examId,
          studentSubjectEnrollmentId: markData.studentSubjectEnrollmentId,
          marksObtained: markData.marksObtained,
          outOf:         markData.outOf,
          enteredById:   teacherId,
          enteredAt:     new Date(),
          status:        MarkStatus.SUBMITTED,
        },
      })
    );

    await db.$transaction(operations);
    revalidatePath(`/school/[slug]/academics/streams`);

    return { ok: true, message: `Saved ${marks.length} mark(s) for ${exam.name}` };
  } catch (error) {
    console.error("Save exam marks error:", error);
    return { ok: false, message: "Failed to save exam marks" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. APPROVE AOI SCORES
// ════════════════════════════════════════════════════════════════════════════

export async function approveAOIScores(data: {
  scoreIds:   string[];
  approverId: string;
  schoolId:   string;
}): Promise<ActionResponse> {
  try {
    const { scoreIds, approverId } = data;

    await db.aOIScore.updateMany({
      where: { id: { in: scoreIds }, status: MarkStatus.SUBMITTED },
      data:  { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: new Date() },
    });

    revalidatePath(`/school/[slug]/academics/streams`);
    revalidatePath(`/school/[slug]/academics/approvals`);

    return { ok: true, message: `Approved ${scoreIds.length} AOI score(s)` };
  } catch (error) {
    console.error("Approve AOI scores error:", error);
    return { ok: false, message: "Failed to approve AOI scores" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 5. APPROVE AOI UNITS
// ════════════════════════════════════════════════════════════════════════════

export async function approveAOIUnits(data: {
  unitIds:    string[];
  approverId: string;
  schoolId:   string;
}): Promise<ActionResponse> {
  try {
    const { unitIds, approverId } = data;

    await db.aOIUnit.updateMany({
      where: { id: { in: unitIds }, status: MarkStatus.SUBMITTED },
      data:  { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: new Date() },
    });

    revalidatePath(`/school/[slug]/academics/streams`);
    revalidatePath(`/school/[slug]/academics/approvals`);

    return { ok: true, message: `Approved ${unitIds.length} AOI unit(s)` };
  } catch (error) {
    console.error("Approve AOI units error:", error);
    return { ok: false, message: "Failed to approve AOI units" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 6. APPROVE EXAM MARKS
// ════════════════════════════════════════════════════════════════════════════

export async function approveExamMarks(data: {
  markIds:    string[];
  approverId: string;
  schoolId:   string;
}): Promise<ActionResponse> {
  try {
    const { markIds, approverId } = data;

    await db.examMark.updateMany({
      where: { id: { in: markIds }, status: MarkStatus.SUBMITTED },
      data:  { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: new Date() },
    });

    revalidatePath(`/school/[slug]/academics/streams`);
    revalidatePath(`/school/[slug]/academics/approvals`);

    return { ok: true, message: `Approved ${markIds.length} exam mark(s)` };
  } catch (error) {
    console.error("Approve exam marks error:", error);
    return { ok: false, message: "Failed to approve exam marks" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 7. REJECT MARKS
// ════════════════════════════════════════════════════════════════════════════

export async function rejectMarks(data: {
  markType:        "AOI_SCORE" | "AOI_UNIT" | "EXAM_MARK";
  markIds:         string[];
  rejectionReason: string;
  approverId:      string;
  schoolId:        string;
}): Promise<ActionResponse> {
  try {
    const { markType, markIds, rejectionReason, approverId } = data;

    if (markType === "AOI_SCORE") {
      await db.aOIScore.updateMany({
        where: { id: { in: markIds } },
        data:  { status: MarkStatus.REJECTED, approvedById: approverId, approvedAt: new Date() },
      });
    } else if (markType === "AOI_UNIT") {
      await db.aOIUnit.updateMany({
        where: { id: { in: markIds } },
        data:  { status: MarkStatus.REJECTED, approvedById: approverId, approvedAt: new Date() },
      });
    } else if (markType === "EXAM_MARK") {
      await db.examMark.updateMany({
        where: { id: { in: markIds } },
        data:  {
          status:          MarkStatus.REJECTED,
          approvedById:    approverId,
          approvedAt:      new Date(),
          rejectionReason,
        },
      });
    }

    revalidatePath(`/school/[slug]/academics/streams`);
    revalidatePath(`/school/[slug]/academics/approvals`);

    return { ok: true, message: `Rejected ${markIds.length} mark(s)` };
  } catch (error) {
    console.error("Reject marks error:", error);
    return { ok: false, message: "Failed to reject marks" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 8. DELETE MARKS (Before approval)
// ════════════════════════════════════════════════════════════════════════════

export async function deleteMarks(data: {
  markType: "AOI_SCORE" | "AOI_UNIT" | "EXAM_MARK";
  markIds:  string[];
  schoolId: string;
  userId:   string;
}): Promise<ActionResponse> {
  try {
    const { markType, markIds } = data;

    if (markType === "AOI_SCORE") {
      const approvedCount = await db.aOIScore.count({
        where: { id: { in: markIds }, status: MarkStatus.APPROVED },
      });
      if (approvedCount > 0) return { ok: false, message: "Cannot delete approved scores" };
      await db.aOIScore.deleteMany({ where: { id: { in: markIds } } });

    } else if (markType === "AOI_UNIT") {
      const approvedCount = await db.aOIUnit.count({
        where: { id: { in: markIds }, status: MarkStatus.APPROVED },
      });
      if (approvedCount > 0) return { ok: false, message: "Cannot delete approved units" };
      await db.aOIUnit.deleteMany({ where: { id: { in: markIds } } });

    } else if (markType === "EXAM_MARK") {
      const approvedCount = await db.examMark.count({
        where: { id: { in: markIds }, status: MarkStatus.APPROVED },
      });
      if (approvedCount > 0) return { ok: false, message: "Cannot delete approved marks" };
      await db.examMark.deleteMany({ where: { id: { in: markIds } } });
    }

    revalidatePath(`/school/[slug]/academics/streams`);
    return { ok: true, message: `Deleted ${markIds.length} mark(s)` };
  } catch (error) {
    console.error("Delete marks error:", error);
    return { ok: false, message: "Failed to delete marks" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 9. GET MARKS STATISTICS FOR STREAM SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function getMarksStatistics(streamSubjectId: string, schoolId: string) {
  try {
    const enrollments = await db.studentSubjectEnrollment.findMany({
      where: {
        streamSubjectId,
        // FIX [1]: SubjectEnrollmentStatus enum
        status: SubjectEnrollmentStatus.ACTIVE,
      },
      include: {
        aoiScores: true,
        aoiUnits:  true,
        examMarks: true,
        paperResults: {
          include: {
            subjectPaper: { select: { paperCode: true, name: true } },
          },
        },
      },
    });

    const totalStudents = enrollments.length;

    const studentsWithAOIScores = enrollments.filter(e => e.aoiScores.length > 0).length;
    const aoiScoresSubmitted    = enrollments.reduce((sum, e) =>
      sum + e.aoiScores.filter(s => s.status === MarkStatus.SUBMITTED).length, 0);
    const aoiScoresApproved     = enrollments.reduce((sum, e) =>
      sum + e.aoiScores.filter(s => s.status === MarkStatus.APPROVED).length, 0);

    const studentsWithAOIUnits = enrollments.filter(e => e.aoiUnits.length > 0).length;
    const aoiUnitsSubmitted    = enrollments.reduce((sum, e) =>
      sum + e.aoiUnits.filter(u => u.status === MarkStatus.SUBMITTED).length, 0);
    const aoiUnitsApproved     = enrollments.reduce((sum, e) =>
      sum + e.aoiUnits.filter(u => u.status === MarkStatus.APPROVED).length, 0);

    const studentsWithExamMarks = enrollments.filter(e => e.examMarks.length > 0).length;
    const examMarksSubmitted    = enrollments.reduce((sum, e) =>
      sum + e.examMarks.filter(m => m.status === MarkStatus.SUBMITTED).length, 0);
    const examMarksApproved     = enrollments.reduce((sum, e) =>
      sum + e.examMarks.filter(m => m.status === MarkStatus.APPROVED).length, 0);

    const studentsWithPaperResults = enrollments.filter(e => e.paperResults.length > 0).length;

    return {
      ok: true,
      data: {
        totalStudents,
        aoiScores: {
          studentsWithScores: studentsWithAOIScores,
          submitted:          aoiScoresSubmitted,
          approved:           aoiScoresApproved,
          completionRate:     totalStudents > 0
            ? ((studentsWithAOIScores / totalStudents) * 100).toFixed(1) : "0",
        },
        aoiUnits: {
          studentsWithUnits: studentsWithAOIUnits,
          submitted:         aoiUnitsSubmitted,
          approved:          aoiUnitsApproved,
          completionRate:    totalStudents > 0
            ? ((studentsWithAOIUnits / totalStudents) * 100).toFixed(1) : "0",
        },
        examMarks: {
          studentsWithMarks: studentsWithExamMarks,
          submitted:         examMarksSubmitted,
          approved:          examMarksApproved,
          completionRate:    totalStudents > 0
            ? ((studentsWithExamMarks / totalStudents) * 100).toFixed(1) : "0",
        },
        paperResults: {
          studentsWithResults: studentsWithPaperResults,
          completionRate:      totalStudents > 0
            ? ((studentsWithPaperResults / totalStudents) * 100).toFixed(1) : "0",
        },
      },
      message: "",
    };
  } catch (error) {
    console.error("Get marks statistics error:", error);
    return { ok: false, data: null, message: "Failed to fetch statistics" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 10. BULK APPROVE ALL MARKS FOR STREAM SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function bulkApproveAllMarks(data: {
  streamSubjectId: string;
  approverId:      string;
  schoolId:        string;
}): Promise<ActionResponse> {
  try {
    const { streamSubjectId, approverId } = data;

    await db.aOIScore.updateMany({
      where: {
        studentSubjectEnrollment: { streamSubjectId },
        status: MarkStatus.SUBMITTED,
      },
      data: { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: new Date() },
    });

    await db.aOIUnit.updateMany({
      where: {
        studentSubjectEnrollment: { streamSubjectId },
        status: MarkStatus.SUBMITTED,
      },
      data: { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: new Date() },
    });

    await db.examMark.updateMany({
      where: {
        studentSubjectEnrollment: { streamSubjectId },
        status: MarkStatus.SUBMITTED,
      },
      data: { status: MarkStatus.APPROVED, approvedById: approverId, approvedAt: new Date() },
    });

    revalidatePath(`/school/[slug]/academics/streams`);
    revalidatePath(`/school/[slug]/academics/approvals`);

    return { ok: true, message: "Successfully approved all pending marks" };
  } catch (error) {
    console.error("Bulk approve error:", error);
    return { ok: false, message: "Failed to approve marks" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 11. SAVE PROJECT SCORES
// Upserts projectScore on SubjectResult for each student enrollment.
// ════════════════════════════════════════════════════════════════════════════

export async function saveProjectScores(data: {
  streamSubjectId: string;
  projectMaxScore: number;
  scores: Array<{
    studentSubjectEnrollmentId: string;
    score: number | null;
  }>;
  schoolId: string;
}): Promise<ActionResponse> {
  try {
    const { streamSubjectId, projectMaxScore, scores } = data;

    // Lock guard
    const lockError = await checkNotLocked(streamSubjectId);
    if (lockError) return { ok: false, message: lockError };

    const ops = scores
      .filter((s) => s.score !== null)
      .map((s) =>
        db.subjectResult.upsert({
          where:  { studentSubjectEnrollmentId: s.studentSubjectEnrollmentId },
          update: { projectScore: s.score, projectOutOf: projectMaxScore },
          create: {
            studentSubjectEnrollmentId: s.studentSubjectEnrollmentId,
            projectScore: s.score,
            projectOutOf: projectMaxScore,
          },
        })
      );

    await db.$transaction(ops);
    revalidatePath(`/school/[slug]/academics/streams`);

    return { ok: true, message: `Saved project scores for ${ops.length} student(s)` };
  } catch (error) {
    console.error("saveProjectScores error:", error);
    return { ok: false, message: "Failed to save project scores" };
  }
}
