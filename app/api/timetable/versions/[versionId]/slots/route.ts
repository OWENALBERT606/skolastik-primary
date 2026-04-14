// GET /api/timetable/versions/[versionId]/slots?streamId=...
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    await getAuthenticatedUser();
    const { versionId } = await params;
    const streamId = req.nextUrl.searchParams.get("streamId");

    const slots = await db.timetableSlot.findMany({
      where: {
        timetableVersionId: versionId,
        isActive:           true,
        ...(streamId ? { streamId } : {}),
      },
      include: {
        stream:        { select: { id: true, name: true } },
        streamSubject: {
          include: {
            subject:      { select: { id: true, name: true, code: true } },
            teacherAssignments: {
              where: { status: "ACTIVE" },
              include: {
                teacher: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { slotNumber: "asc" }],
    });

    return NextResponse.json({ slots });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
