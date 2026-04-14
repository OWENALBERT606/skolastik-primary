// prisma/seeds/timetable-seed.ts
// Seeds SchoolDayConfig, ClassSubjectConfig, and TeacherAvailability
import { PrismaClient, DayOfWeek, SlotType } from "@prisma/client";

const db = new PrismaClient();

const WEEKDAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

// 12-slot day: 8 LESSON + 1 BREAK + 1 LUNCH + 2 PREP
const DAY_SLOTS = [
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
  { slotNumber: 11, startTime: "13:50", endTime: "14:30", slotType: SlotType.PREP,   label: "Prep 1",    durationMin: 40 },
  { slotNumber: 12, startTime: "14:30", endTime: "15:10", slotType: SlotType.PREP,   label: "Prep 2",    durationMin: 40 },
];

export async function seedTimetableConfig(schoolId: string) {
  console.log(`Seeding timetable config for school ${schoolId}...`);

  // 1. School day configs
  for (const day of WEEKDAYS) {
    const config = await db.schoolDayConfig.upsert({
      where:  { schoolId_dayOfWeek: { schoolId, dayOfWeek: day } },
      create: { schoolId, dayOfWeek: day, isActive: true, label: day },
      update: { isActive: true },
    });

    // Replace slots
    await db.schoolDaySlot.deleteMany({ where: { schoolDayConfigId: config.id } });
    await db.schoolDaySlot.createMany({
      data: DAY_SLOTS.map(s => ({ ...s, schoolDayConfigId: config.id })),
    });
  }
  console.log("  ✓ School day configs seeded");

  // 2. ClassSubjectConfig — seed defaults for all class subjects in this school
  const classSubjects = await db.classSubject.findMany({
    where: { classYear: { academicYear: { school: { id: schoolId } } } },
    include: { subject: { select: { name: true } } },
  });

  for (const cs of classSubjects) {
    const name = cs.subject.name.toLowerCase();
    const lessonsPerWeek = name.includes("math") || name.includes("english") ? 5 : 3;

    await db.classSubjectConfig.upsert({
      where:  { classSubjectId: cs.id },
      create: { classSubjectId: cs.id, lessonsPerWeek, allowDoubles: false },
      update: { lessonsPerWeek },
    });
  }
  console.log(`  ✓ ClassSubjectConfig seeded for ${classSubjects.length} subjects`);

  // 3. TeacherAvailability — seed for all teachers in this school
  const teachers = await db.teacher.findMany({
    where:   { schoolId },
    select:  { id: true },
    orderBy: { createdAt: "asc" },
  });

  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    const isPartTime = i === 0; // first teacher is part-time Mon-Wed only

    const activeDays = isPartTime
      ? [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY]
      : WEEKDAYS;

    for (const day of WEEKDAYS) {
      await db.teacherAvailability.upsert({
        where:  { teacherId_dayOfWeek: { teacherId: teacher.id, dayOfWeek: day } },
        create: {
          teacherId:   teacher.id,
          schoolId,
          dayOfWeek:   day,
          isAvailable: activeDays.includes(day),
        },
        update: { isAvailable: activeDays.includes(day) },
      });
    }
  }
  console.log(`  ✓ TeacherAvailability seeded for ${teachers.length} teachers`);
}

// Run directly
async function main() {
  const school = await db.school.findFirst({ select: { id: true, name: true } });
  if (!school) {
    console.error("No school found. Run the main seed first.");
    process.exit(1);
  }
  await seedTimetableConfig(school.id);
  console.log("Timetable seed complete.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
