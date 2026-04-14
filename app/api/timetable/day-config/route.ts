// GET  /api/timetable/day-config  — list school day configs
// POST /api/timetable/day-config  — upsert a day config with slots
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import { SchoolDayConfigSchema } from "@/lib/timetable/types";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const schoolId = req.nextUrl.searchParams.get("schoolId") ?? user.school?.id;
    if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });

    const configs = await db.schoolDayConfig.findMany({
      where: { schoolId },
      include: { slots: { orderBy: { slotNumber: "asc" } } },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ configs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json();
    const schoolId = body.schoolId ?? user.school?.id;
    if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });

    const parsed = SchoolDayConfigSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const { dayOfWeek, isActive, label, slots } = parsed.data;

    const config = await db.$transaction(async (tx) => {
      const cfg = await tx.schoolDayConfig.upsert({
        where:  { schoolId_dayOfWeek: { schoolId, dayOfWeek } },
        create: { schoolId, dayOfWeek, isActive, label },
        update: { isActive, label },
      });

      // Replace slots
      await tx.schoolDaySlot.deleteMany({ where: { schoolDayConfigId: cfg.id } });
      if (slots.length > 0) {
        await tx.schoolDaySlot.createMany({
          data: slots.map(s => ({ ...s, schoolDayConfigId: cfg.id })),
        });
      }

      return tx.schoolDayConfig.findUniqueOrThrow({
        where: { id: cfg.id },
        include: { slots: { orderBy: { slotNumber: "asc" } } },
      });
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
