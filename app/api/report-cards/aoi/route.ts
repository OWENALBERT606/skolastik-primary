// app/api/report-cards/aoi/route.ts
import { db }            from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const streamId = searchParams.get("streamId");
  const termId   = searchParams.get("termId");

  if (!streamId || !termId) {
    return NextResponse.json({ error: "streamId and termId required" }, { status: 400 });
  }

  try {
    const enrollments = await db.enrollment.findMany({
      where: { streamId, termId, status: { in: ["ACTIVE", "COMPLETED"] } },
      include: {
        student:   { select: { firstName: true, lastName: true, admissionNo: true, gender: true, imageUrl: true } },
        classYear: { include: { classTemplate: { select: { name: true } } } },
        stream:    { select: { name: true } },
        subjectEnrollments: {
          where:   { status: { in: ["ACTIVE", "COMPLETED"] } },
          include: {
            streamSubject: {
              include: {
                subject:      { select: { name: true, code: true } },
                subjectPaper: { select: { paperNumber: true, name: true } },
              },
            },
            aoiScores: {
              include: {
                aoiTopic: {
                  select: {
                    topicNumber: true,
                    topicName:   true,
                    competence:  true,
                    maxPoints:   true,
                  },
                },
              },
              orderBy: { aoiTopic: { topicNumber: "asc" } },
            },
            subjectResult: { select: { aoiContribution: true } },
          },
          orderBy: [
            { streamSubject: { subject: { name: "asc" } } },
            { streamSubject: { subjectPaper: { paperNumber: "asc" } } },
          ],
        },
      },
      orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
    });

    // Fetch assessment config for display flags
    const classYearId = enrollments[0]?.classYearId ?? null;
    const config = classYearId ? await db.classAssessmentConfig.findUnique({
      where:  { classYearId_termId: { classYearId, termId } },
      select: {
        aoiWeight:            true,
        aoiMaxPoints:         true,
        showAOICompetence:    true,
        showAOIGenericSkills: true,
        showAOIRemarks:       true,
      },
    }) : null;

    const cards = enrollments.map(enrollment => {
      // Use a Map to deduplicate by subjectId (multiple papers share one AOI set)
      const subjectMap = new Map<string, any>();

      for (const se of enrollment.subjectEnrollments) {
        const subjectId = se.streamSubject.subjectId;
        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            subjectName:     se.streamSubject.subject.name,
            subjectCode:     se.streamSubject.subject.code,
            aoiContribution: (se.subjectResult as any)?.aoiContribution ?? null,
            topics: se.aoiScores.map(sc => ({
              topicNumber:  sc.aoiTopic.topicNumber,
              topicName:    sc.aoiTopic.topicName,
              competence:   sc.aoiTopic.competence ?? null,
              score:        sc.score,
              maxScore:     sc.aoiTopic.maxPoints ?? 3,
              genericSkills: (sc as any).genericSkills ?? null,
              remarks:       (sc as any).remarks       ?? null,
            })),
          });
        }
      }

      return {
        enrollmentId: enrollment.id,
        studentName:  `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        admissionNo:  enrollment.student.admissionNo,
        gender:       enrollment.student.gender,
        imageUrl:     enrollment.student.imageUrl ?? null,
        className:    enrollment.classYear.classTemplate.name,
        streamName:   enrollment.stream?.name ?? "",
        subjects:     Array.from(subjectMap.values()).filter(s => s.topics.length > 0),
      };
    });

    return NextResponse.json({
      cards,
      config: {
        aoiWeight:            config?.aoiWeight            ?? 20,
        aoiMaxPoints:         config?.aoiMaxPoints         ?? 3,
        showAOICompetence:    config?.showAOICompetence    ?? true,
        showAOIGenericSkills: config?.showAOIGenericSkills ?? true,
        showAOIRemarks:       config?.showAOIRemarks       ?? true,
      },
    });
  } catch (error: any) {
    console.error("❌ AOI report API:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to load AOI report data" }, { status: 500 });
  }
}
