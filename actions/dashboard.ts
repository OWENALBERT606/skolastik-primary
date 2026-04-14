// // actions/dashboard-charts.ts
// "use server";

// import { DashboardChartsData } from "@/app/(school)/school/[slug]/components/dashboard-charts";
// import { db } from "@/prisma/db";

// export async function getDashboardChartsData(
//   schoolId: string
// ): Promise<DashboardChartsData> {
//   if (!schoolId) {
//     return {
//       enrolmentByClass:   [],
//       termEnrolmentTrend: [],
//       subjectPerformance: [],
//       genderBreakdown:    [],
//       attendanceTrend:    [],
//     };
//   }

//   // ── 1. Enrolment by class (active academic year) ──────────────────────────
//   // Schema: AcademicYear.isActive, ClassYear has no direct enrollments relation.
//   // Enrollments live on the Enrollment model with classYearId.
//   const classYears = await db.classYear.findMany({
//     where: {
//       isActive:    true,
//       academicYear: { schoolId, isActive: true },
//     },
//     select: {
//       id:            true,
//       classTemplate: { select: { name: true } },
//     },
//     orderBy: { classTemplate: { name: "asc" } },
//   });

//   // Fetch enrollment counts + gender breakdown per classYear in parallel
//   const enrolmentByClass = await Promise.all(
//     classYears.map(async (cy) => {
//       const [boys, girls] = await Promise.all([
//         db.enrollment.count({
//           where: { classYearId: cy.id, student: { gender: "MALE"   } },
//         }),
//         db.enrollment.count({
//           where: { classYearId: cy.id, student: { gender: "FEMALE" } },
//         }),
//       ]);
//       return {
//         className: cy.classTemplate.name,
//         students:  boys + girls,
//         boys,
//         girls,
//       };
//     })
//   );

//   // ── 2. Enrolment trend across all terms ───────────────────────────────────
//   // Model is AcademicTerm (not Term). It has enrollments relation via termId.
//   const allTerms = await db.academicTerm.findMany({
//     where: { academicYear: { schoolId } },
//     select: {
//       name:        true,
//       startDate:   true,
//       academicYear: { select: { year: true, startDate: true } },
//       _count:      { select: { enrollments: true } },
//     },
//     orderBy: [
//       { academicYear: { startDate: "asc" } },
//       { startDate: "asc" },
//     ],
//   });

//   const termEnrolmentTrend = allTerms.map((t) => ({
//     term:     `${t.name} ${t.academicYear.year}`,
//     students: t._count.enrollments,
//   }));

//   // ── 3. Subject performance (avg marks, active term) ───────────────────────
//   // Mark model: { marksObtained, maxMarks, examId, studentSubjectEnrollmentId }
//   // We join via Exam → termId. Use the active AcademicTerm.
//   const activeTerm = await db.academicTerm.findFirst({
//     where: { academicYear: { schoolId, isActive: true }, isActive: true },
//     select: { id: true },
//   });

//   let subjectPerformance: { subject: string; avgScore: number }[] = [];

//   if (activeTerm) {
//     // Get exams in this term, then aggregate marks per subject via StreamSubject
//     const exams = await db.exam.findMany({
//       where: { termId: activeTerm.id },
//       select: { id: true, classYearId: true },
//     });

//     if (exams.length > 0) {
//       const examIds = exams.map((e) => e.id);

//       // Mark has examId + studentSubjectEnrollmentId
//       // StudentSubjectEnrollment → streamSubject → subject
//       const rawMarks = await db.mark.findMany({
//         where: { examId: { in: examIds } },
//         select: {
//           marksObtained: true,
//           maxMarks:      true,
//           studentSubjectEnrollment: {
//             select: {
//               streamSubject: {
//                 select: { subject: { select: { id: true, name: true } } },
//               },
//             },
//           },
//         },
//       });

//       // Aggregate: group by subject, compute avg percentage
//       const subjectMap = new Map<string, { name: string; total: number; count: number }>();
//       for (const m of rawMarks) {
//         const subj = m.studentSubjectEnrollment?.streamSubject?.subject;
//         if (!subj) continue;
//         const pct = m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0;
//         const existing = subjectMap.get(subj.id);
//         if (existing) {
//           existing.total += pct;
//           existing.count += 1;
//         } else {
//           subjectMap.set(subj.id, { name: subj.name, total: pct, count: 1 });
//         }
//       }

//       subjectPerformance = Array.from(subjectMap.values())
//         .map((s) => ({ subject: s.name, avgScore: Math.round(s.total / s.count) }))
//         .sort((a, b) => b.avgScore - a.avgScore)
//         .slice(0, 8);
//     }
//   }

//   // ── 4. Gender breakdown ───────────────────────────────────────────────────
//   const [boys, girls] = await Promise.all([
//     db.student.count({ where: { schoolId, gender: "MALE",   isActive: true } }),
//     db.student.count({ where: { schoolId, gender: "FEMALE", isActive: true } }),
//   ]);

//   const genderBreakdown = [
//     { name: "Boys",  value: boys  },
//     { name: "Girls", value: girls },
//   ];

//   // ── 5. Attendance this week (Mon–Fri) ─────────────────────────────────────
//   // Schema: AttendanceRecord { staffId, schoolId, date, status: AttendanceStatus }
//   // AttendanceStatus enum: PRESENT | ABSENT | LATE | HALF_DAY | ON_LEAVE | ...
//   const today  = new Date();
//   const monday = new Date(today);
//   monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
//   monday.setHours(0, 0, 0, 0);

//   const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

//   const attendanceTrend = await Promise.all(
//     dayLabels.map(async (label, i) => {
//       const day  = new Date(monday);
//       day.setDate(monday.getDate() + i);
//       const next = new Date(day);
//       next.setDate(day.getDate() + 1);

//       const [total, present] = await Promise.all([
//         db.attendanceRecord.count({
//           where: { schoolId, date: { gte: day, lt: next } },
//         }),
//         db.attendanceRecord.count({
//           where: {
//             schoolId,
//             date:   { gte: day, lt: next },
//             status: { in: ["PRESENT", "LATE", "HALF_DAY"] },
//           },
//         }),
//       ]);

//       return { day: label, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
//     })
//   );

//   return {
//     enrolmentByClass,
//     termEnrolmentTrend,
//     subjectPerformance,
//     genderBreakdown,
//     attendanceTrend,
//   };
// }





// actions/dashboard-charts.ts
"use server";

import { DashboardChartsData } from "@/app/(school)/school/[slug]/components/dashboard-charts";
import { db } from "@/prisma/db";
// FIX [3]: Import AttendanceStatus enum for type-safe status filter.
import { AttendanceStatus } from "@prisma/client";

export async function getDashboardChartsData(
  schoolId: string
): Promise<DashboardChartsData> {
  if (!schoolId) {
    return {
      enrolmentByClass:   [],
      termEnrolmentTrend: [],
      subjectPerformance: [],
      genderBreakdown:    [],
      attendanceTrend:    [],
    };
  }

  // ── 1. Enrolment by class (active academic year) ──────────────────────────
  const classYears = await db.classYear.findMany({
    where: {
      isActive:     true,
      academicYear: { schoolId, isActive: true },
    },
    select: {
      id:            true,
      classTemplate: { select: { name: true } },
    },
    orderBy: { classTemplate: { name: "asc" } },
  });

  const enrolmentByClass = await Promise.all(
    classYears.map(async (cy) => {
      // NOTE: Student.gender is a plain String field (not an enum).
      // The values below must match exactly what your forms store.
      // Current assumption: "Male" / "Female" (title-case).
      // If your forms store "MALE" / "FEMALE" update these strings accordingly.
      const [boys, girls] = await Promise.all([
        db.enrollment.count({
          where: { classYearId: cy.id, student: { gender: "Male" } },
        }),
        db.enrollment.count({
          where: { classYearId: cy.id, student: { gender: "Female" } },
        }),
      ]);
      return {
        className: cy.classTemplate.name,
        students:  boys + girls,
        boys,
        girls,
      };
    })
  );

  // ── 2. Enrolment trend across all terms ───────────────────────────────────
  const allTerms = await db.academicTerm.findMany({
    where: { academicYear: { schoolId } },
    select: {
      name:         true,
      startDate:    true,
      academicYear: { select: { year: true, startDate: true } },
      _count:       { select: { enrollments: true } },
    },
    orderBy: [
      { academicYear: { startDate: "asc" } },
      { startDate:    "asc" },
    ],
  });

  const termEnrolmentTrend = allTerms.map((t) => ({
    term:     `${t.name} ${t.academicYear.year}`,
    students: t._count.enrollments,
  }));

  // ── 3. Subject performance (avg marks, active term) ───────────────────────
  const activeTerm = await db.academicTerm.findFirst({
    where: { academicYear: { schoolId, isActive: true }, isActive: true },
    select: { id: true },
  });

  let subjectPerformance: { subject: string; avgScore: number }[] = [];

  if (activeTerm) {
    const exams = await db.exam.findMany({
      where:  { termId: activeTerm.id },
      select: { id: true, classYearId: true },
    });

    if (exams.length > 0) {
      const examIds = exams.map((e) => e.id);

      const rawMarks = await db.mark.findMany({
        where: { examId: { in: examIds } },
        select: {
          marksObtained: true,
          maxMarks:      true,
          studentSubjectEnrollment: {
            select: {
              streamSubject: {
                select: { subject: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });

      const subjectMap = new Map<string, { name: string; total: number; count: number }>();
      for (const m of rawMarks) {
        const subj = m.studentSubjectEnrollment?.streamSubject?.subject;
        if (!subj) continue;
        const pct      = m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0;
        const existing = subjectMap.get(subj.id);
        if (existing) {
          existing.total += pct;
          existing.count += 1;
        } else {
          subjectMap.set(subj.id, { name: subj.name, total: pct, count: 1 });
        }
      }

      subjectPerformance = Array.from(subjectMap.values())
        .map((s) => ({ subject: s.name, avgScore: Math.round(s.total / s.count) }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 8);
    }
  }

  // ── 4. Gender breakdown ───────────────────────────────────────────────────
  // NOTE: Same as above — Student.gender is a plain String.
  const [boys, girls] = await Promise.all([
    db.student.count({ where: { schoolId, gender: "Male",   isActive: true } }),
    db.student.count({ where: { schoolId, gender: "Female", isActive: true } }),
  ]);

  const genderBreakdown = [
    { name: "Boys",  value: boys  },
    { name: "Girls", value: girls },
  ];

  // ── 5. Attendance this week (Mon–Fri) ─────────────────────────────────────
  const today  = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const attendanceTrend = await Promise.all(
    dayLabels.map(async (label, i) => {
      const day  = new Date(monday);
      day.setDate(monday.getDate() + i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);

      const [total, present] = await Promise.all([
        db.attendanceRecord.count({
          where: { schoolId, date: { gte: day, lt: next } },
        }),
        db.attendanceRecord.count({
          where: {
            schoolId,
            date:   { gte: day, lt: next },
            // FIX [3]: Use AttendanceStatus enum values instead of string literals.
            status: {
              in: [
                AttendanceStatus.PRESENT,
                AttendanceStatus.LATE,
                AttendanceStatus.HALF_DAY,
              ],
            },
          },
        }),
      ]);

      return { day: label, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
    })
  );

  return {
    enrolmentByClass,
    termEnrolmentTrend,
    subjectPerformance,
    genderBreakdown,
    attendanceTrend,
  };
}