import { NextRequest, NextResponse } from "next/server";
import { db }                        from "@/prisma/db";
import { requireSuperAdmin }         from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const terms = await db.billingTerm.findMany({ orderBy: { startDate: "desc" } });
  return NextResponse.json(terms);
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: (auth as any).status });

  const { name, startDate, endDate } = await req.json();
  if (!name || !startDate || !endDate) return NextResponse.json({ error: "name, startDate, endDate required" }, { status: 400 });

  try {
    const term = await db.billingTerm.create({
      data: { name: name.trim(), startDate: new Date(startDate), endDate: new Date(endDate) },
    });
    return NextResponse.json(term, { status: 201 });
  } catch (err: any) {
    console.error("Create term error:", err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: `A term named "${name}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: err?.message ?? "Failed to create term" }, { status: 500 });
  }
}
