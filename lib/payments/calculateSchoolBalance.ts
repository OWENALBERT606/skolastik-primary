import { db } from "@/prisma/db";

export async function calculateSchoolBalance(
  schoolId: string,
  termId?: string
): Promise<{ totalBilled: number; totalPaid: number; balance: number }> {
  const billing = await db.schoolBilling.findUnique({ where: { schoolId } });
  const pricePerTerm = billing?.pricePerTerm ?? 0;

  const where = termId
    ? { schoolId, termId }
    : { schoolId };

  const [termCount, payAgg] = await Promise.all([
    termId ? 1 : db.billingTerm.count(),
    db.systemPayment.aggregate({ where, _sum: { amountPaid: true } }),
  ]);

  const totalBilled = pricePerTerm * termCount;
  const totalPaid   = payAgg._sum.amountPaid ?? 0;
  return { totalBilled, totalPaid, balance: Math.max(totalBilled - totalPaid, 0) };
}
