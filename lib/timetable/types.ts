// lib/timetable/types.ts
import { z } from "zod";
import { DayOfWeek, SlotType } from "@prisma/client";

// ─── Core domain types ───────────────────────────────────────────────────────

export type AvailabilityCell = {
  teacherId: string;
  dayOfWeek: DayOfWeek;
  slotNumber: number;
  available: boolean;
};

export type ConstraintMatrix = {
  teacherGrid: Map<string, Set<string>>; // teacherId → Set<"DAY:slot">
  streamGrid:  Map<string, Set<string>>; // streamId  → Set<"DAY:slot">
};

export type PlacedSlot = {
  streamId:       string;
  streamSubjectId: string;
  teacherId:      string;
  dayOfWeek:      DayOfWeek;
  slotNumber:     number;
  startTime:      string;
  endTime:        string;
  slotType:       SlotType;
  isDouble:       boolean;
};

export type ConflictType =
  | "TEACHER_DOUBLE_BOOKED"
  | "STREAM_DOUBLE_BOOKED"
  | "TEACHER_UNAVAILABLE"
  | "UNPLACED_SUBJECT"
  | "INSUFFICIENT_SLOTS"
  | "NO_TEACHER_ASSIGNED"
  | "FREQUENCY_NOT_MET"
  | "PART_TIME_VIOLATION"
  | "TEACHER_ON_LEAVE"
  | "SLOT_TYPE_MISMATCH"
  | "SUBJECT_TWICE_IN_ONE_DAY"
  | "TEACHER_GAPS"
  | "DOUBLE_PERIOD_NOT_CONSECUTIVE"
  | "PREFERRED_DAY_IGNORED"
  | "DIFFICULT_SUBJECT_LAST_SLOT"
  | "SAME_SUBJECT_CONSECUTIVE_DAYS";

export type GenerationConflict = {
  conflictType: ConflictType;
  severity:     "ERROR" | "WARNING";
  description:  string;
  dayOfWeek?:   DayOfWeek;
  slotNumber?:  number;
  streamId?:    string;
  teacherId?:   string;
  subjectId?:   string;
};

export type GenerationResult = {
  placed:    PlacedSlot[];
  conflicts: GenerationConflict[];
  success:   boolean;
  generationStats?: {
    generationsRun:   number;
    finalBestFitness: number;
    populationSize:   number;
    stoppedEarly:     boolean;
    stoppedReason:    "CONVERGED" | "NO_IMPROVEMENT" | "MAX_GENERATIONS";
  };
};

// ─── Input types ─────────────────────────────────────────────────────────────

export type SchoolDaySlotData = {
  slotNumber:  number;
  startTime:   string;
  endTime:     string;
  slotType:    SlotType;
  label?:      string | null;
  durationMin: number;
};

export type SchoolDayConfigWithSlots = {
  id:        string;
  dayOfWeek: DayOfWeek;
  isActive:  boolean;
  slots:     SchoolDaySlotData[];
};

export type StreamSubjectWithRelations = {
  id:            string;
  streamId:      string;
  subjectId:     string;
  classSubjectId: string;
  subjectPaperId: string | null;
  teacherAssignments: { teacherId: string; status: string }[];
  classSubject: {
    timetableConfig: { lessonsPerWeek: number; allowDoubles: boolean } | null;
  };
};

export type ClassSubjectConfigMap = Map<string, { lessonsPerWeek: number; allowDoubles: boolean }>;

export type TeacherAvailabilityMap = Map<string, Map<DayOfWeek, { isAvailable: boolean; from?: string; to?: string }>>;

export type ApprovedLeave = {
  teacherId: string;
  startDate: Date;
  endDate:   Date;
};

export type GeneratorInput = {
  schoolId:         string;
  academicYearId:   string;
  termId:           string;
  termStartDate:    Date;
  termEndDate:      Date;
  dayConfigs:       SchoolDayConfigWithSlots[];
  streamSubjects:   StreamSubjectWithRelations[];
  teacherAvailability: TeacherAvailabilityMap;
  approvedLeaves:   ApprovedLeave[];
  lessonDurationMin?: number; // default 40 — used when auto-computing slot end times
};

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const SchoolDayConfigSchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  isActive:  z.boolean().default(true),
  label:     z.string().optional(),
  slots: z.array(z.object({
    slotNumber:  z.number().int().min(1),
    startTime:   z.string().regex(/^\d{2}:\d{2}$/),
    endTime:     z.string().regex(/^\d{2}:\d{2}$/),
    slotType:    z.nativeEnum(SlotType).default(SlotType.LESSON),
    label:       z.string().optional(),
    durationMin: z.number().int().min(1).default(40),
  })),
});

export const ClassSubjectConfigSchema = z.object({
  classSubjectId: z.string().cuid(),
  lessonsPerWeek: z.number().int().min(1).max(10).default(3),
  allowDoubles:   z.boolean().default(false),
  preferMorning:  z.boolean().default(false),
});

export const TeacherAvailabilitySchema = z.object({
  teacherId:     z.string().cuid(),
  dayOfWeek:     z.nativeEnum(DayOfWeek),
  isAvailable:   z.boolean().default(true),
  availableFrom: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  availableTo:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes:         z.string().optional(),
});

export const GenerateTimetableSchema = z.object({
  schoolId:         z.string().cuid(),
  academicYearId:   z.string().cuid(),
  termId:           z.string().cuid(),
  label:            z.string().optional(),
  lessonDurationMin: z.number().int().min(20).max(180).optional(),
});
