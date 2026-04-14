// lib/timetable/validate.ts
import { db } from "@/prisma/db";

export type ValidationResult = {
  ready:    boolean;
  errors:   string[];
  warnings: string[];
};

export async function validateGenerationReadiness(
  schoolId:       string,
  academicYearId: string,
  termId:         string,
): Promise<ValidationResult> {
  const errors:   string[] = [];
  const warnings: string[] = [];

  // 1. Term exists and belongs to the year
  const term = await db.academicTerm.findFirst({
    where: { id: termId, academicYear: { id: academicYearId, schoolId } },
  });
  if (!term) {
    errors.push("Term not found or does not belong to the specified academic year.");
    // Can't continue without a valid term
    return { ready: false, errors, warnings };
  }

  // 2. School day configs exist
  const dayConfigs = await db.schoolDayConfig.findMany({
    where:   { schoolId, isActive: true },
    include: { slots: true },
  });
  if (dayConfigs.length === 0) {
    errors.push("No active school day configurations found. Go to Day Config tab and set up your school days first.");
  }

  // 3. At least one active day has lesson/prep slots
  const daysWithSlots = dayConfigs.filter(d =>
    d.slots.some(s => s.slotType === "LESSON" || s.slotType === "PREP")
  );
  if (dayConfigs.length > 0 && daysWithSlots.length === 0) {
    errors.push("No LESSON or PREP slots defined. Add lesson slots in the Day Config tab.");
  }

  // 4. Streams exist for this academic year
  const streams = await db.stream.findMany({
    where:  { schoolId, classYear: { academicYearId } },
    select: { id: true, name: true },
  });
  if (streams.length === 0) {
    errors.push("No streams found for this academic year. Create streams under Academics → Streams.");
  }

  // 5. Stream subjects exist for this term
  const streamSubjects = await db.streamSubject.findMany({
    where:   { termId, stream: { schoolId }, isActive: true },
    include: { teacherAssignments: { where: { status: "ACTIVE" } } },
  });
  if (streamSubjects.length === 0) {
    errors.push("No active stream subjects found for this term. Assign subjects to streams first.");
    return { ready: errors.length === 0, errors, warnings };
  }

  // 6. Check for unassigned stream subjects — WARNING only (generator skips them)
  // Group by streamId+subjectId to avoid double-counting multi-paper subjects
  const subjectStreamPairs = new Map<string, boolean>();
  for (const ss of streamSubjects) {
    const key = `${ss.streamId}:${ss.subjectId}`;
    const hasTeacher = ss.teacherAssignments.length > 0;
    // Mark as assigned if ANY paper row for this stream+subject has a teacher
    if (!subjectStreamPairs.has(key) || hasTeacher) {
      subjectStreamPairs.set(key, hasTeacher);
    }
  }
  const unassignedPairs = [...subjectStreamPairs.values()].filter(v => !v).length;
  if (unassignedPairs > 0) {
    warnings.push(
      `${unassignedPairs} stream subject(s) have no active teacher assigned — those subjects will be skipped during generation.`
    );
  }

  // 7. ClassSubjectConfig missing — WARNING, defaults used
  const classSubjectIds = [...new Set(streamSubjects.map(ss => ss.classSubjectId))];
  const configs = await db.classSubjectConfig.findMany({
    where:  { classSubjectId: { in: classSubjectIds } },
    select: { classSubjectId: true },
  });
  const configuredIds  = new Set(configs.map(c => c.classSubjectId));
  const unconfigured   = classSubjectIds.filter(id => !configuredIds.has(id));
  if (unconfigured.length > 0) {
    warnings.push(
      `${unconfigured.length} class subject(s) have no timetable config — defaults (3 lessons/week) will be used.`
    );
  }

  // 8. Teachers with no availability records — WARNING, assumed fully available
  const teacherIds = [...new Set(
    streamSubjects.flatMap(ss => ss.teacherAssignments.map(ta => ta.teacherId))
  )];
  if (teacherIds.length > 0) {
    const availabilities = await db.teacherAvailability.findMany({
      where:  { teacherId: { in: teacherIds }, schoolId },
      select: { teacherId: true },
    });
    const availableIds  = new Set(availabilities.map(a => a.teacherId));
    const noAvailability = teacherIds.filter(id => !availableIds.has(id));
    if (noAvailability.length > 0) {
      warnings.push(
        `${noAvailability.length} teacher(s) have no availability records — assumed fully available all week.`
      );
    }
  }

  // 9. Published version already exists — WARNING only
  const published = await db.timetableVersion.findFirst({
    where: { schoolId, termId, status: "PUBLISHED" },
  });
  if (published) {
    warnings.push("A published timetable already exists for this term. A new draft will be created alongside it.");
  }

  // 10. Academic year not active — WARNING only
  const year = await db.academicYear.findFirst({
    where:  { id: academicYearId, schoolId },
    select: { isActive: true },
  });
  if (year && !year.isActive) {
    warnings.push("The selected academic year is not marked as active.");
  }

  return {
    ready:  errors.length === 0,
    errors,
    warnings,
  };
}
