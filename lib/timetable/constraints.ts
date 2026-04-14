// lib/timetable/constraints.ts
import { DayOfWeek } from "@prisma/client";
import type { ConstraintMatrix, GeneratorInput } from "./types";

/**
 * Builds a constraint matrix from teacher availability and approved leaves.
 * A cell is "occupied" if the teacher/stream is NOT available at that slot.
 * We track occupied slots — generator skips them.
 */
export function buildConstraintMatrix(input: GeneratorInput): ConstraintMatrix {
  const teacherGrid = new Map<string, Set<string>>();
  const streamGrid  = new Map<string, Set<string>>();

  const { dayConfigs, teacherAvailability, approvedLeaves, termStartDate, termEndDate } = input;

  // Collect all unique teacher IDs
  const teacherIds = new Set<string>();
  for (const ss of input.streamSubjects) {
    for (const ta of ss.teacherAssignments) {
      teacherIds.add(ta.teacherId);
    }
  }

  // Collect all unique stream IDs
  const streamIds = new Set(input.streamSubjects.map(ss => ss.streamId));

  // Initialize grids
  for (const tid of teacherIds) teacherGrid.set(tid, new Set());
  for (const sid of streamIds)  streamGrid.set(sid, new Set());

  // Mark teacher unavailability from TeacherAvailability records
  for (const [teacherId, dayMap] of teacherAvailability) {
    const occupied = teacherGrid.get(teacherId) ?? new Set<string>();

    for (const dayConfig of dayConfigs) {
      const avail = dayMap.get(dayConfig.dayOfWeek);
      if (!avail || !avail.isAvailable) {
        // Mark all slots on this day as occupied
        for (const slot of dayConfig.slots) {
          occupied.add(cellKey(dayConfig.dayOfWeek, slot.slotNumber));
        }
      } else if (avail.from || avail.to) {
        // Partial availability — mark slots outside the window
        for (const slot of dayConfig.slots) {
          if (avail.from && slot.startTime < avail.from) {
            occupied.add(cellKey(dayConfig.dayOfWeek, slot.slotNumber));
          }
          if (avail.to && slot.endTime > avail.to) {
            occupied.add(cellKey(dayConfig.dayOfWeek, slot.slotNumber));
          }
        }
      }

      teacherGrid.set(teacherId, occupied);
    }
  }

  // Mark teacher unavailability from approved leaves
  // Leaves are date-based; we map them to day-of-week within the term
  for (const leave of approvedLeaves) {
    const occupied = teacherGrid.get(leave.teacherId);
    if (!occupied) continue;

    // Walk each day in the term and check if it falls within the leave
    const current = new Date(termStartDate);
    while (current <= termEndDate) {
      if (current >= leave.startDate && current <= leave.endDate) {
        const dow = jsDayToDayOfWeek(current.getDay());
        if (dow) {
          const dayConfig = dayConfigs.find(d => d.dayOfWeek === dow);
          if (dayConfig) {
            for (const slot of dayConfig.slots) {
              occupied.add(cellKey(dow, slot.slotNumber));
            }
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }

  return { teacherGrid, streamGrid };
}

export function cellKey(day: DayOfWeek, slotNumber: number): string {
  return `${day}:${slotNumber}`;
}

function jsDayToDayOfWeek(jsDay: number): DayOfWeek | null {
  const map: Record<number, DayOfWeek> = {
    1: DayOfWeek.MONDAY,
    2: DayOfWeek.TUESDAY,
    3: DayOfWeek.WEDNESDAY,
    4: DayOfWeek.THURSDAY,
    5: DayOfWeek.FRIDAY,
    6: DayOfWeek.SATURDAY,
    0: DayOfWeek.SUNDAY,
  };
  return map[jsDay] ?? null;
}
