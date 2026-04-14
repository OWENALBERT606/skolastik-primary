// GET /api/timetable/me — teacher's own timetable (scoped to their assignments)
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import { getTeacherPersonalTimetable } from "@/lib/timetable/service";

export async function GET(req: NextRequest) {
  try {
    const user   = await getAuthenticatedUser();
    const termId = req.nextUrl.searchParams.get("termId");
    if (!termId) return NextResponse.json({ error: "termId required" }, { status: 400 });

    // Resolve teacher record from user
    const teacher = await db.teacher.findUnique({
      where:  { userId: user.id },
      select: { id: true, schoolId: true },
    });
    if (!teacher) return NextResponse.json({ error: "No teacher record found for this user" }, { status: 403 });

    const result = await getTeacherPersonalTimetable({
      teacherId: teacher.id,
      termId,
      schoolId:  teacher.schoolId,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
