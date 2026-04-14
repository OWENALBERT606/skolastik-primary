// app/api/attendance/student/history/route.ts
// GET /api/attendance/student/history?studentId=&termId=&from=&to=

import { db }                    from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser }  from "@/config/useAuth";

export async function GET(req: NextRequest) {
  try {
    const user     = await getAuthenticatedUser();
    const schoolId = user.school?.id;
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const termId    = searchParams.get("termId")  ?? undefined;
    const from      = searchParams.get("from")    ?? undefined;
    const to        = searchParams.get("to")      ?? undefined;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    // Confirm student belongs to this school
    const student = await db.student.findFirst({
      where:  { id: studentId, schoolId },
      select: { id: true, firstName: true, lastName: true, admissionNo: true },
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const where: any = { studentId, schoolId };
    if (termId) where.termId = termId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from + "T00:00:00.000Z");
      if (to)   where.date.lte = new Date(to   + "T00:00:00.000Z");
    }

    const records = await db.studentAttendance.findMany({
      where,
      include: {
        stream:   { select: { name: true, classYear: { include: { classTemplate: { select: { name: true } } } } } },
        markedBy: { select: { firstName: true, lastName: true } },
        term:     { select: { name: true, termNumber: true } },
      },
      orderBy: { date: "desc" },
    });

    const total    = records.length;
    const present  = records.filter(r => r.status === "PRESENT").length;
    const late     = records.filter(r => r.status === "LATE").length;
    const absent   = records.filter(r => r.status === "ABSENT").length;
    const excused  = records.filter(r => r.status === "EXCUSED").length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return NextResponse.json({
      student: {
        id:          student.id,
        name:        `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
      },
      records: records.map(r => ({
        id:         r.id,
        date:       r.date.toISOString().split("T")[0],
        status:     r.status,
        notes:      r.notes,
        streamName: `${r.stream.classYear.classTemplate.name} ${r.stream.name}`,
        termName:   r.term.name,
        markedBy:   `${r.markedBy.firstName} ${r.markedBy.lastName}`,
      })),
      stats: { total, present, late, absent, excused, attendanceRate },
    });
  } catch (error: any) {
    console.error("❌ GET /api/attendance/student/history:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to fetch history" }, { status: 500 });
  }
}
