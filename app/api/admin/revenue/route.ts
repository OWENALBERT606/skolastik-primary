import { NextResponse }    from "next/server";
import { db }              from "@/prisma/db";
import { requireSuperAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const [terms, billings, payments, expenseAgg] = await Promise.all([
    db.billingTerm.findMany({ orderBy: { startDate: "desc" } }),
    db.schoolBilling.findMany({ include: { school: { select: { id: true, name: true, isActive: true } } } }),
    db.systemPayment.findMany({ include: { school: { select: { id: true, name: true } }, term: { select: { id: true, name: true } } } }),
    db.systemExpense.aggregate({ _sum: { amount: true } }),
  ]);

  const totalExpenses  = expenseAgg._sum.amount ?? 0;
  const totalCollected = payments.reduce((s, p) => s + p.amountPaid, 0);

  // Per-term billing: sum of pricePerTerm across all schools with billing config
  const byTerm = terms.map(term => {
    const billed    = billings.reduce((s, b) => s + b.pricePerTerm, 0);
    const collected = payments.filter(p => p.termId === term.id).reduce((s, p) => s + p.amountPaid, 0);
    return {
      termId:      term.id,
      termName:    term.name,
      billed,
      collected,
      outstanding: Math.max(billed - collected, 0),
    };
  });

  const totalBilled      = byTerm.reduce((s, t) => s + t.billed, 0);
  const totalOutstanding = Math.max(totalBilled - totalCollected, 0);
  const netProfit        = totalCollected - totalExpenses;

  // Per-school summary
  const bySchool = billings.map(b => {
    const totalPaid = payments.filter(p => p.schoolId === b.schoolId).reduce((s, p) => s + p.amountPaid, 0);
    const totalBilledSchool = b.pricePerTerm * terms.length;
    return {
      schoolId:    b.schoolId,
      schoolName:  b.school.name,
      pricePerTerm: b.pricePerTerm,
      totalBilled: totalBilledSchool,
      totalPaid,
      balance:     Math.max(totalBilledSchool - totalPaid, 0),
    };
  });

  return NextResponse.json({ totalBilled, totalCollected, totalOutstanding, totalExpenses, netProfit, byTerm, bySchool });
}
