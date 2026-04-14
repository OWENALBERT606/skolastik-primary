import { NextRequest, NextResponse } from "next/server";
import { db }                        from "@/prisma/db";
import { requireSuperAdmin }         from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const expenses = await db.systemExpense.findMany({ orderBy: { paidAt: "desc" } });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { description, amount, paidAt, category } = await req.json();
  if (!description || !amount || !paidAt) return NextResponse.json({ error: "description, amount, paidAt required" }, { status: 400 });

  try {
    const expense = await db.systemExpense.create({
      data: {
        description,
        amount:   Number(amount),
        paidAt:   new Date(paidAt),
        category: category ?? "SERVER",
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (err: any) {
    console.error("Create expense error:", err);
    if (err?.message?.includes("undefined")) {
      return NextResponse.json({ error: "Prisma client needs regenerating. Run: npx prisma generate" }, { status: 500 });
    }
    return NextResponse.json({ error: err?.message ?? "Failed to create expense" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { id, description, amount, paidAt, category } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const expense = await db.systemExpense.update({
    where: { id },
    data: {
      ...(description !== undefined && { description }),
      ...(amount      !== undefined && { amount: Number(amount) }),
      ...(paidAt      !== undefined && { paidAt: new Date(paidAt) }),
      ...(category    !== undefined && { category }),
    },
  });
  return NextResponse.json(expense);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.systemExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
