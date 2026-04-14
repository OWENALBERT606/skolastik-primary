// GET  /api/timetable/class-day-config?schoolId=&classYearId=
// POST /api/timetable/class-day-config  — upsert a class day config with slots
// DELETE /api/timetable/class-day-config?classYearId=&dayOfWeek= — remove override
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import { z } from "zod";
import { DayOfWeek, SlotType } from "@prisma/client";

const SlotSchema = z.object({
  slotNumber:  z.number().int().positive(),
  startTime:   z.string().regex(/^\d{2}:\d{2}$/),
  endTime:     z.string().regex(/^\d{2}:\d{2}$/),
  slotType:    z.nativeEnum(SlotType).default(SlotType.LESSON),
  label:       z.string().optional(),
  durationMin: z.number().int().positive().default(40),
});

const ClassDayConfigSchema = z.object({
  classYearId: z.string().cuid(),
  dayOfWeek:   z.nativeEnum(DayOfWeek),
  isActive:    z.boolean().default(true),
  label:       z.string().optional(),
  slots:       z.array(SlotSchema).default([]),
});

export async function GET(req: NextRequest) {
  try {
    await getAuthenticatedUser();
    const schoolId   = req.nextUrl.searchParams.get("schoolId");
    const classYearId = req.nextUrl.searchParams.get("classYearId");
    if (!classYearId && !schoolId) {
      return NextResponse.json({ error: "classYearId or schoolId required" }, { status: 400 });
    }

    const configs = await db.classDayConfig.findMany({
      where:   classYearId ? { classYearId } : { schoolId: schoolId! },
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
    const user   = await getAuthenticatedUser();
    const body   = await req.json();
    const parsed = ClassDayConfigSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const schoolId = body.schoolId ?? user.school?.id;
    if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });

    const { classYearId, dayOfWeek, isActive, label, slots } = parsed.data;

    const config = await db.$transaction(async (tx) => {
      const cfg = await tx.classDayConfig.upsert({
        where:  { classYearId_dayOfWeek: { classYearId, dayOfWeek } },
        create: { classYearId, schoolId, dayOfWeek, isActive, label },
        update: { isActive, label },
      });

      await tx.classDaySlot.deleteMany({ where: { classDayConfigId: cfg.id } });
      if (slots.length > 0) {
        await tx.classDaySlot.createMany({
          data: slots.map(s => ({ ...s, classDayConfigId: cfg.id })),
        });
      }

      return tx.classDayConfig.findUniqueOrThrow({
        where:   { id: cfg.id },
        include: { slots: { orderBy: { slotNumber: "asc" } } },
      });
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await getAuthenticatedUser();
    const classYearId = req.nextUrl.searchParams.get("classYearId");
    const dayOfWeek   = req.nextUrl.searchParams.get("dayOfWeek") as DayOfWeek | null;
    if (!classYearId) return NextResponse.json({ error: "classYearId required" }, { status: 400 });

    if (dayOfWeek) {
      await db.classDayConfig.deleteMany({ where: { classYearId, dayOfWeek } });
    } else {
      // Delete all overrides for this class
      await db.classDayConfig.deleteMany({ where: { classYearId } });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
