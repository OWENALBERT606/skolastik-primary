// app/api/fees-report/route.ts
import { db }          from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const termId   = searchParams.get("termId"); // "all" or a real termId

  if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });

  const termFilter = termId && termId !== "all" ? { termId } : {};

  try {
    // ── Aggregates ─────────────────────────────────────────────────────────
    const [invoiceAgg, paymentAgg, discountAgg, penaltyAgg, arrearsCount] =
      await Promise.all([
        db.feeTransaction.aggregate({
          where: { transactionType: "INVOICE",  isReversal: false, studentFeeAccount: { schoolId, ...termFilter } },
          _sum:  { amount: true },
        }),
        db.feeTransaction.aggregate({
          where: { transactionType: "PAYMENT",  isReversal: false, studentFeeAccount: { schoolId, ...termFilter } },
          _sum:  { amount: true },
        }),
        db.feeTransaction.aggregate({
          where: { transactionType: { in: ["DISCOUNT","WAIVER"] }, isReversal: false, studentFeeAccount: { schoolId, ...termFilter } },
          _sum:  { amount: true },
        }),
        db.feeTransaction.aggregate({
          where: { transactionType: "PENALTY",  isReversal: false, studentFeeAccount: { schoolId, ...termFilter } },
          _sum:  { amount: true },
        }),
        db.studentFeeAccount.count({
          where: { schoolId, balance: { gt: 0 }, ...termFilter },
        }),
      ]);

    const totalInvoiced  = invoiceAgg._sum.amount  ?? 0;
    const totalCollected = paymentAgg._sum.amount  ?? 0;
    const totalBursaries = discountAgg._sum.amount ?? 0;
    const totalPenalties = penaltyAgg._sum.amount  ?? 0;
    const outstanding    = Math.max(totalInvoiced - totalCollected - totalBursaries, 0);
    const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

    // ── Collection by class ─────────────────────────────────────────────────
    const classYears = await db.classYear.findMany({
      where:   { academicYear: { schoolId, isActive: true } },
      select:  { id: true, classTemplate: { select: { name: true } } },
      orderBy: { classTemplate: { level: "asc" } },
    });

    const classBars = await Promise.all(
      classYears.map(async (cy) => {
        const [inv, pay] = await Promise.all([
          db.feeTransaction.aggregate({
            where: { transactionType: "INVOICE", isReversal: false,
                     studentFeeAccount: { schoolId, ...termFilter,
                       student: { enrollments: { some: { classYearId: cy.id } } } } },
            _sum:  { amount: true },
          }),
          db.feeTransaction.aggregate({
            where: { transactionType: "PAYMENT", isReversal: false,
                     studentFeeAccount: { schoolId, ...termFilter,
                       student: { enrollments: { some: { classYearId: cy.id } } } } },
            _sum:  { amount: true },
          }),
        ]);
        const invoiced  = inv._sum.amount ?? 0;
        const collected = pay._sum.amount ?? 0;
        const rate      = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0;
        return { class: cy.classTemplate.name, invoiced, collected, rate };
      })
    );

    // ── Payment method breakdown ────────────────────────────────────────────
    const methodRows = await db.feeTransaction.groupBy({
      by:    ["paymentMethod"],
      where: { transactionType: "PAYMENT", isReversal: false, studentFeeAccount: { schoolId, ...termFilter } },
      _sum:  { amount: true },
      _count:{ id: true },
    });
    const totalByMethod = methodRows.reduce((s, r) => s + (r._sum.amount ?? 0), 0);
    const methodBreakdown = methodRows
      .filter((r) => r.paymentMethod)
      .map((r) => ({
        method: r.paymentMethod as string,
        amount: r._sum.amount ?? 0,
        count:  r._count.id,
        pct:    totalByMethod > 0 ? Math.round(((r._sum.amount ?? 0) / totalByMethod) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // ── Monthly trend ───────────────────────────────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0,0,0,0);

    const monthlyTx = await db.feeTransaction.findMany({
      where: {
        transactionType: "PAYMENT", isReversal: false,
        processedAt:     { gte: sixMonthsAgo },
        studentFeeAccount: { schoolId, ...termFilter },
      },
      select: { amount: true, processedAt: true },
    });

    const monthMap: Record<string, number> = {};
    monthlyTx.forEach((t) => {
      const key = t.processedAt.toLocaleDateString("en-UG", { month: "short", year: "2-digit" });
      monthMap[key] = (monthMap[key] ?? 0) + t.amount;
    });
    const monthlyTrend = Object.entries(monthMap).map(([month, amount]) => ({ month, amount })).slice(-6);

    // ── Top arrears ─────────────────────────────────────────────────────────
    const topArrears = await db.studentFeeAccount.findMany({
      where:   { schoolId, balance: { gt: 0 }, ...termFilter },
      orderBy: { balance: "desc" },
      take:    10,
      select: {
        balance: true,
        student: { select: { firstName: true, lastName: true, admissionNo: true,
          enrollments: { where: { status: "ACTIVE" }, take: 1,
            select: { classYear: { select: { classTemplate: { select: { name: true } } } }, stream: { select: { name: true } } } } } },
      },
    });

    const topArrearsForUI = topArrears.map((a) => {
      const enr = a.student.enrollments[0];
      const cls = enr ? `${enr.classYear.classTemplate.name}${enr.stream ? ` ${enr.stream.name}` : ""}` : "";
      return { studentName: `${a.student.firstName} ${a.student.lastName}`, admissionNo: a.student.admissionNo, class: cls, balance: a.balance };
    });

    return NextResponse.json({
      summary: { totalInvoiced, totalCollected, outstanding, totalBursaries, totalPenalties, collectionRate, arrearsCount },
      classBars: classBars.filter(c => c.invoiced > 0),
      methodBreakdown,
      monthlyTrend,
      topArrears: topArrearsForUI,
    });
  } catch (err: any) {
    console.error("fees-report error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
