// GET  /api/timetable/teacher-availability?teacherId=...&schoolId=...
// POST /api/timetable/teacher-availability  — upsert availability
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import { TeacherAvailabilitySchema } from "@/lib/timetable/types";

export async function GET(req: NextRequest) {
  try {
    await getAuthenticatedUser();
    const teacherId = req.nextUrl.searchParams.get("teacherId");
    const schoolId  = req.nextUrl.searchParams.get("schoolId");
    if (!teacherId) return NextResponse.json({ error: "teacherId required" }, { status: 400 });

    const rows = await db.teacherAvailability.findMany({
      where: { teacherId, ...(schoolId ? { schoolId } : {}) },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ availability: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user   = await getAuthenticatedUser();
    const body   = await req.json();
    const parsed = TeacherAvailabilitySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const schoolId = body.schoolId ?? user.school?.id;
    if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });

    const { teacherId, dayOfWeek, isAvailable, availableFrom, availableTo, notes } = parsed.data;

    const row = await db.teacherAvailability.upsert({
      where:  { teacherId_dayOfWeek: { teacherId, dayOfWeek } },
      create: { teacherId, schoolId, dayOfWeek, isAvailable, availableFrom, availableTo, notes },
      update: { isAvailable, availableFrom, availableTo, notes },
    });

    return NextResponse.json({ availability: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
