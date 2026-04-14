// GET /api/timetable/teacher-availability/[teacherId] — full availability for one teacher
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    await getAuthenticatedUser();
    const { teacherId } = await params;

    const availability = await db.teacherAvailability.findMany({
      where:   { teacherId },
      orderBy: { dayOfWeek: "asc" },
    });

    const blocked = await db.teacherBlockedSlot.findMany({
      where:   { teacherId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ availability, blocked });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
