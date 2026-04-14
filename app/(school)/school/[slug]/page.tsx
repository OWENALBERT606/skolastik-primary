// app/(school)/school/[slug]/page.tsx
import { redirect }             from "next/navigation";
import { db }                   from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import SchoolDashboardClient    from "./components/school-dashboard-client";

export default async function SchoolDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  // ── Resolve school ────────────────────────────────────────────────────────
  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, name: true, slug: true, logo: true, motto: true, address: true, email: true, contact: true },
  });
  if (!school) redirect("/login");

  const schoolId = school.id;

  // ── Active year + term ────────────────────────────────────────────────────
  const activeYear = await db.academicYear.findFirst({
    where:   { schoolId, isActive: true },
    include: { terms: { orderBy: { termNumber: "asc" } } },
  });
  const activeTerm = activeYear?.terms.find(t => t.isActive) ?? activeYear?.terms[0] ?? null;

  // ── KPI counts (all parallel) ─────────────────────────────────────────────
  const [
    totalStudents,
    activeStudents,
    totalTeachers,
    activeTeachers,
    totalParents,
    totalStaff,
    totalSubjects,
    totalStreams,
    activeStreams,
    classYearCount,
    boysCount,
    girlsCount,
    reportCardCount,
    publishedReportCards,
  ] = await Promise.all([
    db.student.count({ where: { schoolId } }),
    db.student.count({ where: { schoolId, isActive: true } }),
    db.teacher.count({ where: { schoolId } }),
    db.teacher.count({ where: { schoolId, status: "ACTIVE" } }),
    db.parent.count({ where: { schoolId } }),
    db.staff.count({ where: { schoolId } }),
    db.subject.count({ where: { schoolId } }),
    db.stream.count({ where: { schoolId } }),
    activeYear
      ? db.stream.count({ where: { schoolId, classYear: { academicYearId: activeYear.id } } })
      : Promise.resolve(0),
    activeYear
      ? db.classYear.count({ where: { academicYearId: activeYear.id } })
      : Promise.resolve(0),
    db.student.count({ where: { schoolId, isActive: true, gender: { in: ["Male", "MALE", "male"] } } }),
    db.student.count({ where: { schoolId, isActive: true, gender: { in: ["Female", "FEMALE", "female"] } } }),
    activeTerm
      ? db.reportCard.count({ where: { enrollment: { academicYearId: activeYear!.id, termId: activeTerm.id } } })
      : Promise.resolve(0),
    activeTerm
      ? db.reportCard.count({ where: { isPublished: true, enrollment: { academicYearId: activeYear!.id, termId: activeTerm.id } } })
      : Promise.resolve(0),
  ]);

  // ── Enrolment by class (active year) ─────────────────────────────────────
  const enrolmentByClass: { className: string; boys: number; girls: number; students: number }[] = [];
  if (activeYear) {
    const classYears = await db.classYear.findMany({
      where:   { academicYearId: activeYear.id },
      select:  { id: true, classTemplate: { select: { name: true } } },
      orderBy: { classTemplate: { level: "asc" } },
    });
    for (const cy of classYears) {
      const [boys, girls] = await Promise.all([
        db.enrollment.count({ where: { classYearId: cy.id, termId: activeTerm?.id, student: { gender: { in: ["Male","MALE","male"] } } } }),
        db.enrollment.count({ where: { classYearId: cy.id, termId: activeTerm?.id, student: { gender: { in: ["Female","FEMALE","female"] } } } }),
      ]);
      if (boys + girls > 0) {
        enrolmentByClass.push({ className: cy.classTemplate.name, boys, girls, students: boys + girls });
      }
    }
  }

  // ── Enrolment trend (all terms across all years) ──────────────────────────
  const allTerms = await db.academicTerm.findMany({
    where:   { academicYear: { schoolId } },
    select:  { id: true, name: true, startDate: true, academicYear: { select: { year: true, startDate: true } }, _count: { select: { enrollments: true } } },
    orderBy: [{ academicYear: { startDate: "asc" } }, { startDate: "asc" }],
  });
  const termEnrolmentTrend = allTerms.map(t => ({
    term:     `${t.name} ${t.academicYear.year}`,
    students: t._count.enrollments,
  }));

  // ── Subject performance (active term, using SubjectFinalMark) ─────────────
  let subjectPerformance: { subject: string; avgScore: number }[] = [];
  if (activeTerm) {
    const finalMarks = await db.subjectFinalMark.findMany({
      where: {
        studentSubjectEnrollment: {
          enrollment: { termId: activeTerm.id, academicYearId: activeYear!.id },
        },
        totalPercentage: { not: null },
      },
      select: {
        totalPercentage: true,
        studentSubjectEnrollment: {
          select: { streamSubject: { select: { subject: { select: { id: true, name: true } } } } },
        },
      },
    });
    const subjectMap = new Map<string, { name: string; total: number; count: number }>();
    for (const fm of finalMarks) {
      const subj = fm.studentSubjectEnrollment?.streamSubject?.subject;
      if (!subj || fm.totalPercentage == null) continue;
      const existing = subjectMap.get(subj.id);
      if (existing) { existing.total += fm.totalPercentage; existing.count++; }
      else subjectMap.set(subj.id, { name: subj.name, total: fm.totalPercentage, count: 1 });
    }
    subjectPerformance = Array.from(subjectMap.values())
      .map(s => ({ subject: s.name, avgScore: Math.round(s.total / s.count) }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 8);
  }

  // ── Recent enrollments ────────────────────────────────────────────────────
  const recentEnrollments = activeTerm
    ? await db.enrollment.findMany({
        where:   { academicYearId: activeYear!.id, termId: activeTerm.id },
        select:  { id: true, student: { select: { firstName: true, lastName: true, admissionNo: true } }, classYear: { select: { classTemplate: { select: { name: true } } } }, stream: { select: { name: true } }, createdAt: true },
        orderBy: { createdAt: "desc" },
        take:    8,
      })
    : [];

  // ── Fee summary (active term) ─────────────────────────────────────────────
  let feeStats = { totalBilled: 0, totalPaid: 0, outstanding: 0 };
  if (activeTerm) {
    const accounts = await db.studentFeeAccount.findMany({
      where:  { termId: activeTerm.id, schoolId },
      select: { totalInvoiced: true, totalPaid: true, balance: true },
    });
    feeStats = accounts.reduce((acc, a) => ({
      totalBilled:  acc.totalBilled  + (a.totalInvoiced ?? 0),
      totalPaid:    acc.totalPaid    + (a.totalPaid     ?? 0),
      outstanding:  acc.outstanding  + (a.balance       ?? 0),
    }), { totalBilled: 0, totalPaid: 0, outstanding: 0 });
  }

  return (
    <SchoolDashboardClient
      school={school}
      activeYear={activeYear ? { id: activeYear.id, year: activeYear.year } : null}
      activeTerm={activeTerm ? { id: activeTerm.id, name: activeTerm.name, termNumber: activeTerm.termNumber } : null}
      stats={{
        totalStudents, activeStudents,
        totalTeachers, activeTeachers,
        totalParents, totalStaff,
        totalSubjects, totalStreams, activeStreams,
        classYearCount, boysCount, girlsCount,
        reportCardCount, publishedReportCards,
      }}
      feeStats={feeStats}
      enrolmentByClass={enrolmentByClass}
      termEnrolmentTrend={termEnrolmentTrend}
      subjectPerformance={subjectPerformance}
      recentEnrollments={recentEnrollments.map(e => ({
        id:        e.id,
        name:      `${e.student.firstName} ${e.student.lastName}`,
        admNo:     e.student.admissionNo ?? "",
        className: `${e.classYear.classTemplate.name} ${e.stream?.name ?? ""}`.trim(),
        createdAt: e.createdAt.toISOString(),
      }))}
      slug={slug}
    />
  );
}
