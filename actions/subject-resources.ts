"use server";

import { db }            from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { ResourceType }  from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ResourceRow = {
  id:          string;
  title:       string;
  description: string | null;
  type:        ResourceType;
  fileUrl:     string;
  fileKey:     string;
  fileName:    string;
  fileSize:    number | null;
  subjectId:   string;
  subjectName: string;
  streamId:    string | null;
  streamName:  string | null;
  termId:      string | null;
  termName:    string | null;
  isPublished: boolean;
  createdAt:   string;
  uploaderName: string;
};

// ── GET RESOURCES FOR A TEACHER (their assigned subjects) ─────────────────────

export async function getTeacherSubjectResources(teacherId: string, schoolId: string) {
  try {
    // All subject-teacher assignments (all non-removed statuses — teacher may have been on hold
    // or reassigned but still needs to upload resources for their current subjects)
    const assignments = await db.streamSubjectTeacher.findMany({
      where: {
        teacherId,
        status: { notIn: ["REMOVED", "CANCELLED"] },
        streamSubject: { stream: { schoolId } },
      },
      select: {
        streamSubject: {
          select: {
            subjectId: true,
            subject:   { select: { id: true, name: true } },
            streamId:  true,
            stream:    {
              select: {
                id:        true,
                name:      true,
                classYear: { select: { classTemplate: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });

    // Also include ALL subjects in streams where teacher is class head
    const headedStreams = await db.stream.findMany({
      where: {
        classHeadId: teacherId,
        schoolId,
        classYear:   { academicYear: { isActive: true } },
      },
      select: {
        id:       true,
        name:     true,
        classYear: { select: { classTemplate: { select: { name: true } } } },
        streamSubjects: {
          where:  { isActive: true },
          select: {
            subjectId: true,
            subject:   { select: { id: true, name: true } },
          },
        },
      },
    });

    // Build unique subject+stream combos (key = subjectId-streamId)
    const combos = new Map<string, { subjectId: string; subjectName: string; streamId: string; streamName: string }>();

    for (const a of assignments) {
      const ss  = a.streamSubject;
      const key = `${ss.subjectId}-${ss.streamId}`;
      if (!combos.has(key)) {
        combos.set(key, {
          subjectId:   ss.subjectId,
          subjectName: ss.subject.name,
          streamId:    ss.streamId,
          streamName:  `${ss.stream.classYear.classTemplate.name} ${ss.stream.name}`,
        });
      }
    }
    for (const hs of headedStreams) {
      for (const ss of hs.streamSubjects) {
        const key = `${ss.subjectId}-${hs.id}`;
        if (!combos.has(key)) {
          combos.set(key, {
            subjectId:   ss.subjectId,
            subjectName: ss.subject.name,
            streamId:    hs.id,
            streamName:  `${hs.classYear.classTemplate.name} ${hs.name}`,
          });
        }
      }
    }

    const subjectIds = [...new Set([...combos.values()].map(c => c.subjectId))];

    // Only show resources this teacher uploaded
    const resources = await db.subjectResource.findMany({
      where: {
        schoolId,
        uploadedById: teacherId,
        subjectId:    { in: subjectIds.length > 0 ? subjectIds : ["__none__"] },
      },
      include: {
        subject:    { select: { name: true } },
        stream:     { select: { name: true, classYear: { select: { classTemplate: { select: { name: true } } } } } },
        term:       { select: { name: true } },
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      ok:   true as const,
      data: {
        resources: resources.map(r => toRow(r)),
        // Return all combos — one entry per subject+stream pair
        subjects:  Array.from(combos.values()),
      },
    };
  } catch (e: any) {
    console.error("❌ getTeacherSubjectResources:", e);
    return { ok: false as const, message: e?.message ?? "Failed to load resources" };
  }
}

// ── GET RESOURCES FOR A STUDENT (their enrolled subjects) ─────────────────────

export async function getStudentSubjectResources(studentId: string, schoolId: string) {
  try {
    // All enrollments ever — so promoted students still see resources from prior classes
    const allEnrollments = await db.enrollment.findMany({
      where:   { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        stream: {
          select: {
            id:        true,
            name:      true,
            classYearId: true,
            classYear: { select: { classTemplate: { select: { name: true } } } },
          },
        },
      },
    });

    if (allEnrollments.length === 0 || !allEnrollments[0]?.stream) {
      return { ok: true as const, data: { resources: [], subjects: [] } };
    }

    // Active (most recent) enrollment stream for context / subjects display
    const activeEnrollment = allEnrollments.find(e => e.status === "ACTIVE") ?? allEnrollments[0];
    const activeStream     = activeEnrollment.stream!;

    // All streamIds the student has ever been in (filter out nulls)
    const allStreamIds = [...new Set(allEnrollments.map(e => e.streamId).filter((id): id is string => !!id))];

    // All classYearIds across all their streams
    const classYearIds = [...new Set(allEnrollments.map(e => e.stream?.classYearId).filter(Boolean) as string[])];

    // All streams in those class years — so "S1 North" resources are visible to "S1 South" students
    const classYearStreams = await db.stream.findMany({
      where:  { classYearId: { in: classYearIds } },
      select: { id: true },
    });
    const classYearStreamIds = classYearStreams.map(s => s.id);

    // All subjects across all the student's own streams (for subject-only resources)
    const allStreamSubjects = await db.streamSubject.findMany({
      where:  { streamId: { in: allStreamIds }, isActive: true },
      select: { subjectId: true, subject: { select: { id: true, name: true } } },
    });
    const allSubjectIds = [...new Set(allStreamSubjects.map(ss => ss.subjectId))];

    // Query resources with visibility rules:
    //  - Notes / Past Papers / Syllabus / Other: visible to ALL students in the same class year
    //  - Assignment type: stream-specific (only your own stream)
    //  - No-stream resources: visible if the student is enrolled in that subject
    const resources = await db.subjectResource.findMany({
      where: {
        schoolId,
        isPublished: true,
        OR: [
          // Non-assignment stream resources → entire class year can see
          {
            streamId: { in: classYearStreamIds },
            type:     { not: "ASSIGNMENT" },
          },
          // Assignment stream resources → only the student's own streams
          {
            streamId: { in: allStreamIds },
            type:     "ASSIGNMENT",
          },
          // Subject-wide resources (no stream) → any enrolled subject
          {
            streamId:  null,
            subjectId: { in: allSubjectIds },
          },
        ],
      },
      include: {
        subject:    { select: { name: true } },
        stream:     { select: { name: true, classYear: { select: { classTemplate: { select: { name: true } } } } } },
        term:       { select: { name: true } },
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Subjects for the filter UI — use the active enrollment's stream
    const activeStreamSubjects = await db.streamSubject.findMany({
      where:  { streamId: activeStream.id, isActive: true },
      select: { subjectId: true, subject: { select: { id: true, name: true } } },
    });

    const subjects = activeStreamSubjects.map(ss => ({
      subjectId:   ss.subjectId,
      subjectName: ss.subject.name,
      streamId:    activeStream.id,
      streamName:  `${activeStream.classYear.classTemplate.name} ${activeStream.name}`,
    }));

    return { ok: true as const, data: { resources: resources.map(r => toRow(r)), subjects } };
  } catch (e: any) {
    console.error("❌ getStudentSubjectResources:", e);
    return { ok: false as const, message: e?.message ?? "Failed to load resources" };
  }
}

// ── CREATE ─────────────────────────────────────────────────────────────────────

export async function createSubjectResource(data: {
  title:       string;
  description?: string;
  type:        ResourceType;
  fileUrl:     string;
  fileKey:     string;
  fileName:    string;
  fileSize?:   number;
  subjectId:   string;
  streamId?:   string;
  termId?:     string;
  schoolId:    string;
  teacherId:   string;
}) {
  try {
    const resource = await db.subjectResource.create({
      data: {
        title:        data.title,
        description:  data.description || null,
        type:         data.type,
        fileUrl:      data.fileUrl,
        fileKey:      data.fileKey,
        fileName:     data.fileName,
        fileSize:     data.fileSize ?? null,
        subjectId:    data.subjectId,
        streamId:     data.streamId  ?? null,
        termId:       data.termId    ?? null,
        schoolId:     data.schoolId,
        uploadedById: data.teacherId,
        isPublished:  true,
      },
    });

    revalidatePath("/teacher/resources");
    revalidatePath("/student/resources");

    return { ok: true as const, message: "Resource uploaded successfully", data: resource };
  } catch (e: any) {
    console.error("❌ createSubjectResource:", e);
    return { ok: false as const, message: e?.message ?? "Failed to upload resource" };
  }
}

// ── UPDATE ─────────────────────────────────────────────────────────────────────

export async function updateSubjectResource(
  resourceId: string,
  teacherId:  string,
  data: {
    title?:       string;
    description?: string;
    type?:        ResourceType;
    isPublished?: boolean;
  }
) {
  try {
    const existing = await db.subjectResource.findFirst({
      where: { id: resourceId, uploadedById: teacherId },
    });
    if (!existing) return { ok: false as const, message: "Resource not found or access denied" };

    await db.subjectResource.update({
      where: { id: resourceId },
      data:  { ...data },
    });

    revalidatePath("/teacher/resources");
    revalidatePath("/student/resources");

    return { ok: true as const, message: "Resource updated" };
  } catch (e: any) {
    console.error("❌ updateSubjectResource:", e);
    return { ok: false as const, message: e?.message ?? "Failed to update resource" };
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────────────

export async function deleteSubjectResource(resourceId: string, teacherId: string) {
  try {
    const existing = await db.subjectResource.findFirst({
      where: { id: resourceId, uploadedById: teacherId },
      select: { id: true, fileKey: true },
    });
    if (!existing) return { ok: false as const, message: "Resource not found or access denied" };

    await db.subjectResource.delete({ where: { id: resourceId } });

    revalidatePath("/teacher/resources");
    revalidatePath("/student/resources");

    return { ok: true as const, message: "Resource deleted", fileKey: existing.fileKey };
  } catch (e: any) {
    console.error("❌ deleteSubjectResource:", e);
    return { ok: false as const, message: e?.message ?? "Failed to delete resource" };
  }
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function toRow(r: any): ResourceRow {
  return {
    id:           r.id,
    title:        r.title,
    description:  r.description,
    type:         r.type,
    fileUrl:      r.fileUrl,
    fileKey:      r.fileKey,
    fileName:     r.fileName,
    fileSize:     r.fileSize,
    subjectId:    r.subjectId,
    subjectName:  r.subject.name,
    streamId:     r.streamId,
    streamName:   r.stream
      ? `${r.stream.classYear.classTemplate.name} ${r.stream.name}`
      : null,
    termId:       r.termId,
    termName:     r.term?.name ?? null,
    isPublished:  r.isPublished,
    createdAt:    r.createdAt.toISOString(),
    uploaderName: `${r.uploadedBy.firstName} ${r.uploadedBy.lastName}`,
  };
}
