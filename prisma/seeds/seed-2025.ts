// prisma/seeds/seed-2025.ts
//
// Seeds a COMPLETE, INACTIVE academic year 2025 for all existing schools.
// ─────────────────────────────────────────────────────────────────────────
// What it does:
//   1. Creates AcademicYear 2025 (isActive: false) per school
//   2. Creates 3 Terms for 2025 (all isActive: false)
//   3. Creates ClassYears for 2025 (reuses existing ClassTemplates)
//   4. Creates Streams for 2025 class years (same names as current year)
//   5. Creates StreamSubjects for each stream/term (reuses existing Subjects)
//   6. Creates ClassAssessmentConfigs per classYear+term
//   7. Enrolls existing Students into 2025 streams (PROMOTED status)
//   8. Creates Exams (BOT, MTE, EOT) per classYear+term
//   9. Seeds ExamMarks + AOIScores for every subject enrollment
//  10. Computes SubjectResults + SubjectFinalMarks
//  11. Generates ReportCards with positions, aggregates, divisions
//
// SAFE: never deletes or modifies 2026 data.
// Run: npx tsx prisma/seeds/seed-2025.ts

import { PrismaClient, EnrollmentStatus, EnrollmentType, SubjectEnrollmentStatus, AssignmentStatus } from "@prisma/client";

const db = new PrismaClient();

const YEAR = "2025";

// ── Helpers ───────────────────────────────────────────────────────────────

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rndFloat(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getPrimaryGrade(pct: number): { grade: string; descriptor: string; points: number } {
  if (pct >= 80) return { grade: "D1", descriptor: "Excellent",     points: 1 };
  if (pct >= 75) return { grade: "D2", descriptor: "Very Good",     points: 2 };
  if (pct >= 70) return { grade: "C3", descriptor: "Good",          points: 3 };
  if (pct >= 65) return { grade: "C4", descriptor: "Good",          points: 4 };
  if (pct >= 60) return { grade: "C5", descriptor: "Satisfactory",  points: 5 };
  if (pct >= 55) return { grade: "C6", descriptor: "Satisfactory",  points: 6 };
  if (pct >= 50) return { grade: "P7", descriptor: "Pass",          points: 7 };
  if (pct >= 45) return { grade: "P8", descriptor: "Pass",          points: 8 };
  return              { grade: "F9", descriptor: "Fail",            points: 9 };
}

function getDivision(agg: number, subjects: number): string {
  if (subjects < 4) return "U";
  if (agg <= 6)  return "I";
  if (agg <= 14) return "II";
  if (agg <= 20) return "III";
  if (agg <= 25) return "IV";
  return "U";
}

const TEACHER_COMMENTS = [
  "A hardworking student who shows great dedication.",
  "Excellent performance this term. Keep it up!",
  "Good effort shown throughout the term.",
  "Satisfactory performance. More effort needed.",
  "Shows potential but needs to work harder.",
  "Consistent improvement noted this term.",
  "A pleasure to teach. Very focused student.",
  "Needs to improve on time management.",
];

const HEAD_COMMENTS = [
  "Well done. Continue with the same spirit.",
  "Good performance. Aim higher next term.",
  "Satisfactory. We expect better results.",
  "Keep working hard. The sky is the limit.",
  "Excellent results. We are proud of you.",
  "Improvement needed. Seek help where necessary.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Main seed ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌱 Seeding Academic Year ${YEAR} (inactive, benchmark data)\n`);
  console.log("─".repeat(60));

  // ── Load all schools ────────────────────────────────────────────────────
  const schools = await db.school.findMany({ select: { id: true, name: true, slug: true } });
  if (!schools.length) {
    console.error("❌ No schools found. Run the demo seed first.");
    process.exit(1);
  }
  console.log(`Found ${schools.length} school(s): ${schools.map(s => s.name).join(", ")}`);

  for (const school of schools) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`🏫 Processing: ${school.name}`);
    console.log("═".repeat(60));

    await seedSchool(school.id, school.name);
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`✅ Academic Year ${YEAR} seed complete!`);
  console.log("   2026 data is untouched.\n");
}

async function seedSchool(schoolId: string, schoolName: string) {

  // ── 1. Academic Year 2025 ───────────────────────────────────────────────
  console.log(`\n📅 Creating Academic Year ${YEAR}...`);

  const existingYear = await db.academicYear.findUnique({
    where: { year_schoolId: { year: YEAR, schoolId } },
  });

  let academicYear: { id: string };

  if (existingYear) {
    console.log(`   ↻  Year ${YEAR} already exists — resuming from where we left off`);
    academicYear = existingYear;
  } else {
    academicYear = await db.academicYear.create({
      data: {
        year:      YEAR,
        schoolId,
        isActive:  false,
        startDate: new Date("2025-02-03"),
        endDate:   new Date("2025-12-05"),
      },
    });
    console.log(`   ✓  AcademicYear ${YEAR} created (isActive: false)`);
  }

  // ── 2. Terms ────────────────────────────────────────────────────────────
  console.log(`\n📆 Creating 3 terms...`);

  const termDefs = [
    { termNumber: 1, name: "Term 1", start: "2025-02-03", end: "2025-05-09" },
    { termNumber: 2, name: "Term 2", start: "2025-05-26", end: "2025-08-15" },
    { termNumber: 3, name: "Term 3", start: "2025-09-01", end: "2025-12-05" },
  ];

  const terms: { id: string; termNumber: number; name: string }[] = [];

  for (const def of termDefs) {
    const term = await db.academicTerm.upsert({
      where: { termNumber_academicYearId: { academicYearId: academicYear.id, termNumber: def.termNumber } },
      create: {
        name:           def.name,
        termNumber:     def.termNumber,
        academicYearId: academicYear.id,
        startDate:      new Date(def.start),
        endDate:        new Date(def.end),
        isActive:       false,
      },
      update: {},
    });
    terms.push({ id: term.id, termNumber: def.termNumber, name: def.name });
    console.log(`   ✓  ${def.name}`);
  }

  // ── 3. Class Templates (reuse existing) ─────────────────────────────────
  console.log(`\n📚 Loading class templates...`);

  const classTemplates = await db.classTemplate.findMany({
    where:   { schoolId },
    orderBy: { level: "asc" },
  });

  if (!classTemplates.length) {
    console.log("   ⚠  No class templates found — skipping");
    return;
  }
  console.log(`   ✓  Found ${classTemplates.length} templates`);

  // ── 4. Class Years ──────────────────────────────────────────────────────
  console.log(`\n🎓 Creating class years for ${YEAR}...`);

  const classYears: { id: string; templateCode: string; templateName: string }[] = [];

  for (const tmpl of classTemplates) {
    const existing = await db.classYear.findFirst({
      where: { classTemplateId: tmpl.id, academicYearId: academicYear.id },
    });
    const cy = existing ?? await db.classYear.create({
      data: {
        classTemplateId: tmpl.id,
        academicYearId:  academicYear.id,
        isActive:        false,
        maxStudents:     80,
      },
    });
    classYears.push({ id: cy.id, templateCode: tmpl.code ?? tmpl.name, templateName: tmpl.name });
    console.log(`   ✓  ${tmpl.name}`);
  }

  // ── 5. Streams (mirror current year stream names) ───────────────────────
  console.log(`\n🔀 Creating streams...`);

  // Find current year streams to mirror names
  const currentYear = await db.academicYear.findFirst({
    where: { schoolId, isActive: true },
    select: { id: true },
  });

  // Collect stream names per class template from current year
  const streamNamesByTemplate: Record<string, string[]> = {};

  if (currentYear) {
    for (const tmpl of classTemplates) {
      const currentCY = await db.classYear.findFirst({
        where: { classTemplateId: tmpl.id, academicYearId: currentYear.id },
        select: { id: true },
      });
      if (currentCY) {
        const currentStreams = await db.stream.findMany({
          where:  { classYearId: currentCY.id },
          select: { name: true },
        });
        streamNamesByTemplate[tmpl.id] = currentStreams.map(s => s.name);
      }
    }
  }

  // streams2025[classYearId] = [{ id, name }]
  const streams2025: Record<string, { id: string; name: string }[]> = {};

  for (const cy of classYears) {
    const tmpl = classTemplates.find(t => t.code === cy.templateCode || t.name === cy.templateName)!;
    const names = streamNamesByTemplate[tmpl.id] ?? ["North", "South"];
    streams2025[cy.id] = [];

    for (const name of names) {
      const stream = await db.stream.upsert({
        where: { classYearId_name: { classYearId: cy.id, name } },
        create: { name, classYearId: cy.id, schoolId },
        update: {},
      });
      streams2025[cy.id].push({ id: stream.id, name });
    }
    console.log(`   ✓  ${cy.templateName}: ${names.join(", ")}`);
  }

  // ── 6. Subjects (reuse existing school subjects) ─────────────────────────
  console.log(`\n📖 Loading subjects...`);

  const subjects = await db.subject.findMany({
    where:   { schoolId },
    include: { papers: true },
    orderBy: { name: "asc" },
  });

  console.log(`   ✓  Found ${subjects.length} subjects`);

  // ── 7. ClassSubjects + StreamSubjects + AssessmentConfigs ────────────────
  console.log(`\n📝 Creating class subjects, stream subjects and assessment configs...`);

  // streamSubjectIds[streamId][termId] = [streamSubjectId]
  const streamSubjectIds: Record<string, Record<string, string[]>> = {};

  for (const cy of classYears) {
    const levelSubjects = subjects.slice(0, 9);

    // Assessment configs (batch)
    await db.classAssessmentConfig.createMany({
      data: terms.map(term => ({
        classYearId:  cy.id,
        termId:       term.id,
        hasAOI:       true,
        aoiWeight:    20,
        maxAOICount:  6,
        aoiMaxPoints: 3,
        hasBOT:       false,
        hasMTE:       true,
        hasEOT:       true,
        botWeight:    0,
        mteWeight:    40,
        eotWeight:    60,
        isLocked:     false,
      })),
      skipDuplicates: true,
    });

    // ClassSubjects (batch upsert via createMany + skipDuplicates)
    await db.classSubject.createMany({
      data: levelSubjects.map(s => ({
        classYearId: cy.id,
        subjectId:   s.id,
        subjectType: "COMPULSORY" as const,
      })),
      skipDuplicates: true,
    });

    // Fetch the created/existing ClassSubjects
    const classSubjects = await db.classSubject.findMany({
      where: { classYearId: cy.id, subjectId: { in: levelSubjects.map(s => s.id) } },
      select: { id: true, subjectId: true },
    });
    const classSubjectMap: Record<string, string> = {};
    for (const cs of classSubjects) classSubjectMap[cs.subjectId] = cs.id;

    // Fetch existing StreamSubjects for this classYear's streams to avoid duplicates
    const streamIds = (streams2025[cy.id] ?? []).map(s => s.id);
    const existingSS = await db.streamSubject.findMany({
      where: { streamId: { in: streamIds }, termId: { in: terms.map(t => t.id) } },
      select: { id: true, streamId: true, subjectId: true, termId: true, subjectPaperId: true },
    });
    const existingSSKeys = new Set(existingSS.map(ss =>
      `${ss.streamId}:${ss.subjectId}:${ss.termId}:${ss.subjectPaperId ?? "null"}`
    ));
    // Index existing by key for ID lookup
    const existingSSMap: Record<string, string> = {};
    for (const ss of existingSS) {
      existingSSMap[`${ss.streamId}:${ss.subjectId}:${ss.termId}:${ss.subjectPaperId ?? "null"}`] = ss.id;
    }

    // Build new StreamSubject rows
    const newSSRows: any[] = [];
    for (const stream of (streams2025[cy.id] ?? [])) {
      streamSubjectIds[stream.id] = {};
      for (const term of terms) {
        streamSubjectIds[stream.id][term.id] = [];
        for (const subject of levelSubjects) {
          const classSubjectId = classSubjectMap[subject.id];
          if (!classSubjectId) continue;

          if (subject.papers.length > 0) {
            for (const paper of subject.papers) {
              const key = `${stream.id}:${subject.id}:${term.id}:${paper.id}`;
              if (!existingSSKeys.has(key)) {
                newSSRows.push({
                  streamId: stream.id, subjectId: subject.id, subjectPaperId: paper.id,
                  termId: term.id, classSubjectId, subjectType: "COMPULSORY", isActive: true,
                });
                existingSSKeys.add(key);
              }
            }
          } else {
            const key = `${stream.id}:${subject.id}:${term.id}:null`;
            if (!existingSSKeys.has(key)) {
              newSSRows.push({
                streamId: stream.id, subjectId: subject.id,
                termId: term.id, classSubjectId, subjectType: "COMPULSORY", isActive: true,
              });
              existingSSKeys.add(key);
            }
          }
        }
      }
    }

    // Batch insert new StreamSubjects
    if (newSSRows.length > 0) {
      await db.streamSubject.createMany({ data: newSSRows, skipDuplicates: true });
    }

    // Now fetch all StreamSubjects for these streams to populate streamSubjectIds
    const allSS = await db.streamSubject.findMany({
      where: { streamId: { in: streamIds }, termId: { in: terms.map(t => t.id) } },
      select: { id: true, streamId: true, termId: true },
    });
    for (const ss of allSS) {
      if (!streamSubjectIds[ss.streamId]) streamSubjectIds[ss.streamId] = {};
      if (!streamSubjectIds[ss.streamId][ss.termId]) streamSubjectIds[ss.streamId][ss.termId] = [];
      streamSubjectIds[ss.streamId][ss.termId].push(ss.id);
    }

    console.log(`   ✓  ${cy.templateName}`);
  }
  console.log(`   ✓  Class subjects, stream subjects and configs created`);

  // ── 8. Teacher assignments ───────────────────────────────────────────────
  console.log(`\n👩‍🏫 Assigning teachers to stream subjects...`);

  const teachers = await db.teacher.findMany({
    where:  { schoolId, status: "ACTIVE" },
    select: { id: true },
  });

  if (teachers.length > 0) {
    // Fetch all 2025 stream subjects for this school's streams
    const allStreamIds = Object.values(streams2025).flat().map(s => s.id);
    const allSS2025 = await db.streamSubject.findMany({
      where:  { streamId: { in: allStreamIds } },
      select: { id: true },
    });

    // Bulk-fetch existing assignments to skip duplicates
    const existingAssignments = await db.streamSubjectTeacher.findMany({
      where:  { streamSubjectId: { in: allSS2025.map(s => s.id) } },
      select: { streamSubjectId: true },
    });
    const assignedSSIds = new Set(existingAssignments.map(a => a.streamSubjectId));

    const newAssignments = allSS2025
      .filter(ss => !assignedSSIds.has(ss.id))
      .map((ss, i) => ({
        streamSubjectId: ss.id,
        teacherId:       teachers[i % teachers.length].id,
        role:            "TEACHER",
        status:          AssignmentStatus.ACTIVE,
        assignedDate:    new Date("2025-02-03"),
      }));

    const CHUNK = 200;
    for (let i = 0; i < newAssignments.length; i += CHUNK) {
      await db.streamSubjectTeacher.createMany({
        data: newAssignments.slice(i, i + CHUNK),
        skipDuplicates: true,
      });
    }
    console.log(`   ✓  ${newAssignments.length} teacher assignments created`);
  } else {
    console.log(`   ⚠  No active teachers found — skipping`);
  }

  // ── 9. Load existing students ────────────────────────────────────────────
  console.log(`\n🎒 Loading existing students...`);

  const students = await db.student.findMany({
    where:   { schoolId },
    select:  { id: true, parentId: true },
  });

  console.log(`   ✓  Found ${students.length} students`);

  if (!students.length) {
    console.log("   ⚠  No students found — skipping enrollments");
    return;
  }

  // ── 9. Enroll students into 2025 streams ─────────────────────────────────
  console.log(`\n📋 Enrolling students into ${YEAR} streams...`);

  const allStreams: { streamId: string; classYearId: string }[] = [];
  for (const cy of classYears) {
    for (const s of (streams2025[cy.id] ?? [])) {
      allStreams.push({ streamId: s.id, classYearId: cy.id });
    }
  }

  // Bulk-fetch existing 2025 enrollments
  const existing2025Enrollments = await db.enrollment.findMany({
    where: { academicYearId: academicYear.id },
    select: { id: true, studentId: true, termId: true },
  });
  const existingEnrollmentMap: Record<string, string> = {};
  for (const e of existing2025Enrollments) {
    existingEnrollmentMap[`${e.studentId}:${e.termId}`] = e.id;
  }

  // enrollments2025[studentId][termId] = enrollmentId
  const enrollments2025: Record<string, Record<string, string>> = {};

  // Build new enrollment rows
  const newEnrollmentData: any[] = [];
  for (let i = 0; i < students.length; i++) {
    const student    = students[i];
    const streamSlot = allStreams[i % allStreams.length];
    enrollments2025[student.id] = {};

    for (const term of terms) {
      const key = `${student.id}:${term.id}`;
      if (existingEnrollmentMap[key]) {
        enrollments2025[student.id][term.id] = existingEnrollmentMap[key];
      } else {
        newEnrollmentData.push({
          studentId:      student.id,
          classYearId:    streamSlot.classYearId,
          streamId:       streamSlot.streamId,
          academicYearId: academicYear.id,
          termId:         term.id,
          enrollmentType: EnrollmentType.PROMOTED,
          status:         EnrollmentStatus.COMPLETED,
          _streamSlotStreamId: streamSlot.streamId, // temp for subject enrollment
          _termId: term.id,
          _studentId: student.id,
        });
      }
    }
  }

  // Create new enrollments one by one (need IDs back for subject enrollments)
  let enrollCount = 0;
  const subjectEnrollmentsBatch: any[] = [];

  for (const row of newEnrollmentData) {
    const { _streamSlotStreamId, _termId, _studentId, ...data } = row;
    try {
      const enrollment = await db.enrollment.create({ data });
      enrollments2025[_studentId][_termId] = enrollment.id;

      const ssIds = streamSubjectIds[_streamSlotStreamId]?.[_termId] ?? [];
      for (const ssId of ssIds) {
        subjectEnrollmentsBatch.push({
          enrollmentId:    enrollment.id,
          streamSubjectId: ssId,
          status:          SubjectEnrollmentStatus.COMPLETED,
          isCompulsory:    true,
          isAutoEnrolled:  true,
        });
      }
      enrollCount++;
    } catch {
      // Already exists — fetch it
      const fallback = await db.enrollment.findUnique({
        where: { studentId_termId: { studentId: _studentId, termId: _termId } },
      });
      if (fallback) enrollments2025[_studentId][_termId] = fallback.id;
    }
  }

  // Batch insert subject enrollments
  const SE_CHUNK = 200;
  for (let i = 0; i < subjectEnrollmentsBatch.length; i += SE_CHUNK) {
    await db.studentSubjectEnrollment.createMany({
      data: subjectEnrollmentsBatch.slice(i, i + SE_CHUNK),
      skipDuplicates: true,
    });
  }

  console.log(`   ✓  ${enrollCount} new enrollments, ${subjectEnrollmentsBatch.length} subject enrollments`);

  // ── 10. Exams ─────────────────────────────────────────────────────────────
  console.log(`\n📝 Creating exams...`);

  // exams[classYearId][termId] = { mte: id, eot: id }
  const exams: Record<string, Record<string, { mte: string; eot: string }>> = {};

  for (const cy of classYears) {
    exams[cy.id] = {};
    for (const term of terms) {
      const existingMte = await db.exam.findFirst({
        where: { examType: "MTE", termId: term.id, classYearId: cy.id },
      });
      const existingEot = await db.exam.findFirst({
        where: { examType: "EOT", termId: term.id, classYearId: cy.id },
      });
      const mte = existingMte ?? await db.exam.create({
        data: {
          name:        `MTE ${term.name} ${YEAR}`,
          examType:    "MTE",
          date:        new Date(`${YEAR}-0${term.termNumber * 2}-15`),
          maxMarks:    100,
          termId:      term.id,
          classYearId: cy.id,
        },
      });
      const eot = existingEot ?? await db.exam.create({
        data: {
          name:        `EOT ${term.name} ${YEAR}`,
          examType:    "EOT",
          date:        new Date(`${YEAR}-0${term.termNumber * 2 + 1}-01`),
          maxMarks:    100,
          termId:      term.id,
          classYearId: cy.id,
        },
      });
      exams[cy.id][term.id] = { mte: mte.id, eot: eot.id };
    }
  }
  console.log(`   ✓  Exams created`);

  // ── 11. Marks + Results + Report Cards (batched) ─────────────────────────
  console.log(`\n📊 Seeding marks, results, and report cards...`);

  // Bulk-fetch all subject enrollments for 2025 enrollments
  const allEnrollmentIds = Object.values(enrollments2025).flatMap(t => Object.values(t));

  const allSubjectEnrollments = await db.studentSubjectEnrollment.findMany({
    where:   { enrollmentId: { in: allEnrollmentIds } },
    include: { streamSubject: { include: { subject: true, subjectPaper: true } } },
  });

  // Group by enrollmentId
  const seByEnrollment: Record<string, typeof allSubjectEnrollments> = {};
  for (const se of allSubjectEnrollments) {
    if (!seByEnrollment[se.enrollmentId]) seByEnrollment[se.enrollmentId] = [];
    seByEnrollment[se.enrollmentId].push(se);
  }

  // Bulk-fetch existing exam marks to skip duplicates
  const existingExamMarkKeys = new Set(
    (await db.examMark.findMany({
      where: { studentSubjectEnrollmentId: { in: allSubjectEnrollments.map(s => s.id) } },
      select: { examId: true, studentSubjectEnrollmentId: true },
    })).map(m => `${m.examId}:${m.studentSubjectEnrollmentId}`)
  );

  // Bulk-fetch existing SubjectResults and SubjectFinalMarks
  const existingResultIds = new Set(
    (await db.subjectResult.findMany({
      where: { studentSubjectEnrollmentId: { in: allSubjectEnrollments.map(s => s.id) } },
      select: { studentSubjectEnrollmentId: true },
    })).map(r => r.studentSubjectEnrollmentId)
  );
  const existingFinalMarkIds = new Set(
    (await db.subjectFinalMark.findMany({
      where: { studentSubjectEnrollmentId: { in: allSubjectEnrollments.map(s => s.id) } },
      select: { studentSubjectEnrollmentId: true },
    })).map(r => r.studentSubjectEnrollmentId)
  );

  // Bulk-fetch existing report cards
  const existingRcEnrollmentIds = new Set(
    (await db.reportCard.findMany({
      where: { enrollmentId: { in: allEnrollmentIds } },
      select: { enrollmentId: true },
    })).map(r => r.enrollmentId)
  );

  // Prepare batch arrays
  const examMarksBatch:     any[] = [];
  const subjectResultsBatch: any[] = [];
  const finalMarksBatch:    any[] = [];
  const reportCardsBatch:   any[] = [];

  // computed[seId] = { totalPct, grade, points, subjectId }
  const computed: Record<string, { totalPct: number; grade: string; points: number; subjectId: string }> = {};

  for (const student of students) {
    const streamSlot = allStreams[students.indexOf(student) % allStreams.length];

    for (const term of terms) {
      const enrollmentId = enrollments2025[student.id]?.[term.id];
      if (!enrollmentId) continue;

      const ses = seByEnrollment[enrollmentId] ?? [];
      if (!ses.length) continue;

      const examIds = exams[streamSlot.classYearId]?.[term.id];
      if (!examIds) continue;

      const subjectFinalsBySubjectId: Record<string, { totalPct: number; grade: string; points: number }> = {};

      for (const se of ses) {
        const mteMark = rnd(40, 95);
        const eotMark = rnd(45, 98);
        const aoiScores = Array.from({ length: 4 }, () => rndFloat(1.5, 3.0));
        const aoiAvg    = aoiScores.reduce((a, b) => a + b, 0) / 4;

        const aoiContrib       = (aoiAvg / 3) * 20;
        const mteContrib       = (mteMark / 100) * 80 * 0.4;
        const eotContrib       = (eotMark / 100) * 80 * 0.6;
        const summativeContrib = mteContrib + eotContrib;
        const totalPct         = Math.min(100, aoiContrib + summativeContrib);
        const gradeResult      = getPrimaryGrade(totalPct);

        // ExamMarks
        const mteKey = `${examIds.mte}:${se.id}`;
        const eotKey = `${examIds.eot}:${se.id}`;
        if (!existingExamMarkKeys.has(mteKey)) {
          examMarksBatch.push({
            examId: examIds.mte, studentSubjectEnrollmentId: se.id,
            subjectPaperId: se.streamSubject.subjectPaperId ?? null,
            marksObtained: mteMark, outOf: 100, status: "APPROVED", enteredAt: new Date(),
          });
          existingExamMarkKeys.add(mteKey);
        }
        if (!existingExamMarkKeys.has(eotKey)) {
          examMarksBatch.push({
            examId: examIds.eot, studentSubjectEnrollmentId: se.id,
            subjectPaperId: se.streamSubject.subjectPaperId ?? null,
            marksObtained: eotMark, outOf: 100, status: "APPROVED", enteredAt: new Date(),
          });
          existingExamMarkKeys.add(eotKey);
        }

        // SubjectResult
        if (!existingResultIds.has(se.id)) {
          subjectResultsBatch.push({
            studentSubjectEnrollmentId: se.id,
            u1Score: aoiScores[0], u2Score: aoiScores[1], u3Score: aoiScores[2], u4Score: aoiScores[3],
            aoiRawAverage: aoiAvg, aoiContribution: aoiContrib,
            mteMarks: mteMark, mteOutOf: 100, eotMarks: eotMark, eotOutOf: 100,
            summativeContribution: summativeContrib, totalPercentage: totalPct,
            finalGrade: gradeResult.grade, gradeDescriptor: gradeResult.descriptor,
            computedAt: new Date(),
          });
          existingResultIds.add(se.id);
        }

        // SubjectFinalMark
        if (!existingFinalMarkIds.has(se.id)) {
          finalMarksBatch.push({
            studentSubjectEnrollmentId: se.id,
            totalPercentage: totalPct, finalGrade: gradeResult.grade,
            gradeDescriptor: gradeResult.descriptor, gradePoints: gradeResult.points,
            pointsAwarded: gradeResult.points, computedAt: new Date(),
          });
          existingFinalMarkIds.add(se.id);
        }

        const subjectId = se.streamSubject.subjectId;
        if (!subjectFinalsBySubjectId[subjectId] || totalPct > subjectFinalsBySubjectId[subjectId].totalPct) {
          subjectFinalsBySubjectId[subjectId] = { totalPct, grade: gradeResult.grade, points: gradeResult.points };
        }
      }

      // Report card — Uganda Primary aggregates
      if (!existingRcEnrollmentIds.has(enrollmentId)) {
        const uniqueSubjectResults = Object.values(subjectFinalsBySubjectId);
        const totalSubjects = uniqueSubjectResults.length;
        const avgMark = totalSubjects > 0
          ? uniqueSubjectResults.reduce((s, r) => s + r.totalPct, 0) / totalSubjects : 0;

        const sorted = [...uniqueSubjectResults].sort((a, b) => a.points - b.points);
        const aggregatePoints = sorted.slice(0, 8).reduce((s, r) => s + r.points, 0);
        const division        = getDivision(aggregatePoints, totalSubjects);

        reportCardsBatch.push({
          enrollmentId,
          totalSubjects,
          totalMarks:          parseFloat(avgMark.toFixed(1)),
          averageMarks:        parseFloat(avgMark.toFixed(1)),
          classPosition:       rnd(1, 40),
          streamPosition:      rnd(1, 20),
          outOf:               20,
          aggregatePoints,
          division,
          classTeacherComment: pick(TEACHER_COMMENTS),
          headTeacherComment:  pick(HEAD_COMMENTS),
          generatedAt:         new Date(`${YEAR}-12-01`),
          publishedAt:         new Date(`${YEAR}-12-03`),
          isPublished:         true,
        });
        existingRcEnrollmentIds.add(enrollmentId);
      }
    }
  }

  // Flush batches
  const CHUNK = 100;
  for (let i = 0; i < examMarksBatch.length; i += CHUNK) {
    await db.examMark.createMany({ data: examMarksBatch.slice(i, i + CHUNK), skipDuplicates: true });
  }
  console.log(`   ✓  ${examMarksBatch.length} exam marks`);

  for (let i = 0; i < subjectResultsBatch.length; i += CHUNK) {
    await db.subjectResult.createMany({ data: subjectResultsBatch.slice(i, i + CHUNK), skipDuplicates: true });
  }
  console.log(`   ✓  ${subjectResultsBatch.length} subject results`);

  for (let i = 0; i < finalMarksBatch.length; i += CHUNK) {
    await db.subjectFinalMark.createMany({ data: finalMarksBatch.slice(i, i + CHUNK), skipDuplicates: true });
  }
  console.log(`   ✓  ${finalMarksBatch.length} subject final marks`);

  for (let i = 0; i < reportCardsBatch.length; i += CHUNK) {
    await db.reportCard.createMany({ data: reportCardsBatch.slice(i, i + CHUNK), skipDuplicates: true });
  }
  const reportCardCount = reportCardsBatch.length;
  console.log(`   ✓  ${reportCardCount} report cards generated`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const studentCount    = students.length;
  const enrollmentCount = await db.enrollment.count({ where: { academicYearId: academicYear.id } });
  const rcCount         = await db.reportCard.count({
    where: { enrollment: { academicYearId: academicYear.id } },
  });

  console.log(`\n📊 ${schoolName} — ${YEAR} summary:`);
  console.log(`   Students:    ${studentCount}`);
  console.log(`   Enrollments: ${enrollmentCount}`);
  console.log(`   Report Cards: ${rcCount}`);
}

// ── Run ───────────────────────────────────────────────────────────────────

main()
  .catch(e => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
