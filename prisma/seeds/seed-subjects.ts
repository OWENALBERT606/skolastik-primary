// prisma/seeds/seed-subjects.ts
//
// Seeds Uganda Primary Curriculum subjects for a given school (P1–P7).
// No papers — each subject is assessed as a whole unit.
//
// Usage: npx tsx prisma/seeds/seed-subjects.ts <schoolId>

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const PRIMARY_SUBJECTS = [
  { name: "English Language",       code: "ENG", category: "Languages",  description: "Reading, writing, listening and speaking skills in English." },
  { name: "Mathematics",            code: "MTH", category: "Sciences",   description: "Number, measurement, geometry, patterns and data handling." },
  { name: "Science and Technology", code: "SCI", category: "Sciences",   description: "Basic science concepts, environment, health and simple technology." },
  { name: "Social Studies",         code: "SST", category: "Humanities", description: "Uganda, East Africa, civics, geography and history for primary learners." },
  { name: "Religious Education",    code: "RE",  category: "Humanities", description: "Christian Religious Education (CRE) and Islamic Religious Education (IRE)." },
  { name: "Local Language",         code: "LOC", category: "Languages",  description: "Mother-tongue literacy and oral communication in the local language." },
  { name: "Agriculture",            code: "AGR", category: "Technical",  description: "Basic farming, crop growing, animal care and environmental conservation." },
];

export async function seedSubjects(schoolId: string) {
  console.log(`\n🌱 Seeding Uganda Primary subjects for school: ${schoolId}`);

  const school = await db.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true } });
  if (!school) throw new Error(`School not found: ${schoolId}`);
  console.log(`🏫 School: ${school.name}`);

  let created = 0;
  let updated = 0;

  for (const def of PRIMARY_SUBJECTS) {
    const existing = await db.subject.findUnique({
      where: { schoolId_code: { schoolId, code: def.code } },
    });

    if (existing) {
      await db.subject.update({
        where: { id: existing.id },
        data:  { name: def.name, description: def.description, category: def.category, isActive: true },
      });
      updated++;
      console.log(`  ↻ Updated : ${def.name} (${def.code})`);
    } else {
      await db.subject.create({
        data: { name: def.name, code: def.code, description: def.description,
                category: def.category, schoolId, isActive: true },
      });
      created++;
      console.log(`  ✓ Created : ${def.name} (${def.code})`);
    }
  }

  console.log(`\n✅ Done — ${created} created, ${updated} updated\n`);
  return { created, updated };
}

async function main() {
  const schoolId = process.argv[2];
  if (!schoolId) {
    console.error("\n❌ Usage: npx tsx prisma/seeds/seed-subjects.ts <schoolId>\n");
    process.exit(1);
  }
  try {
    await seedSubjects(schoolId);
  } catch (e: any) {
    console.error("❌ Seed failed:", e.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
