// prisma/seeds/seed-timetable-data.ts
//
// Comprehensive timetable seed — sets up all data needed to test
// timetable generation for a school.
//
// What it seeds:
//   1. SchoolDayConfig + SchoolDaySlot  — Mon–Fri, 10-slot day
//   2. ClassDayConfig + ClassDaySlot    — S5/S6 override with 2 PREP slots
//   3. ClassSubject                     — O-Level subjects → S1–S4, A-Level → S5–S6
//   4. StreamSubject                    — links subjects to each stream for active term
//   5. StreamSubjectTeacher             — assigns teachers to stream subjects
//   6. ClassSubjectConfig               — periods/week per subject per class
//   7. TeacherAvailability              — part-time teachers: Mon–Wed only
//
// Usage:
//   npx ts-node prisma/seeds/seed-timetable-data.ts
//   npx ts-node prisma/seeds/seed-timetable-data.ts <schoolId>

import {
  PrismaClient,
  DayOfWeek,
  SlotType,
  SubjectType,
} from "@prisma/client";

const db = new PrismaClient();

const WEEKDAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

// ════════════════════════════════════════════════════════════════════════════
// DAY SLOT DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

// Standard school day: 8 LESSON + 1 BREAK + 1 LUNCH = 10 slots
const STANDARD_DAY_SLOTS = [
  { slotNumber: 1,  startTime: "07:30", endTime: "08:10", slotType: SlotType.LESSON, label: "Period 1",  durationMin: 40 },
  { slotNumber: 2,  startTime: "08:10", endTime: "08:50", slotType: SlotType.LESSON, label: "Period 2",  durationMin: 40 },
  { slotNumber: 3,  startTime: "08:50", endTime: "09:30", slotType: SlotType.LESSON, label: "Period 3",  durationMin: 40 },
  { slotNumber: 4,  startTime: "09:30", endTime: "09:50", slotType: SlotType.BREAK,  label: "Break",     durationMin: 20 },
  { slotNumber: 5,  startTime: "09:50", endTime: "10:30", slotType: SlotType.LESSON, label: "Period 4",  durationMin: 40 },
  { slotNumber: 6,  startTime: "10:30", endTime: "11:10", slotType: SlotType.LESSON, label: "Period 5",  durationMin: 40 },
  { slotNumber: 7,  startTime: "11:10", endTime: "11:50", slotType: SlotType.LESSON, label: "Period 6",  durationMin: 40 },
  { slotNumber: 8,  startTime: "11:50", endTime: "12:30", slotType: SlotType.LUNCH,  label: "Lunch",     durationMin: 40 },
  { slotNumber: 9,  startTime: "12:30", endTime: "13:10", slotType: SlotType.LESSON, label: "Period 7",  durationMin: 40 },
  { slotNumber: 10, startTime: "13:10", endTime: "13:50", slotType: SlotType.LESSON, label: "Period 8",  durationMin: 40 },
];

// A-Level day: same 10 slots + 2 PREP slots at end
const ALEVEL_DAY_SLOTS = [
  ...STANDARD_DAY_SLOTS,
  { slotNumber: 11, startTime: "13:50", endTime: "14:30", slotType: SlotType.PREP, label: "Prep 1", durationMin: 40 },
  { slotNumber: 12, startTime: "14:30", endTime: "15:10", slotType: SlotType.PREP, label: "Prep 2", durationMin: 40 },
];

// ════════════════════════════════════════════════════════════════════════════
// SUBJECT PERIOD CONFIG
// Math/English = 5/week, Sciences = 4/week, others = 3/week
// ════════════════════════════════════════════════════════════════════════════

function getPeriodsConfig(subjectName: string): { lessonsPerWeek: number; allowDoubles: boolean } {
  const name = subjectName.toLowerCase();
  if (name.includes("math") || name.includes("english")) {
    return { lessonsPerWeek: 5, allowDoubles: true };
  }
  if (
    name.includes("physics") ||
    name.includes("chemistry") ||
    name.includes("biology") ||
    name.includes("further math")
  ) {
    return { lessonsPerWeek: 4, allowDoubles: false };
  }
  return { lessonsPerWeek: 3, allowDoubles: false };
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 1 — SCHOOL DAY CONFIG
// ════════════════════════════════════════════════════════════════════════════

async function seedSchoolDayConfig(schoolId: string) {
  console.log("\n📅 Step 1 — School day config (Mon–Fri, 10 slots)...");

  for (const day of WEEKDAYS) {
    const config = await db.schoolDayConfig.upsert({
      where:  { schoolId_dayOfWeek: { schoolId, dayOfWeek: day } },
      create: { schoolId, dayOfWeek: day, isActive: true, label: day },
      update: { isActive: true },
    });

    await db.schoolDaySlot.deleteMany({ where: { schoolDayConfigId: config.id } });
    await db.schoolDaySlot.createMany({
      data: STANDARD_DAY_SLOTS.map((s) => ({ ...s, schoolDayConfigId: config.id })),
    });
  }

  console.log("   ✓ 5 days × 10 slots seeded");
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 2 — CLASS DAY CONFIG OVERRIDE FOR S5/S6 (A-Level)
// ════════════════════════════════════════════════════════════════════════════

async function seedClassDayConfigs(schoolId: string) {
  console.log("\n📅 Step 2 — Class day config overrides...");
  // No level-specific overrides needed for primary education
  console.log("   ✓ No level-specific overrides for primary education");
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 3 — CLASS SUBJECTS
// Assign O-Level subjects to S1–S4, A-Level subjects to S5–S6
// ════════════════════════════════════════════════════════════════════════════

async function seedClassSubjects(schoolId: string) {
  console.log("\n📚 Step 3 — Class subjects...");

  const classYears = await db.classYear.findMany({
    where: { isActive: true, academicYear: { schoolId } },
    include: { classTemplate: { select: { name: true } } },
  });

  const allSubjects = await db.subject.findMany({
    where:  { schoolId, isActive: true },
    select: { id: true, name: true, code: true },
  });

  let created = 0;
  let skipped = 0;

  for (const classYear of classYears) {
    for (const subject of allSubjects) {
      const existing = await db.classSubject.findUnique({
        where: { classYearId_subjectId: { classYearId: classYear.id, subjectId: subject.id } },
      });

      if (existing) { skipped++; continue; }

      await db.classSubject.create({
        data: { classYearId: classYear.id, subjectId: subject.id, subjectType: SubjectType.COMPULSORY },
      });
      created++;
    }
  }

  console.log(`   ✓ ${created} class subjects created, ${skipped} already existed`);
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 4 — STREAM SUBJECTS
// Link subjects to each stream for the active term
// ════════════════════════════════════════════════════════════════════════════

async function seedStreamSubjects(schoolId: string) {
  console.log("\n🔀 Step 4 — Stream subjects...");

  // Get active academic year + active term
  const activeYear = await db.academicYear.findFirst({
    where:   { schoolId, isActive: true },
    include: { terms: { where: { isActive: true }, take: 1 } },
  });

  if (!activeYear || activeYear.terms.length === 0) {
    console.log("   ⚠  No active year/term found — skipping");
    return;
  }

  const activeTerm = activeYear.terms[0];

  // Get all streams for this school
  const streams = await db.stream.findMany({
    where: { schoolId },
    include: {
      classYear: {
        include: {
          classSubjects: {
            include: {
              subject: { select: { id: true, name: true, code: true } },
            },
          },
        },
      },
    },
  });

  let created = 0;
  let skipped = 0;

  for (const stream of streams) {
    for (const classSubject of stream.classYear.classSubjects) {
      // One StreamSubject per subject per term — no papers
      const existing = await db.streamSubject.findUnique({
        where: {
          streamId_subjectId_termId: {
            streamId:  stream.id,
            subjectId: classSubject.subjectId,
            termId:    activeTerm.id,
          },
        },
      });

      if (!existing) {
        await db.streamSubject.create({
          data: {
            streamId:       stream.id,
            subjectId:      classSubject.subjectId,
            classSubjectId: classSubject.id,
            termId:         activeTerm.id,
            subjectType:    classSubject.subjectType,
            isActive:       true,
          },
        });
        created++;
      } else {
        skipped++;
      }
    }
  }

  console.log(`   ✓ ${created} stream subjects created, ${skipped} already existed`);
  return activeTerm.id;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 5 — STREAM SUBJECT TEACHERS
// Delegated to seed-teacher-assignments.ts for specialization-based matching
// ════════════════════════════════════════════════════════════════════════════

async function seedStreamSubjectTeachers(schoolId: string) {
  const { seedTeacherAssignments } = await import("./seed-teacher-assignments");
  await seedTeacherAssignments(schoolId);
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 6 — CLASS SUBJECT CONFIG (periods per week)
// ════════════════════════════════════════════════════════════════════════════

async function seedClassSubjectConfigs(schoolId: string) {
  console.log("\n⏱  Step 6 — Class subject configs (periods/week)...");

  const classSubjects = await db.classSubject.findMany({
    where: { classYear: { isActive: true, academicYear: { schoolId } } },
    include: { subject: { select: { name: true } } },
  });

  let created = 0;
  let updated = 0;

  for (const cs of classSubjects) {
    const { lessonsPerWeek, allowDoubles } = getPeriodsConfig(cs.subject.name);

    const existing = await db.classSubjectConfig.findUnique({
      where: { classSubjectId: cs.id },
    });

    if (existing) {
      await db.classSubjectConfig.update({
        where: { classSubjectId: cs.id },
        data:  { lessonsPerWeek, allowDoubles },
      });
      updated++;
    } else {
      await db.classSubjectConfig.create({
        data: { classSubjectId: cs.id, lessonsPerWeek, allowDoubles },
      });
      created++;
    }
  }

  console.log(`   ✓ ${created} created, ${updated} updated`);
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 7 — TEACHER AVAILABILITY
// Full-time: available all 5 days (default)
// Part-time: Mon–Wed only, 08:00–15:00
// ════════════════════════════════════════════════════════════════════════════

async function seedTeacherAvailability(schoolId: string) {
  console.log("\n🗓  Step 7 — Teacher availability...");

  const teachers = await db.teacher.findMany({
    where:   { schoolId, currentStatus: "ACTIVE" },
    select:  { id: true, firstName: true, lastName: true, employmentType: true },
    orderBy: { createdAt: "asc" },
  });

  const partTimeDays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY];

  // Delete existing availability for this school's teachers and recreate
  await db.teacherAvailability.deleteMany({
    where: { schoolId },
  });

  const rows: {
    teacherId: string;
    schoolId: string;
    dayOfWeek: DayOfWeek;
    isAvailable: boolean;
    availableFrom: string | null;
    availableTo: string | null;
    notes: string | null;
  }[] = [];

  for (const teacher of teachers) {
    const isPartTime = (teacher.employmentType as string) === "PART_TIME";
    for (const day of WEEKDAYS) {
      const isAvailable = isPartTime ? (partTimeDays as string[]).includes(day) : true;
      rows.push({
        teacherId:     teacher.id,
        schoolId,
        dayOfWeek:     day,
        isAvailable,
        availableFrom: isPartTime && isAvailable ? "08:00" : null,
        availableTo:   isPartTime && isAvailable ? "15:00" : null,
        notes:         isPartTime && !isAvailable ? "Part-time: not available this day" : null,
      });
    }
  }

  // Insert in chunks of 50
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.teacherAvailability.createMany({
      data: rows.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
  }

  const partTimeCount = teachers.filter((t) => (t.employmentType as string) === "PART_TIME").length;
  console.log(`   ✓ ${rows.length} availability records seeded`);
  console.log(`   ✓ ${partTimeCount} part-time teachers restricted to Mon–Wed`);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("🚀 Starting comprehensive timetable seed...");
  console.log("─".repeat(60));

  const schoolIdArg = process.argv[2];

  let school: { id: string; name: string } | null = null;

  if (schoolIdArg) {
    school = await db.school.findUnique({
      where:  { id: schoolIdArg },
      select: { id: true, name: true },
    });
  } else {
    school = await db.school.findFirst({ select: { id: true, name: true } });
  }

  if (!school) {
    console.error("❌ No school found. Run seed-demo.ts first.");
    process.exit(1);
  }

  console.log(`\n🏫 School: ${school.name} (${school.id})`);

  await seedSchoolDayConfig(school.id);
  await seedClassDayConfigs(school.id);
  await seedClassSubjects(school.id);
  await seedStreamSubjects(school.id);
  await seedStreamSubjectTeachers(school.id);
  await seedClassSubjectConfigs(school.id);
  await seedTeacherAvailability(school.id);

  console.log("\n" + "─".repeat(60));
  console.log("✅ Timetable seed complete!\n");
  console.log("Next steps:");
  console.log("  1. Go to Academics → Timetable");
  console.log("  2. Check Day Config tab — school-wide and per-class configs");
  console.log("  3. Check Periods tab — periods/week per subject");
  console.log("  4. Check Availability tab — part-time teachers show Mon–Wed only");
  console.log("  5. Go to Generate tab and generate a timetable version\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
