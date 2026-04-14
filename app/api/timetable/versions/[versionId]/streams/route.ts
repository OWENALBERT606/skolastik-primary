// GET /api/timetable/versions/[versionId]/streams
// Returns the list of streams that have slots in this version
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

    const rows = await db.timetableSlot.findMany({
      where:   { timetableVersionId: versionId, isActive: true },
      select:  {
        streamId: true,
        stream:   {
          select: {
            id:   true,
            name: true,
            classYear: {
              select: {
                classTemplate: { select: { name: true, level: true } },
              },
            },
          },
        },
      },
      distinct: ["streamId"],
      orderBy:  { stream: { classYear: { classTemplate: { level: "asc" } } } },
    });

    const streams = rows.map(r => ({
      id:        r.stream.id,
      name:      r.stream.name,
      className: r.stream.classYear.classTemplate.name,
      level:     r.stream.classYear.classTemplate.level ?? 0,
      label:     `${r.stream.classYear.classTemplate.name} ${r.stream.name}`,
    }));

    return NextResponse.json({ streams });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
