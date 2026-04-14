// app/school/[slug]/finance/fees/payments/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions }      from "@/config/auth";
import { redirect }         from "next/navigation";
import { db }               from "@/prisma/db";
import { Session }          from "next-auth";
import PaymentsClient from "./components/paymentClient";

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session  = (await getServerSession(authOptions)) as Session | null;
  const schoolId = session?.user?.school?.id;
  const userId   = session?.user?.id;
  if (!schoolId || !userId) redirect("/login");

  // ── School info (for receipt PDF) ─────────────────────────────────────────
  const schoolRecord = await db.school.findUnique({
    where:  { id: schoolId },
    select: { name: true, address: true, contact: true, email: true, logo: true, primaryColor: true, accentColor: true },
  });
  const school = {
    name:         schoolRecord?.name         ?? "School",
    address:      schoolRecord?.address      ?? undefined,
    contact:      schoolRecord?.contact      ?? undefined,
    email:        schoolRecord?.email        ?? undefined,
    logo:         schoolRecord?.logo         ?? undefined,
    primaryColor: schoolRecord?.primaryColor ?? undefined,
    accentColor:  schoolRecord?.accentColor  ?? undefined,
  };

  // ── Active term ────────────────────────────────────────────────────────────
  const activeYear = await db.academicYear.findFirst({
    where:   { schoolId, isActive: true },
    include: { terms: { where: { isActive: true }, take: 1 } },
  });
  const activeTermId = activeYear?.terms[0]?.id ?? null;

  // ── Students with outstanding balances ────────────────────────────────────
  // Used to populate the "Record Payment" dialog selector
  const accounts = await db.studentFeeAccount.findMany({
    where: {
      schoolId,
      balance: { gt: 0 },
      ...(activeTermId ? { termId: activeTermId } : {}),
    },
    orderBy: { balance: "desc" },
    include: {
      student: {
        select: {
          id:          true,
          firstName:   true,
          lastName:    true,
          admissionNo: true,
          enrollments: {
            where:   { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take:    1,
            select: {
              classYear: { select: { classTemplate: { select: { name: true } } } },
              stream:    { select: { name: true } },
            },
          },
        },
      },
      // Latest outstanding invoice for pre-fill
      invoices: {
        where:   { status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } },
        orderBy: { issueDate: "desc" },
        take:    1,
        select:  { id: true, invoiceNumber: true, balance: true },
      },
    },
  });

  const studentsForUI = accounts.map((a) => {
    const enr        = a.student.enrollments[0];
    const className  = enr?.classYear.classTemplate.name ?? "";
    const streamName = enr?.stream?.name ?? "";
    return {
      accountId:   a.id,
      studentId:   a.student.id,
      studentName: `${a.student.firstName} ${a.student.lastName}`,
      admissionNo: a.student.admissionNo,
      class:       streamName ? `${className} ${streamName}` : className,
      balance:     a.balance,
      invoiceId:   a.invoices[0]?.id            ?? null,
      invoiceNo:   a.invoices[0]?.invoiceNumber  ?? "No active invoice",
    };
  });

  // ── Recent payment transactions (last 200) ────────────────────────────────
  const transactions = await db.feeTransaction.findMany({
    where: {
      transactionType:   "PAYMENT",
      studentFeeAccount: { schoolId },
    },
    orderBy: { processedAt: "desc" },
    take:    200,
    include: {
      studentFeeAccount: {
        select: {
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
        },
      },
      receipt: { select: { receiptNumber: true } },
    },
  });

  const txForUI = transactions.map((t) => ({
    id:                  t.id,
    studentFeeAccountId: t.studentFeeAccountId,
    studentName:         `${t.studentFeeAccount.student.firstName} ${t.studentFeeAccount.student.lastName}`,
    admissionNo:         t.studentFeeAccount.student.admissionNo,
    amount:              t.amount,
    paymentMethod:       (t.paymentMethod ?? "CASH") as string,
    referenceNumber:     t.referenceNumber     ?? null,
    mobileMoneyPhone:    t.mobileMoneyPhone    ?? null,
    mobileMoneyNetwork:  t.mobileMoneyNetwork  ?? null,
    processedAt:         t.processedAt.toISOString(),
    receiptNumber:       t.receipt?.receiptNumber ?? null,
    isReversal:          t.isReversal,
    reversedAt:          t.reversedAt?.toISOString() ?? null,
    description:         t.description ?? null,
  }));

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <PaymentsClient
        students={studentsForUI}
        transactions={txForUI}
        slug={slug}
        userId={userId}
        school={school}
      />
    </div>
  );
}