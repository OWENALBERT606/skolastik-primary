// GET /api/timetable/versions?schoolId=...&termId=...
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";

export async function GET(req: NextRequest) {
  try {
    const user     = await getAuthenticatedUser();
    const schoolId = req.nextUrl.searchParams.get("schoolId") ?? user.school?.id;
    const termId   = req.nextUrl.searchParams.get("termId");

    if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });

    const versions = await db.timetableVersion.findMany({
      where: { schoolId, ...(termId ? { termId } : {}) },
      include: {
        _count: { select: { slots: true, conflicts: true } },
      },
      orderBy: [{ termId: "asc" }, { versionNumber: "desc" }],
    });

    return NextResponse.json({ versions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
