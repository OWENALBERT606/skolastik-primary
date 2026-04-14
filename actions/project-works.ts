"use server";

import { db }            from "@/prisma/db";
import { revalidatePath } from "next/cache";

// ════════════════════════════════════════════════════════════════════════════
// GET PROJECT WORKS FOR A STUDENT
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentProjectWorks(studentId: string) {
  try {
    const works = await db.projectWork.findMany({
      where:   { studentId },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { ok: true as const, data: works };
  } catch (error: any) {
    return { ok: false as const, message: error?.message ?? "Failed to load project works" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE PROJECT WORK
// ════════════════════════════════════════════════════════════════════════════

export async function createProjectWork(data: {
  studentId:    string;
  schoolId:     string;
  uploadedById: string;
  title:        string;
  description?: string;
  fileUrl:      string;
  fileKey?:     string;
  fileName:     string;
  fileSizeKb?:  number;
  className?:   string;
  streamName?:  string;
  academicYear?: string;
  termName?:    string;
  slug:         string;
}) {
  try {
    if (!data.title.trim())   return { ok: false as const, message: "Title is required" };
    if (!data.fileUrl.trim()) return { ok: false as const, message: "File is required" };

    const existingCount = await db.projectWork.count({ where: { studentId: data.studentId } });
    if (existingCount >= 10) {
      return { ok: false as const, message: "Maximum of 10 project works per student reached" };
    }

    const work = await db.projectWork.create({
      data: {
        studentId:    data.studentId,
        schoolId:     data.schoolId,
        uploadedById: data.uploadedById,
        title:        data.title.trim(),
        description:  data.description?.trim() || null,
        fileUrl:      data.fileUrl,
        fileKey:      data.fileKey ?? "",
        fileName:     data.fileName,
        fileSizeKb:   data.fileSizeKb ?? null,
        className:    data.className  ?? null,
        streamName:   data.streamName ?? null,
        academicYear: data.academicYear ?? null,
        termName:     data.termName    ?? null,
      },
    });

    revalidatePath(`/school/${data.slug}/users/students`);
    return { ok: true as const, data: work, message: "Project work saved." };
  } catch (error: any) {
    return { ok: false as const, message: error?.message ?? "Failed to save project work" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE PROJECT WORK  (title / description only — file is immutable once set)
// ════════════════════════════════════════════════════════════════════════════

export async function updateProjectWork(data: {
  id:           string;
  title:        string;
  description?: string;
  slug:         string;
}) {
  try {
    if (!data.title.trim()) return { ok: false as const, message: "Title is required" };

    const work = await db.projectWork.update({
      where: { id: data.id },
      data:  {
        title:       data.title.trim(),
        description: data.description?.trim() || null,
      },
    });

    revalidatePath(`/school/${data.slug}/users/students`);
    return { ok: true as const, data: work, message: "Project work updated." };
  } catch (error: any) {
    return { ok: false as const, message: error?.message ?? "Failed to update project work" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE PROJECT WORK
// ════════════════════════════════════════════════════════════════════════════

export async function deleteProjectWork(data: { id: string; slug: string }) {
  try {
    await db.projectWork.delete({ where: { id: data.id } });
    revalidatePath(`/school/${data.slug}/users/students`);
    return { ok: true as const, message: "Project work deleted." };
  } catch (error: any) {
    return { ok: false as const, message: error?.message ?? "Failed to delete project work" };
  }
}
