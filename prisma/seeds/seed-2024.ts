// prisma/seeds/seed-2024.ts
//
// Seeds a complete, inactive Academic Year 2024 for the demo schools.
// Safe to re-run — cleans up existing 2024 data first, then re-seeds fresh.
//
// Run: npx tsx prisma/seeds/seed-2024.ts

import {
  PrismaClient,
  EnrollmentStatus,
  EnrollmentType,
  SubjectEnrollmentStatus,
  AssignmentStatus,
} from "@prisma/client";

const db = new PrismaClient();
const YEAR = "2024";
const DEMO_SCHOOL_CODES = ["SMCK", "GHS"];

// ── Helpers ───────────────────────────────────────────────────────────────

const rnd      = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const rndFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const pick     = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function getPrimaryGrade(pct: number) {
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

function getDivision(agg: number, n: number) {
  if (n < 4)     return "U";
  if (agg <= 6)  return "I";
  if (agg <= 14) return "II";
  if (agg <= 20) return "III";
  if (agg <= 25) return "IV";
  return "U";
}

// Term month offsets: term 1 → Feb/May, term 2 → Jun/Aug, term 3 → Sep/Dec
const TERM_EXAM_MONTHS = [
  { mte: "03", eot: "05" },
  { mte: "06", eot: "08" },
  { mte: "10", eot: "11" },
];

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

// ── Subject catalogue ─────────────────────────────────────────────────────

type PaperDef   = { paperNumber: number; name: string; paperCode: string; maxMarks: number; weight: number; aoiCount: number };
type SubjectDef = { name: string; code: string; category: string; papers: PaperDef[] };

const SUBJECTS: SubjectDef[] = [
  { name: "English Language",   code: "ENG", category: "Languages",
    papers: [{ paperNumber:1, name:"Paper 1 – Reading & Comprehension", paperCode:"ENG/1", maxMarks:100, weight:1.0, aoiCount:4 },
             { paperNumber:2, name:"Paper 2 – Composition & Grammar",   paperCode:"ENG/2", maxMarks:100, weight:1.0, aoiCount:4 }] },
  { name: "Mathematics",        code: "MTH", category: "Sciences",
    papers: [{ paperNumber:1, name:"Paper 1 – Number & Operations",   paperCode:"MTH/1", maxMarks:100, weight:1.0, aoiCount:4 },
             { paperNumber:2, name:"Paper 2 – Geometry & Statistics", paperCode:"MTH/2", maxMarks:100, weight:1.0, aoiCount:4 }] },
  { name: "Science and Technology", code: "SCI", category: "Sciences",
    papers: [{ paperNumber:1, name:"Paper 1 – Science Theory",    paperCode:"SCI/1", maxMarks:100, weight:1.0, aoiCount:4 },
             { paperNumber:2, name:"Paper 2 – Practical Science", paperCode:"SCI/2", maxMarks: 50, weight:0.5, aoiCount:2 }] },
  { name: "Social Studies",     code: "SST", category: "Humanities",
    papers: [{ paperNumber:1, name:"Paper 1 – Social Studies", paperCode:"SST/1", maxMarks:100, weight:1.0, aoiCount:4 }] },
  { name: "Religious Education",code: "RE",  category: "Humanities",
    papers: [{ paperNumber:1, name:"Paper 1 – Religious Education", paperCode:"RE/1", maxMarks:100, weight:1.0, aoiCount:4 }] },
  { name: "Local Language",     code: "LOC", category: "Languages",
    papers: [{ paperNumber:1, name:"Paper 1 – Local Language", paperCode:"LOC/1", maxMarks:100, weight:1.0, aoiCount:4 }] },
  { name: "Agriculture",        code: "AGR", category: "Technical",
    papers: [{ paperNumber:1, name:"Paper 1 – Agriculture Theory",    paperCode:"AGR/1", maxMarks:100, weight:1.0, aoiCount:4 },
             { paperNumber:2, name:"Paper 2 – Agriculture Practical", paperCode:"AGR/2", maxMarks: 50, weight:0.5, aoiCount:2 }] },
];

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌱 Seeding Academic Year ${YEAR} for demo schools\n${"─".repeat(60)}`);

  const schools = await db.school.findMany({
    where:  { code: { in: DEMO_SCHOOL_CODES } },
    select: { id: true, name: true, code: true },
  });
  if (!schools.length) { console.error("❌ No demo schools found. Run seed-demo.ts first."); process.exit(1); }
  console.log(`Found ${schools.length} school(s): ${schools.map(s => s.name).join(", ")}`);

  for (const school of schools) {
    console.log(`\n${"═".repeat(60)}\n🏫 ${school.name} (${school.code})\n${"═".repeat(60)}`);
    await seedSchool(school.id);
  }

  console.log(`\n${"─".repeat(60)}\n✅ Academic Year ${YEAR} seed complete!\n`);
}

// ── Per-school ────────────────────────────────────────────────────────────

async function seedSchool(schoolId: string) {

  // 1. Subjects
  console.log(`\n📖 Ensuring subjects...`);
  const subjectMap = await ensureSubjects(schoolId);
  console.log(`   ✓  ${Object.keys(subjectMap).length} subjects ready`);

  // 2. Academic Year
  console.log(`\n📅 Academic Year ${YEAR}...`);
  const academicYear = await db.academicYear.upsert({
    where:  { year_schoolId: { year: YEAR, schoolId } },
    create: { year: YEAR, schoolId, isActive: false, startDate: new Date("2024-02-05"), endDate: new Date("2024-12-06") },
    update: {},
  });
  console.log(`   ✓  id=${academicYear.id}`);

  // 3. Terms
  console.log(`\n📆 Terms...`);
  const termDefs = [
    { termNumber: 1, name: "Term 1", start: "2024-02-05", end: "2024-05-10" },
    { termNumber: 2, name: "Term 2", start: "2024-05-27", end: "2024-08-16" },
    { termNumber: 3, name: "Term 3", start: "2024-09-02", end: "2024-12-06" },
  ];
  const terms: { id: string; termNumber: number; name: string }[] = [];
  for (const def of termDefs) {
    const t = await db.academicTerm.upsert({
      where:  { termNumber_academicYearId: { academicYearId: academicYear.id, termNumber: def.termNumber } },
      create: { name: def.name, termNumber: def.termNumber, academicYearId: academicYear.id, startDate: new Date(def.start), endDate: new Date(def.end), isActive: false },
      update: {},
    });
    terms.push({ id: t.id, termNumber: def.termNumber, name: def.name });
    console.log(`   ✓  ${def.name}`);
  }

  // 4. Class Templates
  const classTemplates = await db.classTemplate.findMany({ where: { schoolId }, orderBy: { level: "asc" } });
  if (!classTemplates.length) { console.log("   ⚠  No class templates — skipping"); return; }
  console.log(`\n📚 ${classTemplates.length} class templates found`);

  // 5. Class Years
  console.log(`\n🎓 Class years...`);
  const classYears: { id: string; templateId: string; templateName: string }[] = [];
  for (const tmpl of classTemplates) {
    const cy = await db.classYear.upsert({
      where:  { classTemplateId_academicYearId: { classTemplateId: tmpl.id, academicYearId: academicYear.id } },
      create: { classTemplateId: tmpl.id, academicYearId: academicYear.id, isActive: false, maxStudents: 80 },
      update: {},
    });
    classYears.push({ id: cy.id, templateId: tmpl.id, templateName: tmpl.name });
    console.log(`   ✓  ${tmpl.name}`);
  }

  // 6. Streams — mirror current-year names
  console.log(`\n🔀 Streams...`);
  const currentYear = await db.academicYear.findFirst({ where: { schoolId, isActive: true }, select: { id: true } });
  const streamNamesByTemplate: Record<string, string[]> = {};
  if (currentYear) {
    for (const tmpl of classTemplates) {
      const curCY = await db.classYear.findFirst({ where: { classTemplateId: tmpl.id, academicYearId: currentYear.id }, select: { id: true } });
      if (curCY) {
        const ss = await db.stream.findMany({ where: { classYearId: curCY.id }, select: { name: true } });
        streamNamesByTemplate[tmpl.id] = ss.map(s => s.name);
      }
    }
  }

  const streams2024: Record<string, { id: string; name: string }[]> = {};
  for (const cy of classYears) {
    const names = streamNamesByTemplate[cy.templateId] ?? ["North", "South"];
    streams2024[cy.id] = [];
    for (const name of names) {
      const s = await db.stream.upsert({
        where:  { classYearId_name: { classYearId: cy.id, name } },
        create: { name, classYearId: cy.id, schoolId },
        update: {},
      });
      streams2024[cy.id].push({ id: s.id, name });
    }
    console.log(`   ✓  ${cy.templateName}: ${names.join(", ")}`);
  }

  // 7. ClassSubjects + StreamSubjects + AssessmentConfigs
  console.log(`\n📝 Class subjects, stream subjects, assessment configs...`);
  const streamSubjectIds: Record<string, Record<string, string[]>> = {};

  for (const cy of classYears) {
    const levelSubjects = Object.values(subjectMap);

    // Assessment configs
    await db.classAssessmentConfig.createMany({
      data: terms.map(t => ({
        classYearId: cy.id, termId: t.id,
        hasAOI: true, aoiWeight: 20, maxAOICount: 6, aoiMaxPoints: 3,
        hasBOT: false, hasMTE: true, hasEOT: true,
        botWeight: 0, mteWeight: 40, eotWeight: 60, isLocked: false,
      })),
      skipDuplicates: true,
    });

    // ClassSubjects
    await db.classSubject.createMany({
      data: levelSubjects.map(s => ({ classYearId: cy.id, subjectId: s.id, subjectType: "COMPULSORY" as const })),
      skipDuplicates: true,
    });
    const csRows = await db.classSubject.findMany({
      where: { classYearId: cy.id, subjectId: { in: levelSubjects.map(s => s.id) } },
      select: { id: true, subjectId: true },
    });
    const csMap: Record<string, string> = {};
    for (const cs of csRows) csMap[cs.subjectId] = cs.id;

    const streamIds = (streams2024[cy.id] ?? []).map(s => s.id);
    const existingSS = await db.streamSubject.findMany({
      where: { streamId: { in: streamIds }, termId: { in: terms.map(t => t.id) } },
      select: { id: true, streamId: true, termId: true, subjectId: true, subjectPaperId: true },
    });
    const existingSSKeys = new Set(existingSS.map(ss => `${ss.streamId}:${ss.subjectId}:${ss.termId}:${ss.subjectPaperId ?? "null"}`));

    const newSSRows: any[] = [];
    for (const stream of (streams2024[cy.id] ?? [])) {
      streamSubjectIds[stream.id] = {};
      for (const term of terms) {
        streamSubjectIds[stream.id][term.id] = [];
        for (const subj of levelSubjects) {
          const classSubjectId = csMap[subj.id];
          if (!classSubjectId) continue;
          if (subj.papers.length > 0) {
            for (const paper of subj.papers) {
              const key = `${stream.id}:${subj.id}:${term.id}:${paper.id}`;
              if (!existingSSKeys.has(key)) {
                newSSRows.push({ streamId: stream.id, subjectId: subj.id, subjectPaperId: paper.id, termId: term.id, classSubjectId, subjectType: "COMPULSORY", isActive: true });
                existingSSKeys.add(key);
              }
            }
          } else {
            const key = `${stream.id}:${subj.id}:${term.id}:null`;
            if (!existingSSKeys.has(key)) {
              newSSRows.push({ streamId: stream.id, subjectId: subj.id, termId: term.id, classSubjectId, subjectType: "COMPULSORY", isActive: true });
              existingSSKeys.add(key);
            }
          }
        }
      }
    }
    for (let i = 0; i < newSSRows.length; i += 200) {
      await db.streamSubject.createMany({ data: newSSRows.slice(i, i + 200), skipDuplicates: true });
    }

    // Re-fetch all SS IDs for this class's streams
    const allSS = await db.streamSubject.findMany({
      where: { streamId: { in: streamIds }, termId: { in: terms.map(t => t.id) } },
      select: { id: true, streamId: true, termId: true },
    });
    for (const ss of allSS) {
      if (!streamSubjectIds[ss.streamId]) streamSubjectIds[ss.streamId] = {};
      if (!streamSubjectIds[ss.streamId][ss.termId]) streamSubjectIds[ss.streamId][ss.termId] = [];
      streamSubjectIds[ss.streamId][ss.termId].push(ss.id);
    }
    console.log(`   ✓  ${cy.templateName} (${levelSubjects.length} subjects)`);
  }

  // 8. Teacher assignments
  console.log(`\n👩‍🏫 Teacher assignments...`);
  const teachers = await db.teacher.findMany({ where: { schoolId, status: "ACTIVE" }, select: { id: true } });
  if (teachers.length > 0) {
    const allStreamIds = Object.values(streams2024).flat().map(s => s.id);
    const allSS = await db.streamSubject.findMany({ where: { streamId: { in: allStreamIds } }, select: { id: true } });
    const alreadyAssigned = new Set(
      (await db.streamSubjectTeacher.findMany({ where: { streamSubjectId: { in: allSS.map(s => s.id) } }, select: { streamSubjectId: true } }))
        .map(a => a.streamSubjectId)
    );
    const newAssignments = allSS
      .filter(ss => !alreadyAssigned.has(ss.id))
      .map((ss, i) => ({ streamSubjectId: ss.id, teacherId: teachers[i % teachers.length].id, role: "TEACHER", status: AssignmentStatus.ACTIVE, assignedDate: new Date("2024-02-05") }));
    for (let i = 0; i < newAssignments.length; i += 200) {
      await db.streamSubjectTeacher.createMany({ data: newAssignments.slice(i, i + 200), skipDuplicates: true });
    }
    console.log(`   ✓  ${newAssignments.length} new assignments`);
  } else {
    console.log(`   ⚠  No active teachers`);
  }

  // 9. Students + Enrollments
  // ── Clean up existing 2024 data first (cascade handles child records) ──
  console.log(`\n🧹 Cleaning existing 2024 enrollments...`);
  const existing2024 = await db.enrollment.findMany({
    where: { academicYearId: academicYear.id },
    select: { id: true },
  });
  if (existing2024.length > 0) {
    // Cascade: deleting enrollment → deletes subjectEnrollments → deletes results/marks/reportCard
    await db.reportCard.deleteMany({ where: { enrollmentId: { in: existing2024.map(e => e.id) } } });
    await db.enrollment.deleteMany({ where: { id: { in: existing2024.map(e => e.id) } } });
    console.log(`   ↻  Removed ${existing2024.length} old enrollments (cascade cleaned child records)`);
  } else {
    console.log(`   ✓  No existing 2024 enrollments`);
  }

  // Also clean up orphaned exams from previous runs
  await db.exam.deleteMany({ where: { termId: { in: terms.map(t => t.id) } } });

  console.log(`\n🎒 Enrolling students...`);
  const students = await db.student.findMany({ where: { schoolId }, select: { id: true } });
  if (!students.length) { console.log("   ⚠  No students — skipping"); return; }
  console.log(`   ✓  ${students.length} students found`);

  // Distribute students across all streams
  const allStreams: { streamId: string; classYearId: string }[] = [];
  for (const cy of classYears) {
    for (const s of (streams2024[cy.id] ?? [])) {
      allStreams.push({ streamId: s.id, classYearId: cy.id });
    }
  }

  const studentStreamMap = new Map<string, { streamId: string; classYearId: string }>();
  for (let i = 0; i < students.length; i++) studentStreamMap.set(students[i].id, allStreams[i % allStreams.length]);

  console.log(`   ✓  ${students.length} students → ${allStreams.length} streams`);

  const enrollments2024: Record<string, Record<string, string>> = {};
  const subjectEnrollmentsBatch: any[] = [];
  let enrollCount = 0;

  for (const student of students) {
    const slot = studentStreamMap.get(student.id)!;
    enrollments2024[student.id] = {};
    for (const term of terms) {
      try {
        const enr = await db.enrollment.create({
          data: {
            studentId: student.id, classYearId: slot.classYearId,
            streamId: slot.streamId, academicYearId: academicYear.id,
            termId: term.id, enrollmentType: EnrollmentType.PROMOTED,
            status: EnrollmentStatus.COMPLETED,
          },
        });
        enrollments2024[student.id][term.id] = enr.id;
        enrollCount++;
        for (const ssId of (streamSubjectIds[slot.streamId]?.[term.id] ?? [])) {
          subjectEnrollmentsBatch.push({
            enrollmentId: enr.id, streamSubjectId: ssId,
            status: SubjectEnrollmentStatus.COMPLETED, isCompulsory: true, isAutoEnrolled: true,
          });
        }
      } catch (err: any) {
        console.error(`   ✗  Enrollment failed: student=${student.id} term=${term.id}: ${err.message}`);
      }
    }
  }

  for (let i = 0; i < subjectEnrollmentsBatch.length; i += 200) {
    await db.studentSubjectEnrollment.createMany({ data: subjectEnrollmentsBatch.slice(i, i + 200), skipDuplicates: true });
  }
  console.log(`   ✓  ${enrollCount} enrollments, ${subjectEnrollmentsBatch.length} subject enrollments`);

  // 10. Exams (fresh — old ones were deleted above)
  console.log(`\n📝 Creating exams...`);
  const exams: Record<string, Record<string, { mte: string; eot: string }>> = {};
  for (const cy of classYears) {
    exams[cy.id] = {};
    for (const term of terms) {
      const months = TERM_EXAM_MONTHS[term.termNumber - 1];
      const mte = await db.exam.create({ data: { name: `MTE ${term.name} ${YEAR}`, examType: "MTE", date: new Date(`${YEAR}-${months.mte}-15`), maxMarks: 100, termId: term.id, classYearId: cy.id } });
      const eot = await db.exam.create({ data: { name: `EOT ${term.name} ${YEAR}`, examType: "EOT", date: new Date(`${YEAR}-${months.eot}-30`), maxMarks: 100, termId: term.id, classYearId: cy.id } });
      exams[cy.id][term.id] = { mte: mte.id, eot: eot.id };
    }
  }
  console.log(`   ✓  ${classYears.length * terms.length * 2} exams created`);

  // 11. Marks + Results + Report Cards
  console.log(`\n📊 Seeding marks, results, report cards...`);

  const allEnrollmentIds = Object.values(enrollments2024).flatMap(t => Object.values(t));
  const allSEs = await db.studentSubjectEnrollment.findMany({
    where:   { enrollmentId: { in: allEnrollmentIds } },
    include: { streamSubject: { include: { subject: true, subjectPaper: true } } },
  });

  const seByEnrollment: Record<string, typeof allSEs> = {};
  for (const se of allSEs) {
    if (!seByEnrollment[se.enrollmentId]) seByEnrollment[se.enrollmentId] = [];
    seByEnrollment[se.enrollmentId].push(se);
  }

  const examMarksBatch:   any[] = [];
  const resultsBatch:     any[] = [];
  const finalMarksBatch:  any[] = [];
  const reportCardsBatch: any[] = [];

  for (const student of students) {
    const slot = studentStreamMap.get(student.id)!;

    for (const term of terms) {
      const enrollmentId = enrollments2024[student.id]?.[term.id];
      if (!enrollmentId) continue;

      const ses     = seByEnrollment[enrollmentId] ?? [];
      const examIds = exams[slot.classYearId]?.[term.id];
      if (!ses.length || !examIds) continue;

      // Per-subject computation
      const subjectFinals: Record<string, { totalPct: number; grade: string; points: number }> = {};

      for (const se of ses) {
        const mteMark  = rnd(42, 96);
        const eotMark  = rnd(45, 98);
        const aoiScores = Array.from({ length: 4 }, () => rndFloat(1.5, 3.0));
        const aoiAvg   = aoiScores.reduce((a, b) => a + b, 0) / 4;

        const aoiContrib  = (aoiAvg / 3) * 20;
        const mteContrib  = (mteMark / 100) * 80 * 0.4;
        const eotContrib  = (eotMark / 100) * 80 * 0.6;
        const summative   = mteContrib + eotContrib;
        const totalPct    = Math.min(100, aoiContrib + summative);

        const gradeResult = getPrimaryGrade(totalPct);

        examMarksBatch.push(
          { examId: examIds.mte, studentSubjectEnrollmentId: se.id, subjectPaperId: se.streamSubject.subjectPaperId ?? null, marksObtained: mteMark, outOf: 100, status: "APPROVED", enteredAt: new Date() },
          { examId: examIds.eot, studentSubjectEnrollmentId: se.id, subjectPaperId: se.streamSubject.subjectPaperId ?? null, marksObtained: eotMark, outOf: 100, status: "APPROVED", enteredAt: new Date() }
        );

        resultsBatch.push({
          studentSubjectEnrollmentId: se.id,
          u1Score: aoiScores[0], u2Score: aoiScores[1], u3Score: aoiScores[2], u4Score: aoiScores[3],
          aoiRawAverage: aoiAvg, aoiContribution: aoiContrib,
          mteMarks: mteMark, mteOutOf: 100, eotMarks: eotMark, eotOutOf: 100,
          summativeContribution: summative, totalPercentage: totalPct,
          finalGrade: gradeResult.grade, gradeDescriptor: gradeResult.descriptor,
          computedAt: new Date(),
        });

        finalMarksBatch.push({
          studentSubjectEnrollmentId: se.id,
          totalPercentage: totalPct, finalGrade: gradeResult.grade,
          gradeDescriptor: gradeResult.descriptor,
          gradePoints: gradeResult.points, pointsAwarded: gradeResult.points,
          computedAt: new Date(),
        });

        const sid = se.streamSubject.subjectId;
        if (!subjectFinals[sid] || totalPct > subjectFinals[sid].totalPct) {
          subjectFinals[sid] = { totalPct, grade: gradeResult.grade, points: gradeResult.points };
        }
      }

      // Report card — Uganda Primary aggregates
      const uniqueResults = Object.values(subjectFinals);
      const totalSubjects = uniqueResults.length;
      const avgMark = totalSubjects > 0 ? uniqueResults.reduce((s, r) => s + r.totalPct, 0) / totalSubjects : 0;
      const sorted = [...uniqueResults].sort((a, b) => a.points - b.points);
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
        isPublished:         true,
        generatedAt:         new Date(),
      });
    }
  }

  // Batch insert
  const CHUNK = 200;
  for (let i = 0; i < examMarksBatch.length;  i += CHUNK) await db.examMark.createMany({ data: examMarksBatch.slice(i, i + CHUNK),  skipDuplicates: true });
  for (let i = 0; i < resultsBatch.length;    i += CHUNK) await db.subjectResult.createMany({ data: resultsBatch.slice(i, i + CHUNK),    skipDuplicates: true });
  for (let i = 0; i < finalMarksBatch.length; i += CHUNK) await db.subjectFinalMark.createMany({ data: finalMarksBatch.slice(i, i + CHUNK), skipDuplicates: true });
  for (let i = 0; i < reportCardsBatch.length;i += CHUNK) await db.reportCard.createMany({ data: reportCardsBatch.slice(i, i + CHUNK), skipDuplicates: true });

  console.log(`   ✓  ${examMarksBatch.length} exam marks`);
  console.log(`   ✓  ${resultsBatch.length} subject results`);
  console.log(`   ✓  ${finalMarksBatch.length} final marks`);
  console.log(`   ✓  ${reportCardsBatch.length} report cards (published)`);
}

// ── ensureSubjects ────────────────────────────────────────────────────────

type SubjectInfo = { id: string; papers: { id: string }[] };

async function ensureSubjects(schoolId: string): Promise<Record<string, SubjectInfo>> {
  const result: Record<string, SubjectInfo> = {};
  for (const def of SUBJECTS) {
    let subject = await db.subject.findUnique({
      where:   { schoolId_code: { schoolId, code: def.code } },
      include: { papers: true },
    });
    if (!subject) {
      subject = await db.subject.create({
        data: { name: def.name, code: def.code, category: def.category, schoolId, isActive: true },
        include: { papers: true },
      });
    }
    for (const p of def.papers) {
      if (!subject.papers.find(sp => sp.paperNumber === p.paperNumber)) {
        await db.subjectPaper.create({
          data: { subjectId: subject.id, paperNumber: p.paperNumber, name: p.name, paperCode: p.paperCode, maxMarks: p.maxMarks, weight: p.weight, aoiCount: p.aoiCount, isActive: true },
        });
      }
    }
    const fresh = await db.subject.findUnique({ where: { id: subject.id }, include: { papers: true } });
    result[def.code] = { id: subject.id, papers: fresh!.papers };
  }
  return result;
}

// ── Run ───────────────────────────────────────────────────────────────────

main()
  .catch(e => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
