import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect }             from "next/navigation";
import { db }                   from "@/prisma/db";
import SuperAdminDashboard      from "@/components/dashboard/super-admin-dashboard";

export default async function Dashboard() {
  const user = await getAuthenticatedUser();
  if (!user?.id) redirect("/login");

  // ── System-wide stats ──────────────────────────────────────────────────────
  const [
    totalSchools,
    activeSchools,
    totalStudents,
    totalTeachers,
    totalParents,
    totalReportCards,
    activeTerms,
    activeYears,
    allSchools,
  ] = await Promise.all([
    db.school.count(),
    db.school.count({ where: { isActive: true } }),
    db.student.count({ where: { isActive: true } }),
    db.teacher.count({ where: { status: "ACTIVE" } }),
    db.parent.count(),
    db.reportCard.count(),
    db.academicTerm.count({ where: { isActive: true } }),
    db.academicYear.count({ where: { isActive: true } }),

    // All schools with full per-school stats
    db.school.findMany({
      orderBy: { name: "asc" },
      select: {
        id:       true,
        name:     true,
        slug:     true,
        logo:     true,
        isActive: true,
        address:  true,
        _count: {
          select: {
            students: true,
            teachers: true,
            parents:  true,
          },
        },
        academicYears: {
          where:   { isActive: true },
          take:    1,
          select: {
            id:   true,
            year: true,
            terms: {
              where:  { isActive: true },
              take:   1,
              select: { id: true, name: true, termNumber: true },
            },
          },
        },
      },
    }),
  ]);

  // ── Per-school enriched stats (fees + report cards) ────────────────────────
  const perSchoolStats = await Promise.all(
    allSchools.map(async (school) => {
      const activeYear = school.academicYears[0];
      const activeTerm = activeYear?.terms[0];
      const termFilter = activeTerm ? { termId: activeTerm.id } : {};

      const [
        reportCardCount,
        publishedReportCards,
        invoiceAgg,
        paymentAgg,
        arrearsCount,
        streamCount,
      ] = await Promise.all([
        db.reportCard.count({
          where: { enrollment: { student: { schoolId: school.id } } },
        }),
        db.reportCard.count({
          where: { isPublished: true, enrollment: { student: { schoolId: school.id } } },
        }),
        db.feeTransaction.aggregate({
          where: { transactionType: "INVOICE", isReversal: false, studentFeeAccount: { schoolId: school.id, ...termFilter } },
          _sum:  { amount: true },
        }),
        db.feeTransaction.aggregate({
          where: { transactionType: "PAYMENT", isReversal: false, studentFeeAccount: { schoolId: school.id, ...termFilter } },
          _sum:  { amount: true },
        }),
        db.studentFeeAccount.count({
          where: { schoolId: school.id, balance: { gt: 0 }, ...termFilter },
        }),
        db.stream.count({ where: { schoolId: school.id } }),
      ]);

      const totalInvoiced  = invoiceAgg._sum.amount  ?? 0;
      const totalCollected = paymentAgg._sum.amount  ?? 0;
      const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

      return {
        id:              school.id,
        name:            school.name,
        slug:            school.slug,
        logo:            school.logo,
        isActive:        school.isActive,
        address:         school.address,
        students:        school._count.students,
        teachers:        school._count.teachers,
        parents:         school._count.parents,
        streams:         streamCount,
        activeYear:      activeYear?.year ?? null,
        activeTerm:      activeTerm?.name ?? null,
        reportCards:     reportCardCount,
        publishedCards:  publishedReportCards,
        totalInvoiced,
        totalCollected,
        collectionRate,
        arrearsCount,
      };
    })
  );

  const inactiveSchools = totalSchools - activeSchools;
  const maxStudents     = Math.max(...perSchoolStats.map(s => s.students), 1);

  return (
    <main>
      <SuperAdminDashboard
        stats={{
          totalSchools,
          activeSchools,
          inactiveSchools,
          totalStudents,
          totalTeachers,
          totalParents,
          totalReportCards,
          activeTerms,
          activeYears,
        }}
        perSchoolStats={perSchoolStats}
        maxStudents={maxStudents}
        adminName={user.name ?? "Super Admin"}
      />
    </main>
  );
}
