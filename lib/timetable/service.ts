// lib/timetable/service.ts
import { db } from "@/prisma/db";
import { DayOfWeek, SlotType } from "@prisma/client";
import { validateGenerationReadiness } from "./validate";
import { generateTimetable } from "./generator";
import type {
  GeneratorInput,
  SchoolDayConfigWithSlots,
  StreamSubjectWithRelations,
  TeacherAvailabilityMap,
  ApprovedLeave,
} from "./types";

// ─── Run generation ───────────────────────────────────────────────────────────

export async function runTimetableGeneration(params: {
  schoolId:         string;
  academicYearId:   string;
  termId:           string;
  label?:           string;
  generatedById?:   string;
  lessonDurationMin?: number;
}) {
  const { schoolId, academicYearId, termId, label, lessonDurationMin } = params;

  // Phase 1: Validate
  const validation = await validateGenerationReadiness(schoolId, academicYearId, termId);
  if (!validation.ready) {
    return { success: false, errors: validation.errors, warnings: validation.warnings };
  }

  // Phase 2: Load data
  const term = await db.academicTerm.findUniqueOrThrow({ where: { id: termId } });

  const dayConfigs = await db.schoolDayConfig.findMany({
    where: { schoolId, isActive: true },
    include: { slots: { orderBy: { slotNumber: "asc" } } },
  });

  const streamSubjectsRaw = await db.streamSubject.findMany({
    where: { termId, stream: { schoolId }, isActive: true },
    include: {
      teacherAssignments: { where: { status: "ACTIVE" }, select: { teacherId: true, status: true } },
      classSubject: {
        include: { timetableConfig: { select: { lessonsPerWeek: true, allowDoubles: true } } },
      },
    },
  });

  // Debug: log how many stream subjects and unique streams were found
  const uniqueStreams = new Set(streamSubjectsRaw.map(ss => ss.streamId));
  console.log(`[Timetable] Found ${streamSubjectsRaw.length} stream subject rows across ${uniqueStreams.size} streams for termId=${termId}`);

  const teacherIds = [...new Set(
    streamSubjectsRaw.flatMap(ss => ss.teacherAssignments.map(ta => ta.teacherId))
  )];

  const availabilityRows = await db.teacherAvailability.findMany({
    where: { teacherId: { in: teacherIds }, schoolId },
  });

  const teacherAvailability: TeacherAvailabilityMap = new Map();
  for (const row of availabilityRows) {
    if (!teacherAvailability.has(row.teacherId)) {
      teacherAvailability.set(row.teacherId, new Map());
    }
    teacherAvailability.get(row.teacherId)!.set(row.dayOfWeek, {
      isAvailable: row.isAvailable,
      from: row.availableFrom ?? undefined,
      to:   row.availableTo   ?? undefined,
    });
  }

  // Approved leaves within term window
  const leaveRows = await db.leaveRequest.findMany({
    where: {
      staffId: {
        in: await db.staff.findMany({
          where: { teacher: { id: { in: teacherIds } } },
          select: { id: true },
        }).then(rows => rows.map(r => r.id)),
      },
      status:    "APPROVED",
      startDate: { lte: term.endDate },
      endDate:   { gte: term.startDate },
    },
    include: { staff: { include: { teacher: { select: { id: true } } } } },
  });

  const approvedLeaves: ApprovedLeave[] = leaveRows
    .filter(l => l.staff.teacher)
    .map(l => ({
      teacherId: l.staff.teacher!.id,
      startDate: l.startDate,
      endDate:   l.endDate,
    }));

  const input: GeneratorInput = {
    schoolId,
    academicYearId,
    termId,
    termStartDate:  term.startDate,
    termEndDate:    term.endDate,
    dayConfigs:     applyLessonDuration(dayConfigs as SchoolDayConfigWithSlots[], lessonDurationMin),
    streamSubjects: streamSubjectsRaw as unknown as StreamSubjectWithRelations[],
    teacherAvailability,
    approvedLeaves,
    lessonDurationMin,
  };

  // Phase 3: Generate
  const result = generateTimetable(input);

  // Phase 4: Determine next version number
  const lastVersion = await db.timetableVersion.findFirst({
    where: { schoolId, termId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  // Phase 5: Persist in one transaction
  const version = await db.$transaction(async (tx) => {
    const v = await tx.timetableVersion.create({
      data: {
        schoolId,
        academicYearId,
        termId,
        versionNumber,
        label: label ?? `Version ${versionNumber}`,
        status: "DRAFT",
      },
    });

    // Create slots — deduplicate by (streamId, dayOfWeek, startTime, termId) in memory
    // to avoid silent drops from skipDuplicates
    if (result.placed.length > 0) {
      const seen = new Set<string>();
      const dedupedSlots = result.placed.filter(p => {
        const key = `${p.streamId}:${p.dayOfWeek}:${p.startTime}:${termId}:${v.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      console.log(`[Timetable] Saving ${dedupedSlots.length} slots (${result.placed.length - dedupedSlots.length} deduped) across ${new Set(dedupedSlots.map(p => p.streamId)).size} streams`);
      // Batch in chunks of 50 for Neon serverless
      for (let i = 0; i < dedupedSlots.length; i += 50) {
        await tx.timetableSlot.createMany({
          data: dedupedSlots.slice(i, i + 50).map(p => ({
            streamId:          p.streamId,
            streamSubjectId:   p.streamSubjectId,
            academicYearId,
            termId,
            timetableVersionId: v.id,
            dayOfWeek:         p.dayOfWeek,
            slotNumber:        p.slotNumber,
            startTime:         p.startTime,
            endTime:           p.endTime,
            slotType:          p.slotType,
            isManualOverride:  false,
            isActive:          true,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Create conflicts
    if (result.conflicts.length > 0) {
      await tx.timetableConflict.createMany({
        data: result.conflicts.map(c => ({
          timetableVersionId: v.id,
          conflictType:       c.conflictType,
          severity:           c.severity,
          description:        c.description,
          dayOfWeek:          c.dayOfWeek ?? null,
          slotNumber:         c.slotNumber ?? null,
          streamId:           c.streamId  ?? null,
          teacherId:          c.teacherId ?? null,
          subjectId:          c.subjectId ?? null,
          isResolved:         false,
        })),
      });
    }

    return v;
  });

  return {
    success:        result.success,
    versionId:      version.id,
    versionNumber,
    placedCount:    result.placed.length,
    conflicts:      result.conflicts,
    warnings:       validation.warnings,
    errors:         validation.errors,
    generationStats: result.generationStats,
  };
}

// ─── Publish version ──────────────────────────────────────────────────────────

export async function publishTimetableVersion(params: {
  versionId:       string;
  publishedByUserId: string;
}) {
  const { versionId, publishedByUserId } = params;

  // Conflict gate — cannot publish with unresolved ERROR conflicts
  const unresolvedErrors = await db.timetableConflict.count({
    where: { timetableVersionId: versionId, severity: "ERROR", isResolved: false },
  });
  if (unresolvedErrors > 0) {
    throw new Error(`Cannot publish: ${unresolvedErrors} unresolved ERROR conflict(s) must be resolved first.`);
  }

  const version = await db.timetableVersion.update({
    where: { id: versionId },
    data: {
      status:       "PUBLISHED",
      publishedAt:  new Date(),
      publishedById: publishedByUserId,
    },
  });

  return version;
}

// ─── Teacher personal timetable ───────────────────────────────────────────────

export async function getTeacherPersonalTimetable(params: {
  teacherId: string;
  termId:    string;
  schoolId:  string;
}) {
  const { teacherId, termId, schoolId } = params;

  // Find the published version for this term
  const version = await db.timetableVersion.findFirst({
    where: { schoolId, termId, status: "PUBLISHED" },
    orderBy: { versionNumber: "desc" },
  });

  if (!version) return { slots: [], grouped: {} };

  // Get slots where this teacher is assigned
  const slots = await db.timetableSlot.findMany({
    where: {
      timetableVersionId: version.id,
      isActive:           true,
      streamSubject: {
        teacherAssignments: {
          some: { teacherId, status: "ACTIVE" },
        },
      },
    },
    include: {
      stream:        { select: { id: true, name: true } },
      streamSubject: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { slotNumber: "asc" }],
  });

  // Group by day
  const grouped: Record<string, typeof slots> = {};
  for (const slot of slots) {
    const day = slot.dayOfWeek;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(slot);
  }

  return { slots, grouped };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * If lessonDurationMin is provided, recompute endTime for every LESSON/PREP slot
 * based on startTime + duration. Break/Lunch/Assembly slots are left untouched.
 */
function applyLessonDuration(
  dayConfigs:       SchoolDayConfigWithSlots[],
  durationMin?:     number,
): SchoolDayConfigWithSlots[] {
  if (!durationMin) return dayConfigs;
  return dayConfigs.map(dc => ({
    ...dc,
    slots: dc.slots.map(slot => {
      if (slot.slotType !== "LESSON" && slot.slotType !== "PREP") return slot;
      return { ...slot, endTime: addMinutes(slot.startTime, durationMin), durationMin };
    }),
  }));
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total  = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
