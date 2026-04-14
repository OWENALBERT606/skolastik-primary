// actions/class-settings.ts
"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { ExamType } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";

// ════════════════════════════════════════════════════════════════════════════
// GET CLASS SETTINGS
// Returns everything the settings tab needs in one call:
//   - classYear with template name, classLevel
//   - terms with their exams and assessmentConfig
//   - classSubjects with their AOI topics
// ════════════════════════════════════════════════════════════════════════════

export async function getClassSettings(classYearId: string) {
  try {
    if (!classYearId) return { ok: false as const, message: "Class year ID required" };

    const classYear = await db.classYear.findUnique({
      where: { id: classYearId },
      include: {
        classTemplate: { select: { id: true, name: true, code: true, level: true } },
        streams: { select: { id: true, name: true }, orderBy: { name: "asc" } },

        // Academic year with terms and their exams (merged — no duplicate key)
        academicYear: {
          select: {
            id:   true,
            year: true,
            terms: {
              orderBy: { termNumber: "asc" },
              include: {
                // Exams scoped to THIS class year only
                exams: {
                  where:   { classYearId },
                  orderBy: { examType: "asc" },
                  select:  {
                    id:       true,
                    name:     true,
                    examType: true,
                    maxMarks: true,
                    date:     true,
                  },
                },
              },
            },
          },
        },

        // Assessment configs — one per (classYear × term)
        assessmentConfigs: {
          orderBy: { term: { termNumber: "asc" } },
          include: { term: { select: { id: true, name: true, termNumber: true } } },
        },

        // Subjects assigned to this class
        classSubjects: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: { subject: { name: "asc" } },
        },
      },
    });

    if (!classYear) return { ok: false as const, message: "Class year not found" };

    return { ok: true as const, data: classYear };
  } catch (error: any) {
    console.error("❌ getClassSettings:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load class settings" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPSERT ASSESSMENT CONFIG
// Creates or updates the ClassAssessmentConfig for a classYear + term.
// Validates that active exam weights sum to 100.
// ════════════════════════════════════════════════════════════════════════════

export async function upsertAssessmentConfig(data: {
  classYearId: string;
  termId:      string;
  hasBOT:      boolean;
  hasMTE:      boolean;
  hasEOT:      boolean;
  botWeight:   number;
  mteWeight:   number;
  eotWeight:   number;
}) {
  try {
    const { classYearId, termId, hasBOT, hasMTE, hasEOT, botWeight, mteWeight, eotWeight } = data;

    // Validate: active exam weights must sum to 100
    const activeWeights = [
      hasBOT ? botWeight : 0,
      hasMTE ? mteWeight : 0,
      hasEOT ? eotWeight : 0,
    ].filter(w => w > 0);

    const examWeightSum = activeWeights.reduce((s, w) => s + w, 0);
    if (activeWeights.length > 0 && Math.abs(examWeightSum - 100) > 0.5) {
      return {
        ok:      false as const,
        message: `Exam weights must sum to 100% (currently ${examWeightSum.toFixed(1)}%).`,
      };
    }

    const config = await db.classAssessmentConfig.upsert({
      where:  { classYearId_termId: { classYearId, termId } },
      update: {
        hasBOT, hasMTE, hasEOT,
        botWeight: hasBOT ? botWeight : 0,
        mteWeight: hasMTE ? mteWeight : 0,
        eotWeight: hasEOT ? eotWeight : 0,
      },
      create: {
        classYearId, termId,
        hasBOT, hasMTE, hasEOT,
        botWeight: hasBOT ? botWeight : 0,
        mteWeight: hasMTE ? mteWeight : 0,
        eotWeight: hasEOT ? eotWeight : 0,
      },
    });

    revalidatePath("/dashboard/classes");
    return { ok: true as const, data: config, message: "Assessment config saved" };
  } catch (error: any) {
    console.error("❌ upsertAssessmentConfig:", error);
    return { ok: false as const, message: error?.message ?? "Failed to save config" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE EXAM
// ════════════════════════════════════════════════════════════════════════════

export async function createExam(data: {
  classYearId: string;
  termId:      string;
  examType:    ExamType;
  name:        string;
  maxMarks:    number;
  date?:       Date | null;
}) {
  try {
    const { classYearId, termId, examType, name, maxMarks, date } = data;

    // Check for existing exam of same type in this term+class
    const existing = await db.exam.findUnique({
      where: { examType_termId_classYearId: { examType, termId, classYearId } },
    });
    if (existing) {
      return {
        ok:      false as const,
        message: `A ${examType} exam already exists for this term. Edit the existing one instead.`,
      };
    }

    const exam = await db.exam.create({
      data: { classYearId, termId, examType, name, maxMarks, date: date ?? null },
    });

    revalidatePath("/dashboard/classes");
    return { ok: true as const, data: exam, message: `${name} exam created` };
  } catch (error: any) {
    console.error("❌ createExam:", error);
    return { ok: false as const, message: error?.message ?? "Failed to create exam" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE EXAM
// ════════════════════════════════════════════════════════════════════════════

export async function updateExam(
  examId: string,
  data: { name: string; maxMarks: number; date?: Date | null }
) {
  try {
    const exam = await db.exam.update({
      where: { id: examId },
      data:  { name: data.name, maxMarks: data.maxMarks, date: data.date ?? null },
    });
    revalidatePath("/dashboard/classes");
    return { ok: true as const, data: exam, message: "Exam updated" };
  } catch (error: any) {
    console.error("❌ updateExam:", error);
    return { ok: false as const, message: error?.message ?? "Failed to update exam" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE EXAM
// Blocks if exam has marks recorded
// ════════════════════════════════════════════════════════════════════════════

export async function deleteExam(examId: string) {
  try {
    const exam = await db.exam.findUnique({
      where:  { id: examId },
      select: {
        id:       true,
        name:     true,
        _count:   { select: { examMarks: true, marks: true } },
      },
    });
    if (!exam) return { ok: false as const, message: "Exam not found" };

    const totalMarks = exam._count.examMarks + exam._count.marks;
    if (totalMarks > 0) {
      return {
        ok: false as const,
        message: `Cannot delete "${exam.name}" — ${totalMarks} mark record(s) exist. Clear marks first.`,
      };
    }

    await db.exam.delete({ where: { id: examId } });
    revalidatePath("/dashboard/classes");
    return { ok: true as const, message: `${exam.name} deleted` };
  } catch (error: any) {
    console.error("❌ deleteExam:", error);
    return { ok: false as const, message: error?.message ?? "Failed to delete exam" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET AOI TOPICS FOR A STREAM SUBJECT
// Used by teacher/DOS dashboards to manage AOI topics without deep navigation
// ════════════════════════════════════════════════════════════════════════════

export async function getAOITopicsForStreamSubject(streamSubjectId: string) {
  try {
    const ss = await db.streamSubject.findUnique({
      where:  { id: streamSubjectId },
      select: {
        classSubjectId: true,
        subject:      { select: { name: true, code: true } },
        subjectPaper: { select: { id: true, paperNumber: true, name: true } },
        classSubject: {
          select: {
            id: true,
            aoiTopics: {
              orderBy: { topicNumber: "asc" },
              select: {
                id: true, topicNumber: true, topicName: true,
                maxPoints: true, description: true, competence: true,
                _count: { select: { aoiScores: true } },
              },
            },
          },
        },
      },
    });

    if (!ss || !ss.classSubject) {
      return { ok: false as const, data: null, message: "Stream subject not found" };
    }

    return {
      ok:   true as const,
      data: {
        classSubjectId: ss.classSubject.id,
        subjectName:    ss.subject.name,
        subjectCode:    ss.subject.code,
        paper:          ss.subjectPaper,
        topics:         ss.classSubject.aoiTopics,
      },
    };
  } catch (error: any) {
    console.error("❌ getAOITopicsForStreamSubject:", error);
    return { ok: false as const, data: null, message: error?.message ?? "Failed to load AOI topics" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE AOI TOPIC
// ════════════════════════════════════════════════════════════════════════════

export async function createAOITopic(data: {
  classSubjectId:  string;
  topicNumber:     number;
  topicName:       string;
  maxPoints:       number;
  competence?:     string;
  description?:    string;
  subjectPaperId?: string | null;
}) {
  try {
    const existing = await db.aOITopic.findFirst({
      where: {
        classSubjectId:  data.classSubjectId,
        topicNumber:     data.topicNumber,
        ...(data.subjectPaperId
          ? { subjectPaperId: data.subjectPaperId }
          : {}),
      },
    });
    if (existing) {
      return {
        ok:      false as const,
        message: `Topic ${data.topicNumber} already exists for this subject`,
      };
    }

    const topic = await db.aOITopic.create({
      data: {
        classSubjectId:  data.classSubjectId,
        topicNumber:     data.topicNumber,
        topicName:       data.topicName,
        maxPoints:       data.maxPoints,
        competence:      data.competence?.trim() || null,
        description:     data.description?.trim() || null,
        subjectPaperId:  data.subjectPaperId ?? null,
      },
    });

    revalidatePath("/dashboard/classes");
    return { ok: true as const, data: topic, message: `Topic ${data.topicNumber} created` };
  } catch (error: any) {
    console.error("❌ createAOITopic:", error);
    return { ok: false as const, message: error?.message ?? "Failed to create AOI topic" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE AOI TOPIC
// ════════════════════════════════════════════════════════════════════════════

export async function updateAOITopic(
  topicId: string,
  data: { topicName: string; maxPoints: number; competence?: string; description?: string }
) {
  try {
    const topic = await db.aOITopic.update({
      where: { id: topicId },
      data:  {
        topicName:   data.topicName,
        maxPoints:   data.maxPoints,
        competence:  data.competence?.trim()  || null,
        description: data.description?.trim() || null,
      },
    });
    revalidatePath("/dashboard/classes");
    return { ok: true as const, data: topic, message: "AOI topic updated" };
  } catch (error: any) {
    console.error("❌ updateAOITopic:", error);
    return { ok: false as const, message: error?.message ?? "Failed to update topic" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE AOI TOPIC
// Blocks if scores exist
// ════════════════════════════════════════════════════════════════════════════

export async function deleteAOITopic(topicId: string) {
  try {
    const topic = await db.aOITopic.findUnique({
      where:  { id: topicId },
      select: { id: true, topicName: true, _count: { select: { aoiScores: true } } },
    });
    if (!topic) return { ok: false as const, message: "Topic not found" };

    if (topic._count.aoiScores > 0) {
      return {
        ok:      false as const,
        message: `Cannot delete "${topic.topicName}" — ${topic._count.aoiScores} score(s) recorded.`,
      };
    }

    await db.aOITopic.delete({ where: { id: topicId } });
    revalidatePath("/dashboard/classes");
    return { ok: true as const, message: `${topic.topicName} deleted` };
  } catch (error: any) {
    console.error("❌ deleteAOITopic:", error);
    return { ok: false as const, message: error?.message ?? "Failed to delete topic" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LOCK / UNLOCK ASSESSMENT CONFIG
// ════════════════════════════════════════════════════════════════════════════

export async function toggleAssessmentConfigLock(data: {
  classYearId: string;
  termId:      string;
  unlock:      boolean;  // true = unlock, false = re-lock
  userId?:     string;
}) {
  try {
    const { classYearId, termId, unlock } = data;

    // Resolve userId — prefer the passed-in value, fall back to session token
    let userId = data.userId;
    if (!userId) {
      const cookieStore = await cookies();
      const headersList = await headers();
      const token = await getToken({
        req: {
          cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
          headers: Object.fromEntries(headersList.entries()),
        } as any,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      userId = token?.id as string | undefined;
    }

    if (!userId) return { ok: false, message: "User not authenticated" };

    const existing = await db.classAssessmentConfig.findUnique({
      where: { classYearId_termId: { classYearId, termId } },
    });
    if (!existing) return { ok: false, message: "Assessment config not found" };

    const updated = await db.classAssessmentConfig.update({
      where: { classYearId_termId: { classYearId, termId } },
      data:  unlock
        ? { isLocked: false, unlockedById: userId, unlockedAt: new Date() }
        : { isLocked: true,  unlockedById: null, lockedAt: new Date() },
    });

    // Audit log
    await db.markAuditLog.create({
      data: {
        entityType:    "ClassAssessmentConfig",
        entityId:      existing.id,
        action:        unlock ? "UNLOCK" : "LOCK",
        previousValue: { isLocked: existing.isLocked },
        newValue:      { isLocked: !unlock },
        performedById: userId,
        performedAt:   new Date(),
      },
    });

    revalidatePath(`/school/[slug]/academics`);
    return {
      ok:      true,
      message: unlock ? "Marks unlocked for editing" : "Marks re-locked successfully",
      data:    updated,
    };
  } catch (error: any) {
    console.error("❌ toggleAssessmentConfigLock:", error);
    return { ok: false, message: error?.message ?? "Failed to toggle lock" };
  }
}