// actions/result-computation.ts
"use server";

import { db }             from "@/prisma/db";
import { revalidatePath } from "next/cache";

// ════════════════════════════════════════════════════════════════════════════
// GRADING — Uganda Primary (UNEB)
// D1(80-100,1pt) D2(75-79,2pt) C3(70-74,3pt) C4(65-69,4pt)
// C5(60-64,5pt)  C6(55-59,6pt) P7(50-54,7pt) P8(45-49,8pt) F9(<45,9pt)
// Aggregate = sum of best subject points (lower = better)
// Division I(≤6) II(7-14) III(15-20) IV(21-25) U(>25)
// ════════════════════════════════════════════════════════════════════════════

type GradeResult = { grade: string; descriptor: string; points: number; letter: string };

function getPrimaryGrade(pct: number): GradeResult {
  if (pct >= 80) return { grade: "D1", letter: "A", descriptor: "Excellent",    points: 1 };
  if (pct >= 75) return { grade: "D2", letter: "A", descriptor: "Very Good",    points: 2 };
  if (pct >= 70) return { grade: "C3", letter: "B", descriptor: "Good",         points: 3 };
  if (pct >= 65) return { grade: "C4", letter: "B", descriptor: "Good",         points: 4 };
  if (pct >= 60) return { grade: "C5", letter: "C", descriptor: "Satisfactory", points: 5 };
  if (pct >= 55) return { grade: "C6", letter: "C", descriptor: "Satisfactory", points: 6 };
  if (pct >= 50) return { grade: "P7", letter: "D", descriptor: "Pass",         points: 7 };
  if (pct >= 45) return { grade: "P8", letter: "D", descriptor: "Pass",         points: 8 };
  return               { grade: "F9", letter: "F", descriptor: "Fail",          points: 9 };
}

function getPrimaryDivision(aggregatePoints: number, totalSubjects: number): string {
  if (totalSubjects < 4)    return "U";
  if (aggregatePoints <= 6)  return "I";
  if (aggregatePoints <= 14) return "II";
  if (aggregatePoints <= 20) return "III";
  if (aggregatePoints <= 25) return "IV";
  return "U";
}

// ════════════════════════════════════════════════════════════════════════════
// COMPUTE RESULTS FOR ONE STREAM SUBJECT
// Writes SubjectResult + SubjectFinalMark for each enrolled student.
// Formula: total = (BOT/outOf)×botWeight + (MTE/outOf)×mteWeight + (EOT/outOf)×eotWeight
// ════════════════════════════════════════════════════════════════════════════

export async function computeStreamSubjectResults(data: {
  streamSubjectId: string;
  slug:            string;
}) {
  try {
    const { streamSubjectId } = data;

    const ss = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      include: {
        stream: { select: { classYearId: true } },
        studentEnrollments: {
          where: { status: "ACTIVE" },
          include: {
            examMarks: {
              where:   { status: "APPROVED" },
              include: { exam: { select: { examType: true, maxMarks: true } } },
            },
          },
        },
      },
    });

    if (!ss) return { ok: false as const, message: "Stream subject not found" };

    const { classYearId } = ss.stream;
    const termId          = ss.termId;

    const cfg = await db.classAssessmentConfig.findUnique({
      where: { classYearId_termId: { classYearId, termId } },
    });
    if (!cfg) return { ok: false as const, message: "Assessment config not found for this class/term" };

    let computed = 0;

    for (const se of ss.studentEnrollments) {
      const examMap: Record<string, { marks: number; outOf: number }> = {};
      se.examMarks.forEach(em => {
        examMap[em.exam.examType] = { marks: em.marksObtained, outOf: em.outOf };
      });

      const bot = examMap["BOT"];
      const mte = examMap["MTE"];
      const eot = examMap["EOT"];

      // Each exam contributes (marks/outOf) × weight%
      let totalPercentage = 0;
      if (cfg.hasBOT && bot) totalPercentage += (bot.marks / bot.outOf) * cfg.botWeight;
      if (cfg.hasMTE && mte) totalPercentage += (mte.marks / mte.outOf) * cfg.mteWeight;
      if (cfg.hasEOT && eot) totalPercentage += (eot.marks / eot.outOf) * cfg.eotWeight;
      totalPercentage = Math.min(100, totalPercentage);

      const gradeResult = getPrimaryGrade(totalPercentage);

      // SubjectResult — stores raw exam marks + computed total
      await db.subjectResult.upsert({
        where:  { studentSubjectEnrollmentId: se.id },
        update: {
          botMarks: bot?.marks ?? null,
          botOutOf: bot?.outOf ?? null,
          mteMarks: mte?.marks ?? null,
          mteOutOf: mte?.outOf ?? null,
          eotMarks: eot?.marks ?? null,
          eotOutOf: eot?.outOf ?? null,
          totalPercentage,
          finalGrade:      gradeResult.grade,
          gradeDescriptor: gradeResult.descriptor,
          computedAt:      new Date(),
        },
        create: {
          studentSubjectEnrollmentId: se.id,
          botMarks: bot?.marks ?? null,
          botOutOf: bot?.outOf ?? null,
          mteMarks: mte?.marks ?? null,
          mteOutOf: mte?.outOf ?? null,
          eotMarks: eot?.marks ?? null,
          eotOutOf: eot?.outOf ?? null,
          totalPercentage,
          finalGrade:      gradeResult.grade,
          gradeDescriptor: gradeResult.descriptor,
          computedAt:      new Date(),
        },
      });

      // SubjectFinalMark — the definitive mark used on report cards
      await db.subjectFinalMark.upsert({
        where:  { studentSubjectEnrollmentId: se.id },
        update: {
          totalPercentage,
          finalGrade:      gradeResult.grade,
          gradeDescriptor: gradeResult.descriptor,
          gradePoints:     gradeResult.points,
          pointsAwarded:   gradeResult.points,
          computedAt:      new Date(),
        },
        create: {
          studentSubjectEnrollmentId: se.id,
          totalPercentage,
          finalGrade:      gradeResult.grade,
          gradeDescriptor: gradeResult.descriptor,
          gradePoints:     gradeResult.points,
          pointsAwarded:   gradeResult.points,
          computedAt:      new Date(),
        },
      });

      computed++;
    }

    revalidatePath(`/school/${data.slug}/academics`);
    return {
      ok:      true as const,
      message: `Computed results for ${computed} student(s)`,
      count:   computed,
    };
  } catch (error: any) {
    console.error("❌ computeStreamSubjectResults:", error);
    return { ok: false as const, message: error?.message ?? "Failed to compute results" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPUTE RESULTS FOR AN ENTIRE STREAM (all subjects in a term)
// ════════════════════════════════════════════════════════════════════════════

export async function computeStreamResults(data: {
  streamId: string;
  termId:   string;
  slug:     string;
}) {
  try {
    const streamSubjects = await db.streamSubject.findMany({
      where:  { streamId: data.streamId, termId: data.termId, isActive: true },
      select: { id: true },
    });

    let total = 0;
    for (const ss of streamSubjects) {
      const r = await computeStreamSubjectResults({ streamSubjectId: ss.id, slug: data.slug });
      if (r.ok) total += (r as any).count ?? 0;
    }

    revalidatePath(`/school/${data.slug}/academics`);
    return {
      ok:      true as const,
      message: `Results computed for ${streamSubjects.length} subject(s), ${total} student record(s)`,
    };
  } catch (error: any) {
    console.error("❌ computeStreamResults:", error);
    return { ok: false as const, message: error?.message ?? "Failed to compute stream results" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GENERATE REPORT CARD FOR ONE ENROLLMENT
// Aggregates SubjectFinalMarks → ReportCard (aggregate points + division)
// ════════════════════════════════════════════════════════════════════════════

export async function generateReportCard(data: {
  enrollmentId: string;
  slug:         string;
}) {
  try {
    const { enrollmentId } = data;

    const enrollment = await db.enrollment.findUnique({
      where:   { id: enrollmentId },
      include: {
        subjectEnrollments: {
          where:   { status: "ACTIVE" },
          include: { subjectFinalMark: true },
        },
      },
    });
    if (!enrollment) return { ok: false as const, message: "Enrollment not found" };

    const finalMarks = enrollment.subjectEnrollments
      .map(se => se.subjectFinalMark)
      .filter(Boolean) as NonNullable<typeof enrollment.subjectEnrollments[0]["subjectFinalMark"]>[];

    if (finalMarks.length === 0) {
      return { ok: false as const, message: "No computed results found. Run result computation first." };
    }

    const totalSubjects   = finalMarks.length;
    const totalMarks      = finalMarks.reduce((s, m) => s + (m.totalPercentage ?? 0), 0);
    const averageMarks    = totalSubjects > 0 ? totalMarks / totalSubjects : 0;

    // Best subjects by grade points (lower = better), take best 8
    const sorted          = [...finalMarks].sort((a, b) => (a.gradePoints ?? 9) - (b.gradePoints ?? 9));
    const best            = sorted.slice(0, 8);
    const aggregatePoints = best.reduce((s, m) => s + (m.gradePoints ?? 9), 0);
    const division        = getPrimaryDivision(aggregatePoints, finalMarks.length);

    await db.reportCard.upsert({
      where:  { enrollmentId },
      update: { totalSubjects, totalMarks, averageMarks, outOf: 100, aggregatePoints, division, generatedAt: new Date() },
      create: { enrollmentId, totalSubjects, totalMarks, averageMarks, outOf: 100, aggregatePoints, division, generatedAt: new Date() },
    });

    revalidatePath(`/school/${data.slug}/academics`);
    return {
      ok:      true as const,
      message: `Report card generated — Agg: ${aggregatePoints}, Div ${division}`,
    };
  } catch (error: any) {
    console.error("❌ generateReportCard:", error);
    return { ok: false as const, message: error?.message ?? "Failed to generate report card" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GENERATE REPORT CARDS FOR AN ENTIRE STREAM
// ════════════════════════════════════════════════════════════════════════════

export async function generateStreamReportCards(data: {
  streamId: string;
  termId:   string;
  slug:     string;
}) {
  try {
    const enrollments = await db.enrollment.findMany({
      where:  { streamId: data.streamId, termId: data.termId, status: "ACTIVE" },
      select: { id: true },
    });

    let success = 0, failed = 0;
    for (const e of enrollments) {
      const r = await generateReportCard({ enrollmentId: e.id, slug: data.slug });
      if (r.ok) success++; else failed++;
    }

    revalidatePath(`/school/${data.slug}/academics`);
    return {
      ok:      true as const,
      message: `Generated ${success} report card(s)${failed > 0 ? `, ${failed} failed` : ""}`,
    };
  } catch (error: any) {
    console.error("❌ generateStreamReportCards:", error);
    return { ok: false as const, message: error?.message ?? "Failed to generate report cards" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPUTE + GENERATE FOR A SINGLE STUDENT
// ════════════════════════════════════════════════════════════════════════════

export async function computeAndGenerateStudentReportCard(data: {
  enrollmentId: string;
  slug:         string;
}) {
  try {
    const enrollment = await db.enrollment.findUnique({
      where:  { id: data.enrollmentId },
      select: { streamId: true, termId: true },
    });
    if (!enrollment)          return { ok: false as const, message: "Enrollment not found." };
    if (!enrollment.streamId) return { ok: false as const, message: "No stream assigned to this enrollment." };

    const r1 = await computeStreamResults({
      streamId: enrollment.streamId,
      termId:   enrollment.termId,
      slug:     data.slug,
    });
    if (!r1.ok) return r1;

    const r2 = await generateReportCard({ enrollmentId: data.enrollmentId, slug: data.slug });
    revalidatePath(`/school/${data.slug}/users/students`);
    return r2;
  } catch (error: any) {
    console.error("❌ computeAndGenerateStudentReportCard:", error);
    return { ok: false as const, message: error?.message ?? "Failed to generate report card." };
  }
}
