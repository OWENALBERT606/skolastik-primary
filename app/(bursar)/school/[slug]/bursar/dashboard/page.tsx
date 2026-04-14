// app/(bursar)/school/[slug]/bursar/dashboard/page.tsx
import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { buildCapabilities }    from "@/lib/utils/capabilities";
import { db }                   from "@/prisma/db";
import BursarDashboardClient    from "./components/bursar-dashboard-client";

export default async function BursarDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const caps = await buildCapabilities(userData.id);
  if (!caps.school || caps.school.slug !== slug) redirect("/login");

  const schoolId = caps.school.id;

  // ── School info ────────────────────────────────────────────────────────────
  const school = await db.school.findUnique({
    where:  { id: schoolId },
    select: { name: true },
  });
  if (!school) redirect("/login");

  // ── Active academic year + term ─────────────────────────────────────────
  const activeYear = await db.academicYear.findFirst({
    where:  { schoolId, isActive: true },
    select: { id: true, year: true },
  });
  const activeTerm = activeYear
    ? await db.academicTerm.findFirst({
        where:  { academicYearId: activeYear.id, isActive: true },
        select: { id: true, name: true, termNumber: true },
      })
    : null;
  const activeTermId = activeTerm?.id ?? null;

  // ── Term stats ─────────────────────────────────────────────────────────────
  const [invoiceAgg, paymentAgg, bursaryAgg, overdueCount, arrearsCount] =
    await Promise.all([
      db.feeTransaction.aggregate({
        where:  { transactionType: "INVOICE", isReversal: false, studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) } },
        _sum:   { amount: true },
        _count: { id: true },
      }),
      db.feeTransaction.aggregate({
        where:  { transactionType: "PAYMENT", isReversal: false, studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) } },
        _sum:   { amount: true },
        _count: { id: true },
      }),
      db.feeTransaction.aggregate({
        where:  { transactionType: { in: ["DISCOUNT", "WAIVER"] }, isReversal: false, studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) } },
        _sum:   { amount: true },
      }),
      db.invoice.count({
        where: { status: "OVERDUE", studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) } },
      }),
      db.studentFeeAccount.count({
        where: { schoolId, balance: { gt: 0 }, ...(activeTermId ? { termId: activeTermId } : {}) },
      }),
    ]);

  const totalBilled    = invoiceAgg._sum.amount  ?? 0;
  const totalCollected = paymentAgg._sum.amount  ?? 0;
  const totalBursaries = bursaryAgg._sum.amount  ?? 0;
  const outstanding    = Math.max(totalBilled - totalCollected - totalBursaries, 0);
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  // ── Today's collected ──────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAgg = await db.feeTransaction.aggregate({
    where:  { transactionType: "PAYMENT", isReversal: false, processedAt: { gte: today }, studentFeeAccount: { schoolId } },
    _sum:   { amount: true },
  });
  const todayCollected = todayAgg._sum.amount ?? 0;

  // ── Daily collections (last 30 days) ──────────────────────────────────────
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const rawPayments = await db.feeTransaction.findMany({
    where:  { transactionType: "PAYMENT", isReversal: false, processedAt: { gte: thirtyDaysAgo }, studentFeeAccount: { schoolId } },
    select: { amount: true, processedAt: true },
  });

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    dailyMap.set(d.toISOString().split("T")[0], 0);
  }
  rawPayments.forEach((p) => {
    const k = p.processedAt.toISOString().split("T")[0];
    dailyMap.set(k, (dailyMap.get(k) ?? 0) + p.amount);
  });
  const dailyCollections = Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount }));

  // ── Payment method breakdown ───────────────────────────────────────────────
  const methodBreakdown = await db.feeTransaction.groupBy({
    by:    ["paymentMethod"],
    where: {
      transactionType: "PAYMENT",
      isReversal:      false,
      studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) },
    },
    _sum:   { amount: true },
    _count: { id: true },
  });

  // ── Per-class breakdown ────────────────────────────────────────────────────
  const feeAccounts = await db.studentFeeAccount.findMany({
    where: {
      schoolId,
      ...(activeTermId  ? { termId:         activeTermId }  : {}),
      ...(activeYear?.id ? { academicYearId: activeYear.id } : {}),
    },
    select: {
      totalInvoiced: true,
      totalPaid:     true,
      balance:       true,
      student: {
        select: {
          enrollments: {
            where:  { status: "ACTIVE", ...(activeYear?.id ? { academicYearId: activeYear.id } : {}) },
            take:   1,
            select: { classYear: { select: { classTemplate: { select: { name: true } } } } },
          },
        },
      },
    },
  });

  const classMap = new Map<string, { billed: number; paid: number; outstanding: number }>();
  for (const fa of feeAccounts) {
    const cn = fa.student.enrollments[0]?.classYear.classTemplate.name ?? "Unassigned";
    const c  = classMap.get(cn) ?? { billed: 0, paid: 0, outstanding: 0 };
    classMap.set(cn, {
      billed:      c.billed      + fa.totalInvoiced,
      paid:        c.paid        + fa.totalPaid,
      outstanding: c.outstanding + Math.max(fa.balance, 0),
    });
  }
  const classBreakdown = Array.from(classMap.entries())
    .map(([className, d]) => ({ className, ...d }))
    .sort((a, b) => b.billed - a.billed)
    .slice(0, 10);

  // ── Recent payments (last 15) ──────────────────────────────────────────────
  const recentPaymentsRaw = await db.feeTransaction.findMany({
    where:   { transactionType: "PAYMENT", isReversal: false, studentFeeAccount: { schoolId } },
    orderBy: { processedAt: "desc" },
    take:    15,
    select: {
      id:                 true,
      amount:             true,
      paymentMethod:      true,
      mobileMoneyNetwork: true,
      processedAt:        true,
      receipt:            { select: { receiptNumber: true } },
      studentFeeAccount: {
        select: {
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
        },
      },
    },
  });

  // ── Top debtors ────────────────────────────────────────────────────────────
  const topDebtorsRaw = await db.studentFeeAccount.findMany({
    where:   { schoolId, balance: { gt: 0 }, ...(activeTermId ? { termId: activeTermId } : {}) },
    orderBy: { balance: "desc" },
    take:    10,
    select: {
      id:            true,
      balance:       true,
      totalInvoiced: true,
      student: {
        select: {
          firstName:   true,
          lastName:    true,
          admissionNo: true,
          enrollments: {
            where:  { status: "ACTIVE", ...(activeYear?.id ? { academicYearId: activeYear.id } : {}) },
            take:   1,
            select: { classYear: { select: { classTemplate: { select: { name: true } } } } },
          },
        },
      },
    },
  });

  // ── Shape data ─────────────────────────────────────────────────────────────
  const recentPayments = recentPaymentsRaw.map((t) => ({
    id:          t.id,
    studentName: `${t.studentFeeAccount.student.firstName} ${t.studentFeeAccount.student.lastName}`,
    admNo:       t.studentFeeAccount.student.admissionNo,
    amount:      t.amount,
    method:      t.paymentMethod ?? "CASH",
    processedAt: t.processedAt.toISOString(),
    receiptNo:   t.receipt?.receiptNumber ?? null,
  }));

  const topDebtors = topDebtorsRaw.map((a) => ({
    id:          a.id,
    studentName: `${a.student.firstName} ${a.student.lastName}`,
    admNo:       a.student.admissionNo,
    className:   a.student.enrollments[0]?.classYear.classTemplate.name ?? "—",
    balance:     a.balance,
  }));

  const paymentMethods = methodBreakdown
    .filter((m) => m.paymentMethod)
    .map((m) => ({
      method: m.paymentMethod as string,
      amount: m._sum.amount ?? 0,
      count:  m._count.id,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <BursarDashboardClient
      slug={slug}
      school={{ name: school.name }}
      schoolId={schoolId}
      userId={userData.id}
      activeYear={activeYear ? { id: activeYear.id, year: activeYear.year } : null}
      activeTerm={activeTerm ? { id: activeTerm.id, name: activeTerm.name, termNumber: activeTerm.termNumber } : null}
      stats={{
        todayCollected,
        totalBilled,
        totalCollected,
        outstanding,
        collectionRate,
        arrearsCount,
        overdueCount,
        paymentCount: paymentAgg._count.id,
      }}
      dailyCollections={dailyCollections}
      classBreakdown={classBreakdown}
      paymentMethods={paymentMethods}
      recentPayments={recentPayments}
      topDebtors={topDebtors}
    />
  );
}
