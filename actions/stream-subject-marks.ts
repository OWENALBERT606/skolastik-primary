// actions/stream-subject-marks.ts
"use server";

import { db } from "@/prisma/db";

// ════════════════════════════════════════════════════════════════════════════
// GET ALL DATA NEEDED BY THE MARKS ENTRY PAGE
//
// Returns for a given streamSubjectId:
//   - student enrollments with their exam marks
//   - exams (BOT/MTE/EOT) for the class year + term
//   - assessmentConfig (weights)
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamSubjectMarksData(streamSubjectId: string) {
  try {
    if (!streamSubjectId) {
      return { ok: false as const, message: "Stream subject ID is required" };
    }

    // 1. Load core streamSubject
    const ss = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      select: {
        id:             true,
        classSubjectId: true,
        termId:         true,
        subjectType:    true,
        subject: { select: { id: true, name: true, code: true, category: true } },
        stream: {
          select: {
            id:          true,
            name:        true,
            classYearId: true,
            schoolId:    true,
            classYear: {
              select: {
                classTemplate: { select: { name: true, code: true } },
                academicYear:  { select: { year: true } },
              },
            },
          },
        },
        term: { select: { id: true, name: true, termNumber: true } },
        teacherAssignments: {
          where:   { status: "ACTIVE" },
          include: { teacher: { select: { id: true, firstName: true, lastName: true, staffNo: true } } },
        },
      },
    });

    if (!ss) return { ok: false as const, message: "Stream subject not found" };

    const { classSubjectId, termId } = ss;
    const { classYearId, schoolId }  = ss.stream;

    // 2. Parallel fetch
    const [enrollments, exams, assessmentConfig] = await Promise.all([

      // Student enrollments with exam marks
      db.studentSubjectEnrollment.findMany({
        where:   { streamSubjectId, status: "ACTIVE" },
        include: {
          enrollment: {
            select: {
              id: true,
              student: {
                select: {
                  id: true, firstName: true, lastName: true,
                  admissionNo: true, gender: true,
                },
              },
            },
          },
          examMarks: {
            include: {
              exam: { select: { id: true, name: true, examType: true, maxMarks: true } },
            },
          },
          subjectResult:    true,
          subjectFinalMark: true,
        },
        orderBy: { enrollment: { student: { lastName: "asc" } } },
      }),

      // Exams for this class year + term
      db.exam.findMany({
        where:   { classYearId, termId },
        orderBy: { examType: "asc" },
        select:  { id: true, name: true, examType: true, maxMarks: true, date: true },
      }),

      // Assessment config
      db.classAssessmentConfig.findUnique({
        where: { classYearId_termId: { classYearId, termId } },
      }),
    ]);

    // 3. Per-student summaries
    const studentSummaries = enrollments.map(se => {
      const marksByType = se.examMarks.reduce((acc, em) => {
        acc[em.exam.examType] = { marks: em.marksObtained, outOf: em.outOf, status: em.status };
        return acc;
      }, {} as Record<string, { marks: number; outOf: number; status: string }>);

      const bot = marksByType["BOT"] ?? null;
      const mte = marksByType["MTE"] ?? null;
      const eot = marksByType["EOT"] ?? null;

      // Live total — apply configured weights directly (no normalisation)
      // Each exam contributes: (marks/outOf) × weight%
      // Total = sum of contributions (max 100%)
      let liveTotal: number | null = null;
      if (assessmentConfig) {
        const cfg = assessmentConfig;
        let total = 0;
        let hasAny = false;

        if (cfg.hasBOT && bot) {
          total += (bot.marks / bot.outOf) * cfg.botWeight;
          hasAny = true;
        }
        if (cfg.hasMTE && mte) {
          total += (mte.marks / mte.outOf) * cfg.mteWeight;
          hasAny = true;
        }
        if (cfg.hasEOT && eot) {
          total += (eot.marks / eot.outOf) * cfg.eotWeight;
          hasAny = true;
        }

        if (hasAny) liveTotal = Math.min(100, total);
      }

      const totalMark = se.subjectResult?.totalPercentage ?? liveTotal;

      return {
        enrollmentId: se.id,
        studentId:    se.enrollment.student.id,
        studentName:  `${se.enrollment.student.firstName} ${se.enrollment.student.lastName}`,
        admissionNo:  se.enrollment.student.admissionNo,
        gender:       se.enrollment.student.gender,
        bot:          bot?.marks ?? null,
        mte:          mte?.marks ?? null,
        eot:          eot?.marks ?? null,
        totalMark,
        finalGrade:   se.subjectFinalMark?.finalGrade ?? null,
        hasResult:    !!se.subjectResult,
        examMarks:    se.examMarks,
      };
    });

    const totalStudents = enrollments.length;
    const withResults   = enrollments.filter(se => se.subjectResult).length;
    const withMarks     = enrollments.filter(se => se.examMarks.length > 0).length;

    return {
      ok:   true as const,
      data: {
        streamSubjectId,
        classSubjectId,
        termId,
        classYearId,
        schoolId,
        subject:          ss.subject,
        stream:           ss.stream,
        term:             ss.term,
        teacherAssignments: ss.teacherAssignments,
        enrollments,
        exams,
        assessmentConfig,
        studentSummaries,
        stats: {
          totalStudents,
          withResults,
          withMarks,
          completionPercent: totalStudents > 0
            ? Math.round((withResults / totalStudents) * 100)
            : 0,
        },
      },
    };
  } catch (error: any) {
    console.error("❌ getStreamSubjectMarksData:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load marks data" };
  }
}
