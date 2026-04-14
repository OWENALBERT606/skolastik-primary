"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";

export type AssignmentRow = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  maxScore: number | null;
  isPublished: boolean;
  streamId: string;
  streamName: string;
  subjectId: string;
  subjectName: string;
  termId: string | null;
  termName: string | null;
  submissionCount: number;
  createdAt: string;
};

export type SubmissionRow = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
};

// ── Teacher actions ───────────────────────────────────────────────────────────

export async function getTeacherAssignments(teacherId: string, schoolId: string) {
  try {
    const assignments = await db.lmsAssignment.findMany({
      where: { createdById: teacherId, schoolId },
      include: {
        stream:  { select: { name: true } },
        subject: { select: { name: true } },
        term:    { select: { name: true } },
        _count:  { select: { submissions: true } },
      },
      orderBy: { dueDate: "desc" },
    });

    const rows: AssignmentRow[] = assignments.map(a => ({
      id:              a.id,
      title:           a.title,
      description:     a.description,
      dueDate:         a.dueDate.toISOString(),
      maxScore:        a.maxScore,
      isPublished:     a.isPublished,
      streamId:        a.streamId,
      streamName:      a.stream.name,
      subjectId:       a.subjectId,
      subjectName:     a.subject.name,
      termId:          a.termId,
      termName:        a.term?.name ?? null,
      submissionCount: a._count.submissions,
      createdAt:       a.createdAt.toISOString(),
    }));

    return { ok: true as const, data: rows };
  } catch (err) {
    console.error("[getTeacherAssignments]", err);
    return { ok: false as const, message: "Failed to load assignments" };
  }
}

export async function createAssignment(input: {
  title: string;
  description?: string;
  dueDate: string;
  streamId: string;
  subjectId: string;
  termId?: string;
  maxScore?: number;
  schoolId: string;
  teacherId: string;
}) {
  try {
    const assignment = await db.lmsAssignment.create({
      data: {
        title:       input.title,
        description: input.description || null,
        dueDate:     new Date(input.dueDate),
        streamId:    input.streamId,
        subjectId:   input.subjectId,
        termId:      input.termId || null,
        maxScore:    input.maxScore ?? 100,
        schoolId:    input.schoolId,
        createdById: input.teacherId,
        isPublished: true,
      },
    });
    return { ok: true as const, data: { id: assignment.id } };
  } catch (err) {
    console.error("[createAssignment]", err);
    return { ok: false as const, message: "Failed to create assignment" };
  }
}

export async function updateAssignment(
  id: string,
  teacherId: string,
  input: Partial<{
    title: string;
    description: string;
    dueDate: string;
    maxScore: number;
    isPublished: boolean;
  }>
) {
  try {
    // Ensure teacher owns the assignment
    const existing = await db.lmsAssignment.findFirst({ where: { id, createdById: teacherId } });
    if (!existing) return { ok: false as const, message: "Assignment not found" };

    await db.lmsAssignment.update({
      where: { id },
      data: {
        ...(input.title        !== undefined && { title:       input.title }),
        ...(input.description  !== undefined && { description: input.description }),
        ...(input.dueDate      !== undefined && { dueDate:     new Date(input.dueDate) }),
        ...(input.maxScore     !== undefined && { maxScore:    input.maxScore }),
        ...(input.isPublished  !== undefined && { isPublished: input.isPublished }),
      },
    });
    return { ok: true as const };
  } catch (err) {
    console.error("[updateAssignment]", err);
    return { ok: false as const, message: "Failed to update assignment" };
  }
}

export async function deleteAssignment(id: string, teacherId: string) {
  try {
    const existing = await db.lmsAssignment.findFirst({ where: { id, createdById: teacherId } });
    if (!existing) return { ok: false as const, message: "Assignment not found" };

    await db.lmsAssignment.delete({ where: { id } });
    return { ok: true as const };
  } catch (err) {
    console.error("[deleteAssignment]", err);
    return { ok: false as const, message: "Failed to delete assignment" };
  }
}

export async function getAssignmentSubmissions(assignmentId: string, teacherId: string) {
  try {
    // Verify teacher owns the assignment
    const assignment = await db.lmsAssignment.findFirst({
      where: { id: assignmentId, createdById: teacherId },
      select: { title: true },
    });
    if (!assignment) return { ok: false as const, message: "Assignment not found" };

    const subs = await db.lmsSubmission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const rows: SubmissionRow[] = subs.map(s => ({
      id:             s.id,
      assignmentId:   s.assignmentId,
      assignmentTitle: assignment.title,
      studentId:      s.studentId,
      studentName:    `${s.student.firstName} ${s.student.lastName}`,
      admissionNo:    s.student.admissionNo,
      fileUrl:        s.fileUrl,
      fileName:       s.fileName,
      fileSize:       s.fileSize,
      status:         s.status,
      score:          s.score,
      feedback:       s.feedback,
      submittedAt:    s.submittedAt.toISOString(),
      gradedAt:       s.gradedAt?.toISOString() ?? null,
    }));

    return { ok: true as const, data: rows };
  } catch (err) {
    console.error("[getAssignmentSubmissions]", err);
    return { ok: false as const, message: "Failed to load submissions" };
  }
}

export async function gradeSubmission(
  submissionId: string,
  teacherId: string,
  input: { score?: number; feedback?: string }
) {
  try {
    const sub = await db.lmsSubmission.findFirst({
      where: { id: submissionId },
      include: { assignment: { select: { createdById: true } } },
    });
    if (!sub || sub.assignment.createdById !== teacherId) {
      return { ok: false as const, message: "Not authorized" };
    }

    await db.lmsSubmission.update({
      where: { id: submissionId },
      data: {
        score:      input.score   ?? sub.score,
        feedback:   input.feedback ?? sub.feedback,
        status:     "GRADED",
        gradedById: teacherId,
        gradedAt:   new Date(),
      },
    });
    return { ok: true as const };
  } catch (err) {
    console.error("[gradeSubmission]", err);
    return { ok: false as const, message: "Failed to grade submission" };
  }
}

// ── Student actions ───────────────────────────────────────────────────────────

export async function getStudentAssignments(studentId: string, schoolId: string) {
  try {
    // Get active enrollment to find stream
    const enrollment = await db.enrollment.findFirst({
      where:   { studentId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select:  { streamId: true },
    });

    if (!enrollment) return { ok: true as const, data: [] as AssignmentRow[] };

    // Get enrolled subject IDs
    const subjectEnrollments = await db.studentSubjectEnrollment.findMany({
      where:  { enrollment: { studentId, status: "ACTIVE" }, status: "ACTIVE" },
      select: { streamSubject: { select: { subjectId: true } } },
    });
    const subjectIds = subjectEnrollments.map(se => se.streamSubject.subjectId);

    const streamId = enrollment.streamId;
    if (!streamId) return { ok: true as const, data: [] as AssignmentRow[] };

    const assignments = await db.lmsAssignment.findMany({
      where: {
        schoolId,
        isPublished: true,
        streamId,
        subjectId: { in: subjectIds },
      },
      include: {
        stream:  { select: { name: true } },
        subject: { select: { name: true } },
        term:    { select: { name: true } },
        _count:  { select: { submissions: true } },
      },
      orderBy: { dueDate: "desc" },
    });

    const rows: AssignmentRow[] = assignments.map(a => ({
      id:              a.id,
      title:           a.title,
      description:     a.description,
      dueDate:         a.dueDate.toISOString(),
      maxScore:        a.maxScore,
      isPublished:     a.isPublished,
      streamId:        a.streamId,
      streamName:      a.stream.name,
      subjectId:       a.subjectId,
      subjectName:     a.subject.name,
      termId:          a.termId,
      termName:        a.term?.name ?? null,
      submissionCount: a._count.submissions,
      createdAt:       a.createdAt.toISOString(),
    }));

    return { ok: true as const, data: rows };
  } catch (err) {
    console.error("[getStudentAssignments]", err);
    return { ok: false as const, message: "Failed to load assignments" };
  }
}

export async function getStudentSubmissions(studentId: string, schoolId: string) {
  try {
    const subs = await db.lmsSubmission.findMany({
      where: { studentId, schoolId },
      include: {
        assignment: {
          select: { title: true, dueDate: true, maxScore: true, termId: true, term: { select: { name: true } }, subject: { select: { name: true } } },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return {
      ok: true as const,
      data: subs.map(s => ({
        id:              s.id,
        assignmentId:    s.assignmentId,
        assignmentTitle: s.assignment.title,
        subjectName:     s.assignment.subject.name,
        dueDate:         s.assignment.dueDate.toISOString(),
        maxScore:        s.assignment.maxScore,
        termId:          s.assignment.termId,
        termName:        s.assignment.term?.name ?? null,
        fileUrl:         s.fileUrl,
        fileName:        s.fileName,
        status:          s.status,
        score:           s.score,
        feedback:        s.feedback,
        submittedAt:     s.submittedAt.toISOString(),
        gradedAt:        s.gradedAt?.toISOString() ?? null,
      })),
    };
  } catch (err) {
    console.error("[getStudentSubmissions]", err);
    return { ok: false as const, message: "Failed to load submissions" };
  }
}

export async function submitAssignment(input: {
  assignmentId: string;
  studentId: string;
  schoolId: string;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize?: number;
}) {
  try {
    // Prevent duplicate submissions (upsert approach — allows resubmission)
    const existing = await db.lmsSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId: input.assignmentId, studentId: input.studentId } },
    });

    if (existing && existing.status === "GRADED") {
      return { ok: false as const, message: "Assignment already graded — cannot resubmit" };
    }

    if (existing) {
      // Resubmission — update file
      await db.lmsSubmission.update({
        where: { id: existing.id },
        data: {
          fileUrl:     input.fileUrl,
          fileKey:     input.fileKey,
          fileName:    input.fileName,
          fileSize:    input.fileSize ?? null,
          status:      "SUBMITTED",
          submittedAt: new Date(),
          score:       null,
          feedback:    null,
          gradedById:  null,
          gradedAt:    null,
        },
      });
    } else {
      // Check assignment exists and is published
      const assignment = await db.lmsAssignment.findFirst({
        where: { id: input.assignmentId, schoolId: input.schoolId, isPublished: true },
      });
      if (!assignment) return { ok: false as const, message: "Assignment not found" };

      const isLate = new Date() > assignment.dueDate;

      await db.lmsSubmission.create({
        data: {
          assignmentId: input.assignmentId,
          studentId:    input.studentId,
          schoolId:     input.schoolId,
          fileUrl:      input.fileUrl,
          fileKey:      input.fileKey,
          fileName:     input.fileName,
          fileSize:     input.fileSize ?? null,
          status:       isLate ? "LATE" : "SUBMITTED",
        },
      });
    }

    return { ok: true as const };
  } catch (err) {
    console.error("[submitAssignment]", err);
    return { ok: false as const, message: "Failed to submit assignment" };
  }
}
