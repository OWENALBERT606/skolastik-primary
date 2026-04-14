import { db }          from "@/prisma/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const schools = await db.school.findMany({
      where:  { isActive: true },
      select: { id: true, name: true, logo: true, address: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(schools);
  } catch {
    return NextResponse.json([]);
  }
}
