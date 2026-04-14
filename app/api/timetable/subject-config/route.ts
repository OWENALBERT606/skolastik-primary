// GET  /api/timetable/subject-config?classSubjectId=...
// POST /api/timetable/subject-config  — upsert config
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import { ClassSubjectConfigSchema } from "@/lib/timetable/types";

export async function GET(req: NextRequest) {
  try {
    await getAuthenticatedUser();
    const classSubjectId = req.nextUrl.searchParams.get("classSubjectId");
    if (!classSubjectId) return NextResponse.json({ error: "classSubjectId required" }, { status: 400 });

    const config = await db.classSubjectConfig.findUnique({ where: { classSubjectId } });
    return NextResponse.json({ config });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAuthenticatedUser();
    const body   = await req.json();
    const parsed = ClassSubjectConfigSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const { classSubjectId, lessonsPerWeek, allowDoubles, preferMorning } = parsed.data;

    const config = await db.classSubjectConfig.upsert({
      where:  { classSubjectId },
      create: { classSubjectId, lessonsPerWeek, allowDoubles, preferMorning },
      update: { lessonsPerWeek, allowDoubles, preferMorning },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
