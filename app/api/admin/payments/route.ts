import { NextRequest, NextResponse } from "next/server";
import { db }                        from "@/prisma/db";
import { requireSuperAdmin }         from "@/lib/admin-auth";
import { generateReceiptNumber }     from "@/lib/payments/generateReceiptNumber";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { searchParams } = new URL(req.url);
  const termId   = searchParams.get("termId")   ?? undefined;
  const schoolId = searchParams.get("schoolId") ?? undefined;

  const payments = await db.systemPayment.findMany({
    where: {
      ...(termId   ? { termId }   : {}),
      ...(schoolId ? { schoolId } : {}),
    },
    include: {
      school: { select: { id: true, name: true } },
      term:   { select: { id: true, name: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { schoolId, termId, amountPaid, note, paidAt } = await req.json();
  if (!schoolId || !termId || !amountPaid) return NextResponse.json({ error: "schoolId, termId, amountPaid required" }, { status: 400 });

  const receiptNumber = await generateReceiptNumber();

  const payment = await db.systemPayment.create({
    data: {
      schoolId,
      termId,
      amountPaid:    Number(amountPaid),
      note:          note ?? null,
      paidAt:        paidAt ? new Date(paidAt) : new Date(),
      receiptNumber,
    },
    include: {
      school: { select: { id: true, name: true } },
      term:   { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(payment, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { id, amountPaid, note, paidAt } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const payment = await db.systemPayment.update({
    where: { id },
    data: {
      ...(amountPaid !== undefined && { amountPaid: Number(amountPaid) }),
      ...(note      !== undefined && { note }),
      ...(paidAt    !== undefined && { paidAt: new Date(paidAt) }),
    },
    include: {
      school: { select: { id: true, name: true } },
      term:   { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(payment);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.systemPayment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
