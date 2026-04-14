// prisma/seeds/seed-teacher-assignments.ts
//
// Assigns teachers to stream subjects using specialization-based matching.
//
// Matching logic (in priority order):
//   1. Teacher specialization contains the subject name/category keyword
//   2. Round-robin fallback across all active teaching staff
//
// Safe to re-run — skips already-assigned stream subjects.
//
// Usage:
//   npx ts-node prisma/seeds/seed-teacher-assignments.ts
//   npx ts-node prisma/seeds/seed-teacher-assignments.ts <schoolId>

import { PrismaClient, AssignmentStatus } from "@prisma/client";

const db = new PrismaClient();

// ════════════════════════════════════════════════════════════════════════════
// SPECIALIZATION → SUBJECT KEYWORD MAP
// Keys are substrings of Teacher.specialization (from seed-staff.ts)
// Values are substrings to match against Subject.name or Subject.category
// ════════════════════════════════════════════════════════════════════════════

const SPEC_KEYWORDS: Record<string, string[]> = {
  "mathematics":   ["math"],
  "physics":       ["physics"],
  "biology":       ["biology"],
  "chemistry":     ["chemistry"],
  "english":       ["english", "literature", "general paper"],
  "history":       ["history"],
  "geography":     ["geography"],
  "economics":     ["economics"],
  "computer":      ["computer", "ict"],
  "accounts":      ["accounting", "commerce", "entrepreneurship"],
  "business":      ["accounting", "commerce", "entrepreneurship", "business"],
  "agriculture":   ["agriculture"],
  "physical education": ["physical education"],
  "fine art":      ["fine art"],
};

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function matchesSpecialization(
  specialization: string | null,
  subjectName: string,
  subjectCategory: string | null
): boolean {
  if (!specialization) return false;

  const spec = specialization.toLowerCase();
  const name = subjectName.toLowerCase();
  const cat  = (subjectCategory ?? "").toLowerCase();

  for (const [specKey, subjectKeywords] of Object.entries(SPEC_KEYWORDS)) {
    if (!spec.includes(specKey)) continue;
    for (const kw of subjectKeywords) {
      if (name.includes(kw) || cat.includes(kw)) return true;
    }
  }

  return false;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN SEED
// ════════════════════════════════════════════════════════════════════════════

export async function seedTeacherAssignments(schoolId: string) {
  console.log(`\n👩‍🏫 Seeding teacher → stream subject assignments for school ${schoolId}...`);

  // Load all active teachers with their specialization
  const teachers = await db.teacher.findMany({
    where:   { schoolId, currentStatus: "ACTIVE" },
    select:  {
      id:             true,
      firstName:      true,
      lastName:       true,
      specialization: true,
      employmentType: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (teachers.length === 0) {
    console.log("   ⚠  No active teachers found. Run seed-staff.ts first.");
    return;
  }

  console.log(`   Found ${teachers.length} active teachers`);

  // Load all stream subjects that have no active teacher assignment yet
  const unassigned = await db.streamSubject.findMany({
    where: {
      isActive: true,
      stream:   { schoolId },
      teacherAssignments: {
        none: { status: AssignmentStatus.ACTIVE },
      },
    },
    include: {
      subject: { select: { name: true, category: true, code: true } },
      stream:  { select: { name: true, classYear: { select: { classTemplate: { select: { name: true } } } } } },
    },
    orderBy: [
      { stream: { classYear: { classTemplate: { level: "asc" } } } },
      { subject: { name: "asc" } },
    ],
  });

  if (unassigned.length === 0) {
    console.log("   ✓ All stream subjects already have teacher assignments.");
    return;
  }

  console.log(`   Found ${unassigned.length} unassigned stream subjects\n`);

  // Build a workload counter so we can balance assignments
  const workload: Record<string, number> = {};
  for (const t of teachers) workload[t.id] = 0;

  // Pre-load existing workloads
  const existing = await db.streamSubjectTeacher.groupBy({
    by:    ["teacherId"],
    where: { status: AssignmentStatus.ACTIVE, streamSubject: { stream: { schoolId } } },
    _count: { teacherId: true },
  });
  for (const row of existing) {
    workload[row.teacherId] = (workload[row.teacherId] ?? 0) + row._count.teacherId;
  }

  let created  = 0;
  let matched  = 0;
  let fallback = 0;

  // Track per-subject assignments for this run (avoid assigning same teacher to same subject twice)
  const assignedThisRun = new Set<string>(); // `${teacherId}:${subjectId}`

  // Build all creates in memory first, then batch insert
  const toCreate: { streamSubjectId: string; teacherId: string }[] = [];

  for (const ss of unassigned) {
    const subjectName = ss.subject.name;
    const subjectCat  = ss.subject.category;

    // 1. Try specialization match
    const matchingTeachers = teachers.filter((t) =>
      matchesSpecialization(t.specialization, subjectName, subjectCat)
    );

    let chosenTeacher: (typeof teachers)[0] | null = null;

    if (matchingTeachers.length > 0) {
      const sorted = [...matchingTeachers].sort(
        (a, b) => (workload[a.id] ?? 0) - (workload[b.id] ?? 0)
      );
      chosenTeacher =
        sorted.find((t) => !assignedThisRun.has(`${t.id}:${ss.subjectId}`)) ?? sorted[0];
      matched++;
    } else {
      const sorted = [...teachers].sort(
        (a, b) => (workload[a.id] ?? 0) - (workload[b.id] ?? 0)
      );
      chosenTeacher =
        sorted.find((t) => !assignedThisRun.has(`${t.id}:${ss.subjectId}`)) ?? sorted[0];
      fallback++;
    }

    if (!chosenTeacher) continue;

    toCreate.push({ streamSubjectId: ss.id, teacherId: chosenTeacher.id });
    workload[chosenTeacher.id] = (workload[chosenTeacher.id] ?? 0) + 1;
    assignedThisRun.add(`${chosenTeacher.id}:${ss.subjectId}`);
    created++;
  }

  // Batch insert in chunks of 50 to avoid Neon connection timeouts
  const CHUNK = 50;
  for (let i = 0; i < toCreate.length; i += CHUNK) {
    const chunk = toCreate.slice(i, i + CHUNK);
    await db.streamSubjectTeacher.createMany({
      data: chunk.map((r) => ({
        streamSubjectId: r.streamSubjectId,
        teacherId:       r.teacherId,
        status:          AssignmentStatus.ACTIVE,
      })),
      skipDuplicates: true,
    });
  }

  console.log(`\n   Summary:`);
  console.log(`     Specialization match : ${matched}`);
  console.log(`     Fallback (round-robin): ${fallback}`);
  console.log(`     Total created        : ${created}`);

  // Print workload summary
  console.log(`\n   Teacher workloads after assignment:`);
  const sorted = [...teachers].sort((a, b) => (workload[b.id] ?? 0) - (workload[a.id] ?? 0));
  for (const t of sorted) {
    if ((workload[t.id] ?? 0) > 0) {
      console.log(
        `     ${`${t.firstName} ${t.lastName}`.padEnd(30)} ` +
        `${String(workload[t.id]).padStart(3)} assignments  ` +
        `[${t.specialization ?? "no specialization"}]`
      );
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CLI RUNNER
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  const schoolIdArg = process.argv[2];

  let school: { id: string; name: string } | null = null;

  if (schoolIdArg) {
    school = await db.school.findUnique({
      where:  { id: schoolIdArg },
      select: { id: true, name: true },
    });
    if (!school) {
      console.error(`❌ School not found: ${schoolIdArg}`);
      process.exit(1);
    }
  } else {
    school = await db.school.findFirst({ select: { id: true, name: true } });
    if (!school) {
      console.error("❌ No school found. Run seed-demo.ts first.");
      process.exit(1);
    }
  }

  console.log(`🏫 School: ${school.name}`);

  try {
    await seedTeacherAssignments(school.id);
    console.log("\n✅ Done.\n");
  } catch (e: any) {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
