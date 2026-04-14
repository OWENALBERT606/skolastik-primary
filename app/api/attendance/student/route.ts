// app/api/attendance/student/route.ts
// GET  — fetch students + attendance for a stream on a given date
// POST — bulk mark/update attendance

import { db }                    from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser }  from "@/config/useAuth";
import { StudentAttendanceStatus } from "@prisma/client";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMidnightUTC(value: string | Date): Date {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// ── GET /api/attendance/student?streamId=&date= ────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const user     = await getAuthenticatedUser();
    const schoolId = user.school?.id;
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const streamId  = searchParams.get("streamId");
    const dateParam = searchParams.get("date");

    if (!streamId || !dateParam) {
      return NextResponse.json({ error: "streamId and date are required" }, { status: 400 });
    }

    const normalizedDate = toMidnightUTC(dateParam);

    // Validate stream belongs to school
    const stream = await db.stream.findFirst({
      where:   { id: streamId, schoolId },
      include: {
        classYear: {
          include: {
            academicYear: {
              include: { terms: { where: { isActive: true }, take: 1 } },
            },
          },
        },
      },
    });
    if (!stream) return NextResponse.json({ error: "Stream not found" }, { status: 404 });

    const activeTerm = stream.classYear.academicYear.terms[0] ?? null;

    const enrollments = await db.enrollment.findMany({
      where: {
        streamId,
        status: { in: ["ACTIVE", "COMPLETED"] },
        ...(activeTerm ? { termId: activeTerm.id } : {}),
      },
      include: {
        student: {
          select: {
            id:          true,
            firstName:   true,
            lastName:    true,
            admissionNo: true,
            imageUrl:    true,
            gender:      true,
          },
        },
      },
      orderBy: [
        { student: { lastName:  "asc" } },
        { student: { firstName: "asc" } },
      ],
    });

    const studentIds      = enrollments.map(e => e.student.id);
    const existingRecords = await db.studentAttendance.findMany({
      where: { studentId: { in: studentIds }, date: normalizedDate, schoolId },
      select: { studentId: true, status: true, notes: true, id: true },
    });
    const recordMap = new Map(existingRecords.map(r => [r.studentId, r]));

    const students = enrollments.map(e => {
      const existing = recordMap.get(e.student.id);
      return {
        studentId:   e.student.id,
        firstName:   e.student.firstName,
        lastName:    e.student.lastName,
        admissionNo: e.student.admissionNo,
        imageUrl:    e.student.imageUrl,
        gender:      e.student.gender,
        status:      (existing?.status ?? "ABSENT") as StudentAttendanceStatus,
        notes:       existing?.notes ?? null,
        recordId:    existing?.id    ?? null,
      };
    });

    return NextResponse.json({
      students,
      date:           dateParam,
      termId:         activeTerm?.id ?? null,
      academicYearId: stream.classYear.academicYearId,
      alreadyMarked:  existingRecords.length > 0,
    });
  } catch (error: any) {
    console.error("❌ GET /api/attendance/student:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to fetch attendance" }, { status: 500 });
  }
}

// ── POST /api/attendance/student ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user     = await getAuthenticatedUser();
    const schoolId = user.school?.id;
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      streamId:       string;
      termId:         string;
      academicYearId: string;
      date:           string;
      records: Array<{
        studentId: string;
        status:    StudentAttendanceStatus;
        notes?:    string;
      }>;
    };

    const { streamId, termId, academicYearId, date, records } = body;
    if (!streamId || !termId || !academicYearId || !date || !records?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate stream belongs to school
    const stream = await db.stream.findFirst({
      where:  { id: streamId, schoolId },
      select: { id: true },
    });
    if (!stream) return NextResponse.json({ error: "Stream not found" }, { status: 404 });

    const normalizedDate = toMidnightUTC(date);

    const results = await db.$transaction(
      records.map(r =>
        db.studentAttendance.upsert({
          where:  { studentId_date: { studentId: r.studentId, date: normalizedDate } },
          update: {
            status:    r.status,
            notes:     r.notes?.trim() || null,
            markedById: user.id,
            streamId,
          },
          create: {
            studentId:      r.studentId,
            streamId,
            academicYearId,
            termId,
            schoolId,
            date:           normalizedDate,
            status:         r.status,
            notes:          r.notes?.trim() || null,
            markedById:     user.id,
          },
        })
      )
    );

    return NextResponse.json({ saved: results.length, message: `${results.length} records saved` });
  } catch (error: any) {
    console.error("❌ POST /api/attendance/student:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to save attendance" }, { status: 500 });
  }
}
