// app/api/report-cards/route.ts
import { db }            from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

function getPrimaryGrade(pct: number | null): string | null {
  if (pct == null) return null;
  if (pct >= 80) return "D1";
  if (pct >= 75) return "D2";
  if (pct >= 70) return "C3";
  if (pct >= 65) return "C4";
  if (pct >= 60) return "C5";
  if (pct >= 55) return "C6";
  if (pct >= 50) return "P7";
  if (pct >= 45) return "P8";
  return "F9";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const streamId  = searchParams.get("streamId");
  const termId    = searchParams.get("termId");
  const studentId = searchParams.get("studentId");

  if (!streamId || !termId) {
    return NextResponse.json({ error: "streamId and termId required" }, { status: 400 });
  }

  try {
    const enrollments = await db.enrollment.findMany({
      where: {
        streamId, termId,
        status: { in: ["ACTIVE", "COMPLETED"] },
        ...(studentId ? { studentId } : {}),
      },
      include: {
        student: {
          select: {
            firstName: true, lastName: true,
            admissionNo: true, gender: true, dob: true, imageUrl: true,
          },
        },
        classYear: {
          include: { classTemplate: { select: { name: true, code: true } } },
        },
        stream:     { select: { name: true } },
        reportCard: true,
        subjectEnrollments: {
          where:   { status: { in: ["ACTIVE", "COMPLETED"] } },
          include: {
            streamSubject: {
              include: {
                subject: { select: { name: true, code: true, category: true } },
                teacherAssignments: {
                  where:   { status: "ACTIVE" },
                  include: { teacher: { select: { firstName: true, lastName: true } } },
                  take:    1,
                },
              },
            },
            subjectFinalMark: true,
            subjectResult:    true,
          },
          orderBy: { streamSubject: { subject: { name: "asc" } } },
        },
      },
      orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
    });

    if (enrollments.length === 0) {
      return NextResponse.json([]);
    }

    // Assessment config for exam weights display
    const classYearId      = enrollments[0].classYearId;
    const assessmentConfig = await db.classAssessmentConfig.findUnique({
      where: { classYearId_termId: { classYearId, termId } },
    });

    const cards = enrollments.map(enrollment => {
      const rc = enrollment.reportCard;

      const subjects = enrollment.subjectEnrollments.map(se => {
        const subject     = se.streamSubject.subject;
        const teacher     = se.streamSubject.teacherAssignments[0]?.teacher;
        const sr          = se.subjectResult;
        const fm          = se.subjectFinalMark;

        const botPct = sr?.botMarks != null && sr?.botOutOf
          ? Math.round((sr.botMarks / sr.botOutOf) * 100 * 10) / 10 : null;
        const mtePct = sr?.mteMarks != null && sr?.mteOutOf
          ? Math.round((sr.mteMarks / sr.mteOutOf) * 100 * 10) / 10 : null;
        const eotPct = sr?.eotMarks != null && sr?.eotOutOf
          ? Math.round((sr.eotMarks / sr.eotOutOf) * 100 * 10) / 10 : null;

        const totalPercentage = fm?.totalPercentage ?? sr?.totalPercentage ?? null;
        const finalGrade      = fm?.finalGrade ?? getPrimaryGrade(totalPercentage);
        const gradeDescriptor = fm?.gradeDescriptor ?? null;
        const gradePoints     = fm?.gradePoints ?? null;

        return {
          subjectName:      subject.name,
          subjectCode:      subject.code,
          category:         subject.category,
          teacherName:      teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
          botRaw:           sr?.botMarks != null ? `${sr.botMarks}/${sr.botOutOf}` : null,
          mteRaw:           sr?.mteMarks != null ? `${sr.mteMarks}/${sr.mteOutOf}` : null,
          eotRaw:           sr?.eotMarks != null ? `${sr.eotMarks}/${sr.eotOutOf}` : null,
          botPct, mtePct, eotPct,
          totalPercentage,
          finalGrade,
          gradeDescriptor,
          gradePoints,
        };
      });

      return {
        enrollmentId:        enrollment.id,
        studentName:         `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        admissionNo:         enrollment.student.admissionNo,
        gender:              enrollment.student.gender,
        dob:                 enrollment.student.dob?.toISOString().split("T")[0] ?? "",
        imageUrl:            enrollment.student.imageUrl ?? null,
        className:           enrollment.classYear.classTemplate.name,
        classCode:           enrollment.classYear.classTemplate.code,
        streamName:          enrollment.stream?.name ?? "",
        averageMark:         rc?.averageMarks   ?? null,
        aggregatePoints:     rc?.aggregatePoints ?? null,
        division:            rc?.division        ?? null,
        classTeacherComment: rc?.classTeacherComment ?? null,
        headTeacherComment:  rc?.headTeacherComment  ?? null,
        isPublished:         rc?.isPublished ?? false,
        subjects,
        examWeights: {
          hasBOT:    assessmentConfig?.hasBOT    ?? false,
          hasMTE:    assessmentConfig?.hasMTE    ?? true,
          hasEOT:    assessmentConfig?.hasEOT    ?? true,
          botWeight: assessmentConfig?.botWeight ?? 0,
          mteWeight: assessmentConfig?.mteWeight ?? 50,
          eotWeight: assessmentConfig?.eotWeight ?? 50,
        },
      };
    });

    // Compute class position based on total score (highest = 1st)
    const withTotals = cards.map(card => {
      const subjectTotals = card.subjects
        .map(s => s.totalPercentage)
        .filter((v): v is number => v !== null);
      const overallAvg = subjectTotals.length > 0
        ? subjectTotals.reduce((a, b) => a + b, 0) / subjectTotals.length
        : null;
      const totalScore = subjectTotals.length > 0
        ? subjectTotals.reduce((a, b) => a + b, 0)
        : null;
      return { ...card, overallAvg, totalScore };
    });

    // Sort by totalScore descending, assign position
    const sorted = [...withTotals].sort((a, b) => (b.totalScore ?? -1) - (a.totalScore ?? -1));
    const positionMap = new Map<string, number>();
    sorted.forEach((c, i) => positionMap.set(c.enrollmentId, i + 1));

    const finalCards = withTotals.map(card => ({
      ...card,
      overallAvg:    card.overallAvg,
      totalScore:    card.totalScore,
      classPosition: positionMap.get(card.enrollmentId) ?? null,
      outOf:         cards.length,
    }));

    return NextResponse.json(finalCards);
  } catch (error: any) {
    console.error("❌ report-cards API:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to load report cards" }, { status: 500 });
  }
}
