import { db }          from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const yearId   = searchParams.get("yearId");

  if (!schoolId || !yearId) {
    return NextResponse.json({ error: "schoolId and yearId required" }, { status: 400 });
  }

  try {
    const structures = await db.feeStructure.findMany({
      where:   { schoolId, academicYearId: yearId },
      orderBy: [{ term: { termNumber: "asc" } }, { isPublished: "desc" }, { createdAt: "desc" }],
      include: {
        items: {
          include: { feeCategory: { select: { id: true, name: true, code: true } } },
          orderBy: { feeCategory: { name: "asc" } },
        },
        term:     { select: { id: true, name: true, termNumber: true } },
        classYear: { select: { id: true, classTemplate: { select: { id: true, name: true, code: true } } } },
        _count: { select: { invoices: true } },
      },
    });
    return NextResponse.json(structures);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
