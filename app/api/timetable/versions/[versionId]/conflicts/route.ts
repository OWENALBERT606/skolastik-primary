// GET   /api/timetable/versions/[versionId]/conflicts
// PATCH /api/timetable/versions/[versionId]/conflicts?conflictId=... — mark resolved
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    await getAuthenticatedUser();
    const { versionId } = await params;

    const conflicts = await db.timetableConflict.findMany({
      where:   { timetableVersionId: versionId },
      orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ conflicts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    await getAuthenticatedUser();
    const { versionId } = await params;
    const conflictId = req.nextUrl.searchParams.get("conflictId");
    if (!conflictId) return NextResponse.json({ error: "conflictId required" }, { status: 400 });

    const conflict = await db.timetableConflict.update({
      where: { id: conflictId, timetableVersionId: versionId },
      data:  { isResolved: true, resolvedAt: new Date() },
    });

    return NextResponse.json({ conflict });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
