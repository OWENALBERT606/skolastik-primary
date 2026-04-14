// GET /api/timetable/versions/[versionId]/pdf
// Returns all data needed to render the timetable PDF
// Optional query param: ?streamId=xxx  — returns only that stream (for individual download)
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
    const streamId = req.nextUrl.searchParams.get("streamId") ?? undefined;

    const version = await db.timetableVersion.findUniqueOrThrow({
      where:   { id: versionId },
      include: {
        school:      { select: { name: true, logo: true } },
        academicYear: { select: { year: true } },
        term:        { select: { name: true, termNumber: true } },
      },
    });

    // Get school day config for slot labels/times
    const dayConfigs = await db.schoolDayConfig.findMany({
      where:   { schoolId: version.schoolId, isActive: true },
      include: { slots: { orderBy: { slotNumber: "asc" } } },
      orderBy: { dayOfWeek: "asc" },
    });

    // All slots for this version with full relations (optionally filtered by stream)
    const slots = await db.timetableSlot.findMany({
      where:   {
        timetableVersionId: versionId,
        isActive:           true,
        ...(streamId ? { streamId } : {}),
      },
      include: {
        stream: {
          include: {
            classYear: {
              include: { classTemplate: { select: { name: true, level: true } } },
            },
          },
        },
        streamSubject: {
          include: {
            subject: { select: { name: true, code: true } },
            teacherAssignments: {
              where:   { status: "ACTIVE" },
              include: { teacher: { select: { firstName: true, lastName: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ stream: { classYear: { classTemplate: { level: "asc" } } } }, { dayOfWeek: "asc" }, { slotNumber: "asc" }],
    });

    // Group slots by stream
    const streamMap = new Map<string, {
      streamId:   string;
      streamName: string;
      className:  string;
      level:      number;
      slots:      typeof slots;
    }>();

    for (const slot of slots) {
      const key = slot.streamId;
      if (!streamMap.has(key)) {
        streamMap.set(key, {
          streamId:   slot.streamId,
          streamName: slot.stream.name,
          className:  slot.stream.classYear.classTemplate.name,
          level:      slot.stream.classYear.classTemplate.level ?? 0,
          slots:      [],
        });
      }
      streamMap.get(key)!.slots.push(slot);
    }

    const streams = [...streamMap.values()].sort((a, b) =>
      a.level !== b.level ? a.level - b.level : a.streamName.localeCompare(b.streamName)
    );

    return NextResponse.json({
      version: {
        id:           version.id,
        label:        version.label,
        versionNumber: version.versionNumber,
        status:       version.status,
        generatedAt:  version.generatedAt,
        school:       version.school,
        academicYear: version.academicYear,
        term:         version.term,
      },
      dayConfigs: dayConfigs.map(dc => ({
        dayOfWeek: dc.dayOfWeek,
        slots:     dc.slots,
      })),
      streams,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
