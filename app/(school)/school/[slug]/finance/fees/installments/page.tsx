// app/school/[slug]/finance/fees/installments/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions }       from "@/config/auth";
import { redirect }          from "next/navigation";
import { db }                from "@/prisma/db";
import { Session }           from "next-auth";
import InstallmentsClient from "./InstallmentsClient";

export default async function InstallmentsPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session  = (await getServerSession(authOptions)) as Session | null;
  const schoolId = session?.user?.school?.id;
  const userId   = session?.user?.id;
  if (!schoolId || !userId) redirect("/login");

  // ── Active term ────────────────────────────────────────────────────────────
  const activeYear = await db.academicYear.findFirst({
    where:   { schoolId, isActive: true },
    include: { terms: { where: { isActive: true }, take: 1 } },
  });
  const activeTermId = activeYear?.terms[0]?.id ?? null;
  const termFilter   = activeTermId ? { termId: activeTermId } : {};

  // ── All installment plans for this term ────────────────────────────────────
  const plans = await db.installmentPlan.findMany({
    where:   { studentFeeAccount: { schoolId, ...termFilter } },
    orderBy: { createdAt: "desc" },
    include: {
      installments: { orderBy: { installmentNumber: "asc" } },
      studentFeeAccount: {
        select: {
          id:      true,
          balance: true,
          student: {
            select: {
              id:          true,
              firstName:   true,
              lastName:    true,
              admissionNo: true,
              enrollments: {
                where:   { status: "ACTIVE" },
                take:    1,
                select: {
                  classYear: { select: { classTemplate: { select: { name: true } } } },
                  stream:    { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // ── Students with outstanding balances (for new plan dialog) ──────────────
  const accounts = await db.studentFeeAccount.findMany({
    where:   { schoolId, balance: { gt: 0 }, ...termFilter },
    orderBy: { balance: "desc" },
    select: {
      id:      true,
      balance: true,
      student: {
        select: {
          id:          true,
          firstName:   true,
          lastName:    true,
          admissionNo: true,
        },
      },
    },
  });

  // ── Shape for client ───────────────────────────────────────────────────────
  const plansForUI = plans.map((p) => {
    const enr = p.studentFeeAccount.student.enrollments[0];
    const cls = enr
      ? `${enr.classYear.classTemplate.name}${enr.stream ? ` ${enr.stream.name}` : ""}`
      : "";
    const paidAmount = p.installments
      .filter((i) => i.isPaid)
      .reduce((s, i) => s + i.amount, 0);

    return {
      id:          p.id,
      name:        p.name,
      isActive:    p.isActive,
      totalAmount: p.totalAmount,
      paidAmount,
      accountId:   p.studentFeeAccount.id,
      studentId:   p.studentFeeAccount.student.id,
      studentName: `${p.studentFeeAccount.student.firstName} ${p.studentFeeAccount.student.lastName}`,
      admissionNo: p.studentFeeAccount.student.admissionNo,
      class:       cls,
      createdAt:   p.createdAt.toISOString(),
      installments: p.installments.map((i) => ({
        id:                i.id,
        installmentNumber: i.installmentNumber,
        amount:            i.amount,
        dueDate:           i.dueDate.toISOString(),
        isPaid:            i.isPaid,
        paidAt:            i.paidAt?.toISOString() ?? null,
        transactionId:     i.transactionId ?? null,
      })),
    };
  });

  const studentsForUI = accounts.map((a) => ({
    accountId:   a.id,
    studentId:   a.student.id,
    studentName: `${a.student.firstName} ${a.student.lastName}`,
    admissionNo: a.student.admissionNo,
    balance:     a.balance,
  }));

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <InstallmentsClient
        plans={studentsForUI.length === 0 && plansForUI.length === 0
          ? []
          : plansForUI}
        students={studentsForUI}
        slug={slug}
        userId={userId}
      />
    </div>
  );
}