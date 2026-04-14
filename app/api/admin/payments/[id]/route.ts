import { NextRequest, NextResponse } from "next/server";
import { db }                        from "@/prisma/db";
import { requireSuperAdmin }         from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { id } = await params;
  const payment = await db.systemPayment.findUnique({
    where:   { id },
    include: {
      school: { select: { id: true, name: true, address: true, logo: true } },
      term:   { select: { id: true, name: true } },
    },
  });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(payment);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { id } = await params;
  await db.systemPayment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
