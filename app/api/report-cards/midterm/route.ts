// app/api/report-cards/midterm/route.ts
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
      where:   { streamId, termId, status: "ACTIVE" },
      include: {
        student:   { select: { firstName: true, lastName: true, admissionNo: true, gender: true, dob: true, imageUrl: true } },
        classYear: { include: { classTemplate: { select: { name: true } } } },
        stream:    { select: { name: true } },
        subjectEnrollments: {
          where:   { status: "ACTIVE" },
          include: {
            streamSubject: {
              include: {
                subject:      { select: { id: true, name: true, code: true } },
                subjectPaper: { select: { id: true, paperNumber: true, name: true } },
                teacherAssignments: {
                  where:   { status: "ACTIVE" },
                  include: { teacher: { select: { firstName: true, lastName: true } } },
                  take:    1,
                },
              },
            },
            subjectResult: true,
            aoiScores: {
              include: {
                aoiTopic: {
                  select: { id: true, topicNumber: true, topicName: true, description: true, maxPoints: true },
                },
              },
              orderBy: { aoiTopic: { topicNumber: "asc" } },
            },
            examMarks: {
              include: { exam: { select: { id: true, name: true, examType: true, maxMarks: true } } },
              orderBy: { exam: { examType: "asc" } },
            },
          },
          orderBy: { streamSubject: { subject: { name: "asc" } } },
        },
      },
      orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
    });

    const cards = enrollments.map(enrollment => {
      // Group subject enrollments by subjectId (combine papers under same subject)
      const subjectMap = new Map<string, {
        subjectId:   string;
        subjectName: string;
        subjectCode: string | null;
        papers: Array<{
          paperId:     string | null;
          paperNumber: number | null;
          paperName:   string | null;
          aoiTopics: Array<{
            topicNumber:  number;
            topicName:    string;
            description:  string | null;
            maxPoints:    number;
            score:        number | null;
            remarks:      string | null;
            status:       string;
          }>;
          botMarks:  number | null;
          botOutOf:  number | null;
          mteMarks:  number | null;
          mteOutOf:  number | null;
        }>;
      }>();

      for (const se of enrollment.subjectEnrollments) {
        const subjectId   = se.streamSubject.subjectId;
        const paperId     = se.streamSubject.subjectPaper?.id ?? null;
        const paperNumber = se.streamSubject.subjectPaper?.paperNumber ?? null;
        const paperName   = se.streamSubject.subjectPaper?.name ?? null;
        const sr          = (se as any).subjectResult ?? null;

        // Build AOI topics for this paper
        const aoiTopics = se.aoiScores.map(sc => ({
          topicNumber:  sc.aoiTopic.topicNumber,
          topicName:    sc.aoiTopic.topicName,
          description:  sc.aoiTopic.description ?? null,
          maxPoints:    sc.aoiTopic.maxPoints,
          score:        sc.score ?? null,
          remarks:      sc.remarks ?? null,
          status:       sc.status,
        }));

        // BOT / MTE marks for this paper
        const botMark = se.examMarks.find(em => em.exam.examType === "BOT");
        const mteMark = se.examMarks.find(em => em.exam.examType === "MTE");

        const paperEntry = {
          paperId,
          paperNumber,
          paperName,
          aoiTopics,
          botMarks: botMark?.marksObtained ?? sr?.botMarks ?? null,
          botOutOf: botMark?.outOf         ?? sr?.botOutOf ?? null,
          mteMarks: mteMark?.marksObtained ?? sr?.mteMarks ?? null,
          mteOutOf: mteMark?.outOf         ?? sr?.mteOutOf ?? null,
        };

        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            subjectId,
            subjectName: se.streamSubject.subject.name,
            subjectCode: se.streamSubject.subject.code,
            papers: [paperEntry],
          });
        } else {
          subjectMap.get(subjectId)!.papers.push(paperEntry);
        }
      }

      return {
        enrollmentId: enrollment.id,
        studentName:  `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        admissionNo:  enrollment.student.admissionNo,
        gender:       enrollment.student.gender,
        dob:          enrollment.student.dob?.toISOString().split("T")[0] ?? "",
        imageUrl:     enrollment.student.imageUrl ?? null,
        className:    enrollment.classYear.classTemplate.name,
        streamName:   enrollment.stream?.name ?? "",
        subjects:     Array.from(subjectMap.values()),
      };
    });

    return NextResponse.json(cards);
  } catch (error: any) {
    console.error("❌ midterm report-cards API:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to load midterm data" }, { status: 500 });
  }
}
