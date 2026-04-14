// Bursar fees overview — same data as admin but routes to /bursar/fees/...
import { getServerSession } from "next-auth/next";
import { authOptions }       from "@/config/auth";
import { redirect }          from "next/navigation";
import { db }                from "@/prisma/db";
import { Session }           from "next-auth";
import FeesOverviewClient from "@/app/(school)/school/[slug]/finance/fees/components/FeesOverviewClient";

export default async function BursarFeesOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session  = (await getServerSession(authOptions)) as Session | null;
  const schoolId = session?.user?.school?.id;
  const userId   = session?.user?.id;
  if (!schoolId || !userId) redirect("/login");

  const activeYear = await db.academicYear.findFirst({
    where:   { schoolId, isActive: true },
    include: {
      terms: {
        where:   { isActive: true },
        take:    1,
        select:  { id: true, name: true, termNumber: true },
      },
    },
  });
  const activeTerm   = activeYear?.terms[0]   ?? null;
  const activeTermId = activeTerm?.id          ?? null;

  const allTerms = await db.academicTerm.findMany({
    where:   { academicYear: { schoolId } },
    orderBy: [{ academicYear: { year: "desc" } }, { termNumber: "asc" }],
    select:  { id: true, name: true, termNumber: true, academicYear: { select: { year: true } } },
    take:    12,
  });

  const [invoiceAgg, paymentAgg, bursaryAgg, overdueCount, arrearsCount] =
    await Promise.all([
      db.feeTransaction.aggregate({
        where:  { transactionType: "INVOICE", studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) }, isReversal: false },
        _sum:   { amount: true },
        _count: { id: true },
      }),
      db.feeTransaction.aggregate({
        where:  { transactionType: "PAYMENT", studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) }, isReversal: false },
        _sum:   { amount: true },
        _count: { id: true },
      }),
      db.feeTransaction.aggregate({
        where:  { transactionType: { in: ["DISCOUNT", "WAIVER"] }, studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) }, isReversal: false },
        _sum:   { amount: true },
        _count: { id: true },
      }),
      db.invoice.count({
        where: { status: "OVERDUE", studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) } },
      }),
      db.studentFeeAccount.count({
        where: { schoolId, balance: { gt: 0 }, ...(activeTermId ? { termId: activeTermId } : {}) },
      }),
    ]);

  const totalInvoiced  = invoiceAgg._sum.amount  ?? 0;
  const totalCollected = paymentAgg._sum.amount  ?? 0;
  const totalBursaries = bursaryAgg._sum.amount  ?? 0;
  const outstanding    = totalInvoiced - totalCollected - totalBursaries;
  const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

  const recentPayments = await db.feeTransaction.findMany({
    where: { transactionType: "PAYMENT", isReversal: false, studentFeeAccount: { schoolId } },
    orderBy: { processedAt: "desc" },
    take:    10,
    select: {
      id: true, amount: true, paymentMethod: true, mobileMoneyNetwork: true, processedAt: true,
      receipt: { select: { receiptNumber: true } },
      studentFeeAccount: { select: { student: { select: { firstName: true, lastName: true } } } },
    },
  });

  const overdueInvoices = await db.invoice.findMany({
    where: { status: "OVERDUE", studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) } },
    orderBy: { balance: "desc" },
    take:    5,
    select: {
      id: true, invoiceNumber: true, balance: true, dueDate: true,
      studentFeeAccount: { select: { student: { select: { firstName: true, lastName: true } } } },
    },
  });

  const methodBreakdown = await db.feeTransaction.groupBy({
    by:    ["paymentMethod"],
    where: { transactionType: "PAYMENT", isReversal: false, studentFeeAccount: { schoolId, ...(activeTermId ? { termId: activeTermId } : {}) } },
    _sum:   { amount: true },
    _count: { id: true },
  });

  const stats = {
    totalInvoiced, totalCollected,
    outstanding:    Math.max(outstanding, 0),
    totalBursaries, collectionRate, arrearsCount, overdueCount,
    paymentCount:   paymentAgg._count.id,
    bursaryCount:   bursaryAgg._count.id,
  };

  return (
    <FeesOverviewClient
      slug={slug}
      basePath="bursar"
      stats={stats}
      recentPayments={recentPayments.map((t) => ({
        id:            t.id,
        studentName:   `${t.studentFeeAccount.student.firstName} ${t.studentFeeAccount.student.lastName}`,
        amount:        t.amount,
        paymentMethod: t.paymentMethod ?? "CASH",
        network:       t.mobileMoneyNetwork ?? null,
        processedAt:   t.processedAt.toISOString(),
        receiptNo:     t.receipt?.receiptNumber ?? null,
      }))}
      overdueInvoices={overdueInvoices.map((inv) => ({
        id:            inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentName:   `${inv.studentFeeAccount.student.firstName} ${inv.studentFeeAccount.student.lastName}`,
        balance:       inv.balance,
        dueDate:       inv.dueDate?.toISOString() ?? null,
      }))}
      methodBreakdown={methodBreakdown.filter((m) => m.paymentMethod).map((m) => ({
        method: m.paymentMethod as string,
        amount: m._sum.amount ?? 0,
        count:  m._count.id,
      })).sort((a, b) => b.amount - a.amount)}
      terms={allTerms.map((t) => ({ id: t.id, label: `${t.academicYear.year} · ${t.name}` }))}
      activeTermId={activeTermId}
      activeTermLabel={activeTerm ? `${activeYear?.year} · ${activeTerm.name}` : "No active term"}
    />
  );
}
