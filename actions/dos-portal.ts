// actions/dos-portal.ts
"use server";

import { db } from "@/prisma/db";
import { MarkStatus } from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// CHECK IF A TEACHER IS A DOS
// ════════════════════════════════════════════════════════════════════════════

export async function getTeacherDOSStatus(userId: string) {
  try {
    const teacher = await db.teacher.findUnique({
      where:  { userId },
      select: { id: true, staffId: true },
    });
    if (!teacher) return { ok: false as const, isDOS: false };

    if (!teacher.staffId) return { ok: true as const, isDOS: false };

    const dosRole = await db.staffRole.findFirst({
      where: {
        staffId:       teacher.staffId,
        isActive:      true,
        roleDefinition: { code: "DOS" },
      },
      select: { id: true },
    });

    return { ok: true as const, isDOS: !!dosRole };
  } catch (error: any) {
    return { ok: false as const, isDOS: false };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ASSIGN / REMOVE DOS ROLE FOR A TEACHER (via Staff record)
// ════════════════════════════════════════════════════════════════════════════

export async function assignDOSRole(staffId: string, schoolId: string) {
  try {
    const roleDef = await db.staffRoleDefinition.findFirst({
      where: { schoolId, code: "DOS" },
      select: { id: true },
    });
    if (!roleDef) return { ok: false as const, message: "DOS role definition not found. Seed default roles first." };

    const existing = await db.staffRole.findUnique({
      where: { staffId_staffRoleDefinitionId: { staffId, staffRoleDefinitionId: roleDef.id } },
    });

    if (existing) {
      if (existing.isActive) return { ok: false as const, message: "Staff member is already a DOS" };
      await db.staffRole.update({ where: { id: existing.id }, data: { isActive: true, endDate: null } });
    } else {
      await db.staffRole.create({
        data: { staffId, staffRoleDefinitionId: roleDef.id, schoolId, isPrimary: false, isActive: true },
      });
    }

    return { ok: true as const, message: "DOS role assigned successfully" };
  } catch (error: any) {
    return { ok: false as const, message: error?.message ?? "Failed to assign DOS role" };
  }
}

export async function removeDOSRole(staffId: string, schoolId: string) {
  try {
    const roleDef = await db.staffRoleDefinition.findFirst({
      where: { schoolId, code: "DOS" },
      select: { id: true },
    });
    if (!roleDef) return { ok: false as const, message: "DOS role definition not found" };

    await db.staffRole.updateMany({
      where: { staffId, staffRoleDefinitionId: roleDef.id, isActive: true },
      data:  { isActive: false, endDate: new Date() },
    });

    return { ok: true as const, message: "DOS role removed successfully" };
  } catch (error: any) {
    return { ok: false as const, message: error?.message ?? "Failed to remove DOS role" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET DOS DASHBOARD DATA
// ════════════════════════════════════════════════════════════════════════════

export async function getDOSDashboardData(userId: string) {
  try {
    const teacher = await db.teacher.findUnique({
      where:  { userId },
      select: { id: true, firstName: true, lastName: true, staffNo: true, role: true, schoolId: true },
    });
    if (!teacher) return { ok: false as const, message: "Teacher record not found" };

    const schoolId = teacher.schoolId;

    // ── Active academic year & term ────────────────────────────────────────
    const activeYear = await db.academicYear.findFirst({
      where:   { schoolId, isActive: true },
      select:  { id: true, year: true, terms: { where: { isActive: true }, select: { id: true, name: true, termNumber: true } } },
    });

    const activeTerm = activeYear?.terms?.[0] ?? null;

    // ── All streams in the school ──────────────────────────────────────────
    const streams = await db.stream.findMany({
      where: { classYear: { academicYear: { schoolId } } },
      select: {
        id: true, name: true,
        classYear: { select: { classTemplate: { select: { name: true, level: true } } } },
        _count: { select: { enrollments: true, streamSubjects: true } },
      },
      orderBy: [
        { classYear: { classTemplate: { level: "asc" } } },
        { name: "asc" },
      ],
    });

    // ── Stream subjects with teacher assignment status ─────────────────────
    const streamSubjects = await db.streamSubject.findMany({
      where: { stream: { classYear: { academicYear: { schoolId } } } },
      select: {
        id: true,
        subjectType: true,
        stream:       { select: { id: true, name: true, classYear: { select: { classTemplate: { select: { name: true } } } } } },
        subject:      { select: { id: true, name: true, code: true } },
        subjectPaper: { select: { id: true, name: true, paperNumber: true } },
        term:         { select: { id: true, name: true, isActive: true } },
        teacherAssignments: {
          where:   { status: "ACTIVE" },
          select:  { id: true, teacher: { select: { id: true, firstName: true, lastName: true, staffNo: true } } },
        },
        _count: { select: { studentEnrollments: true } },
      },
      orderBy: [
        { stream: { classYear: { classTemplate: { level: "asc" } } } },
        { stream: { name: "asc" } },
        { subject: { name: "asc" } },
      ],
    });

    // ── Marks approval overview ────────────────────────────────────────────
    const allEnrollments = await db.studentSubjectEnrollment.findMany({
      where: { streamSubject: { stream: { classYear: { academicYear: { schoolId } } } } },
      select: {
        examMarks: { select: { status: true } },
        aoiScores: { select: { status: true } },
        aoiUnits:  { select: { status: true } },
      },
    });

    let totalDraft = 0, totalSubmitted = 0, totalApproved = 0;
    for (const e of allEnrollments) {
      for (const m of [...e.examMarks, ...e.aoiScores, ...e.aoiUnits]) {
        if (m.status === MarkStatus.DRAFT)     totalDraft++;
        if (m.status === MarkStatus.SUBMITTED)  totalSubmitted++;
        if (m.status === MarkStatus.APPROVED)   totalApproved++;
      }
    }

    // ── Teacher workload ───────────────────────────────────────────────────
    const teachers = await db.teacher.findMany({
      where:  { schoolId, currentStatus: "ACTIVE" },
      select: {
        id: true, firstName: true, lastName: true, staffNo: true,
        streamSubjectAssignments: {
          where:  { status: "ACTIVE" },
          select: {
            id: true,
            streamSubject: {
              select: {
                id: true,
                subject:      { select: { name: true, code: true } },
                subjectPaper: { select: { paperNumber: true } },
                term:         { select: { id: true, name: true } },
                stream: {
                  select: {
                    id: true,
                    name: true,
                    classYear: { select: { classTemplate: { select: { name: true } } } },
                  },
                },
                _count: { select: { studentEnrollments: true } },
              },
            },
          },
        },
      },
      orderBy: { firstName: "asc" },
    });

    // ── Unassigned subjects ────────────────────────────────────────────────
    const unassignedSubjects = streamSubjects.filter(ss => ss.teacherAssignments.length === 0);

    // ── Summary ────────────────────────────────────────────────────────────
    const summary = {
      totalStreams:        streams.length,
      totalStreamSubjects: streamSubjects.length,
      unassigned:          unassignedSubjects.length,
      totalTeachers:       teachers.length,
      marksSubmitted:      totalSubmitted,
      marksApproved:       totalApproved,
      marksDraft:          totalDraft,
      activeYear:          activeYear?.year ?? null,
      activeTerm:          activeTerm?.name ?? null,
    };

    return {
      ok:   true as const,
      data: { teacher, summary, streams, streamSubjects, unassignedSubjects, teachers, activeTerm },
    };
  } catch (error: any) {
    console.error("❌ getDOSDashboardData:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load DOS dashboard" };
  }
}
