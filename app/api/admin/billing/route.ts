import { NextRequest, NextResponse } from "next/server";
import { db }                        from "@/prisma/db";
import { requireSuperAdmin }         from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const schools = await db.school.findMany({
    orderBy: { name: "asc" },
    select: {
      id:      true,
      name:    true,
      isActive: true,
      billing: { select: { pricePerTerm: true, currency: true } },
    },
  });

  return NextResponse.json(schools.map(s => ({
    schoolId:     s.id,
    schoolName:   s.name,
    isActive:     s.isActive,
    pricePerTerm: s.billing?.pricePerTerm ?? null,
    currency:     s.billing?.currency ?? "UGX",
  })));
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { schoolId, pricePerTerm } = await req.json();
  if (!schoolId || pricePerTerm == null) return NextResponse.json({ error: "schoolId and pricePerTerm required" }, { status: 400 });

  const billing = await db.schoolBilling.upsert({
    where:  { schoolId },
    create: { schoolId, pricePerTerm: Number(pricePerTerm) },
    update: { pricePerTerm: Number(pricePerTerm) },
  });

  return NextResponse.json(billing);
}
