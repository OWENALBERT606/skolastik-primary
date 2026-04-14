// prisma/seeds/seed-2026.ts
//
// Seeds Academic Year 2026 for both demo schools.
// Uganda primary — subjects have NO papers, one mark per subject.
//
// Creates per school:
//   - Academic year 2026 + 3 terms
//   - P1–P7 class templates + class years
//   - 2 streams per class (East, West)
//   - 7 subjects (no papers)
//   - ClassSubjects + StreamSubjects per term
//   - Assessment configs (MTE 40% + EOT 60%)
//
// Usage: npx tsx prisma/seeds/seed-2026.ts

import { PrismaClient } from "@prisma/client";

const db         = new PrismaClient();
const YEAR       = "2026";
const SCHOOL_CODES = ["DPS", "DPS2"];

const CLASS_TEMPLATES = [
  { name: "Primary 1", code: "P1", level: 1 },
  { name: "Primary 2", code: "P2", level: 2 },
  { name: "Primary 3", code: "P3", level: 3 },
  { name: "Primary 4", code: "P4", level: 4 },
  { name: "Primary 5", code: "P5", level: 5 },
  { name: "Primary 6", code: "P6", level: 6 },
  { name: "Primary 7", code: "P7", level: 7 },
];

const STREAM_NAMES = ["East", "West"];

const TERM_DEFS = [
  { termNumber: 1, name: "Term 1", start: "2026-02-02", end: "2026-05-08" },
  { termNumber: 2, name: "Term 2", start: "2026-05-25", end: "2026-08-14" },
  { termNumber: 3, name: "Term 3", start: "2026-09-07", end: "2026-12-04" },
];

// No papers — each subject is assessed as a whole
const SUBJECTS = [
  { name: "English Language",       code: "ENG", category: "Languages"  },
  { name: "Mathematics",            code: "MTH", category: "Sciences"   },
  { name: "Science and Technology", code: "SCI", category: "Sciences"   },
  { name: "Social Studies",         code: "SST", category: "Humanities" },
  { name: "Religious Education",    code: "RE",  category: "Humanities" },
  { name: "Local Language",         code: "LOC", category: "Languages"  },
  { name: "Agriculture",            code: "AGR", category: "Technical"  },
];

async function main() {
  console.log(`\n🚀 Seeding Academic Year ${YEAR}\n${"─".repeat(50)}`);

  const schools = await db.school.findMany({
    where:  { code: { in: SCHOOL_CODES } },
    select: { id: true, name: true, code: true },
  });

  if (!schools.length) {
    console.error("❌ No schools found. Run seed-demo.ts first.");
    process.exit(1);
  }

  for (const school of schools) {
    console.log(`\n🏫 ${school.name} (${school.code})`);
    await seedSchool(school);
  }

  console.log(`\n${"─".repeat(50)}\n✅ Done!\n`);
}

async function seedSchool(school: { id: string; name: string; code: string }) {
  // 1. Academic Year
  const academicYear = await db.academicYear.upsert({
    where:  { year_schoolId: { year: YEAR, schoolId: school.id } },
    create: { year: YEAR, schoolId: school.id, isActive: true,
              startDate: new Date("2026-02-02"), endDate: new Date("2026-12-04") },
    update: {},
  });
  console.log(`  ✓ Academic year ${YEAR}`);

  // 2. Terms
  const terms: { id: string; termNumber: number }[] = [];
  for (const def of TERM_DEFS) {
    const term = await db.academicTerm.upsert({
      where:  { termNumber_academicYearId: { termNumber: def.termNumber, academicYearId: academicYear.id } },
      create: { name: def.name, termNumber: def.termNumber, academicYearId: academicYear.id,
                startDate: new Date(def.start), endDate: new Date(def.end),
                isActive: def.termNumber === 1 },
      update: {},
    });
    terms.push({ id: term.id, termNumber: def.termNumber });
  }
  console.log(`  ✓ 3 terms`);

  // 3. Subjects — no papers
  const subjectIds: string[] = [];
  for (const def of SUBJECTS) {
    const subject = await db.subject.upsert({
      where:  { schoolId_code: { schoolId: school.id, code: def.code } },
      create: { name: def.name, code: def.code, category: def.category,
                schoolId: school.id, isActive: true },
      update: {},
      select: { id: true },
    });
    subjectIds.push(subject.id);
  }
  console.log(`  ✓ ${subjectIds.length} subjects (no papers)`);

  // 4. Classes, streams, subjects assignment
  type StreamInfo = { id: string; classYearId: string };
  const allStreams: StreamInfo[] = [];

  for (const tmpl of CLASS_TEMPLATES) {
    // Class template
    let template = await db.classTemplate.findFirst({
      where: { schoolId: school.id, name: tmpl.name }, select: { id: true },
    });
    if (!template) {
      template = await db.classTemplate.create({
        data:   { name: tmpl.name, code: tmpl.code, level: tmpl.level, schoolId: school.id },
        select: { id: true },
      });
    }

    // Class year
    let classYear = await db.classYear.findUnique({
      where:  { classTemplateId_academicYearId: { classTemplateId: template.id, academicYearId: academicYear.id } },
      select: { id: true },
    });
    if (!classYear) {
      classYear = await db.classYear.create({
        data:   { classTemplateId: template.id, academicYearId: academicYear.id,
                  isActive: true, maxStudents: 60 },
        select: { id: true },
      });
    }

    // Assessment configs (one per term, batch)
    await db.classAssessmentConfig.createMany({
      data: terms.map(t => ({
        classYearId: classYear!.id, termId: t.id,
        hasBOT: false, hasMTE: true, hasEOT: true,
        botWeight: 0, mteWeight: 40, eotWeight: 60, isLocked: false,
      })),
      skipDuplicates: true,
    });

    // ClassSubjects (batch) — all compulsory, no papers
    await db.classSubject.createMany({
      data: subjectIds.map(subjectId => ({
        classYearId: classYear!.id, subjectId, subjectType: "COMPULSORY" as const,
      })),
      skipDuplicates: true,
    });

    // Fetch classSubject IDs for StreamSubject creation
    const classSubjects = await db.classSubject.findMany({
      where:  { classYearId: classYear.id },
      select: { id: true, subjectId: true },
    });
    const csMap: Record<string, string> = {};
    for (const cs of classSubjects) csMap[cs.subjectId] = cs.id;

    // Streams
    for (const streamName of STREAM_NAMES) {
      let stream = await db.stream.findUnique({
        where:  { classYearId_name: { classYearId: classYear.id, name: streamName } },
        select: { id: true },
      });
      if (!stream) {
        stream = await db.stream.create({
          data:   { name: streamName, classYearId: classYear.id, schoolId: school.id },
          select: { id: true },
        });
      }
      allStreams.push({ id: stream.id, classYearId: classYear.id });

      // StreamSubjects — one row per subject per term (no papers)
      const ssRows = terms.flatMap(term =>
        subjectIds.map(subjectId => ({
          streamId:       stream!.id,
          subjectId,
          classSubjectId: csMap[subjectId],
          termId:         term.id,
          subjectType:    "COMPULSORY" as const,
          isActive:       true,
        }))
      );
      await db.streamSubject.createMany({ data: ssRows, skipDuplicates: true });
    }
  }

  const totalStreams = CLASS_TEMPLATES.length * STREAM_NAMES.length;
  console.log(`  ✓ ${CLASS_TEMPLATES.length} classes × ${STREAM_NAMES.length} streams = ${totalStreams} streams`);
  console.log(`  ✓ StreamSubjects: ${totalStreams} streams × ${SUBJECTS.length} subjects × 3 terms = ${totalStreams * SUBJECTS.length * 3} rows`);
}

main()
  .catch(e => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
