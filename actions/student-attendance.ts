"use server";

import { db }            from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { StudentAttendanceStatus } from "@prisma/client";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise any date value to midnight UTC (YYYY-MM-DDT00:00:00.000Z) */
function toMidnightUTC(value: string | Date): Date {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttendanceRecord = {
  studentSubjectEnrollmentId?: string; // not used — kept for compat
  studentId:  string;
  status:     StudentAttendanceStatus;
  notes?:     string;
};

// ════════════════════════════════════════════════════════════════════════════
// GET TEACHER STREAMS
// Returns streams where the authenticated teacher is classHead OR teaches
// ════════════════════════════════════════════════════════════════════════════

export async function getTeacherStreamsForAttendance(userId: string) {
  try {
    const teacher = await db.teacher.findUnique({
      where:  { userId },
      select: { id: true, schoolId: true },
    });
    if (!teacher) return { ok: false as const, message: "Teacher not found" };

    // Only streams where this teacher is the assigned class head
    const headedStreams = await db.stream.findMany({
      where: {
        classHeadId: teacher.id,
        schoolId:    teacher.schoolId,
        classYear:   { academicYear: { isActive: true } },
      },
      include: {
        classYear: {
          include: {
            classTemplate: { select: { name: true } },
            academicYear:  { select: { id: true, year: true, isActive: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: [{ classYear: { classTemplate: { level: "asc" } } }, { name: "asc" }],
    });

    const streams = headedStreams.map(hs => ({
      streamId:       hs.id,
      streamName:     hs.name,
      className:      hs.classYear.classTemplate.name,
      academicYearId: hs.classYear.academicYear.id,
      academicYear:   hs.classYear.academicYear.year,
      isActiveYear:   hs.classYear.academicYear.isActive,
      classYearId:    hs.classYearId,
      studentCount:   hs._count.enrollments,
      role:           "CLASS_HEAD" as const,
    }));

    return { ok: true as const, data: { streams, schoolId: teacher.schoolId } };
  } catch (error: any) {
    console.error("❌ getTeacherStreamsForAttendance:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load streams" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STREAM STUDENTS WITH ATTENDANCE FOR A DATE
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamAttendance(data: {
  streamId:  string;
  date:      string;   // "YYYY-MM-DD"
  schoolId:  string;
}) {
  try {
    const normalizedDate = toMidnightUTC(data.date);

    // Find active term for this stream's class year
    const stream = await db.stream.findUnique({
      where:   { id: data.streamId },
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
    if (!stream) return { ok: false as const, message: "Stream not found" };

    const activeTerm = stream.classYear.academicYear.terms[0] ?? null;

    // Students enrolled in this stream (active term enrollment, or most recent)
    const enrollments = await db.enrollment.findMany({
      where: {
        streamId: data.streamId,
        status:   { in: ["ACTIVE", "COMPLETED"] },
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

    if (enrollments.length === 0) {
      return { ok: true as const, data: { students: [], date: data.date, termId: activeTerm?.id ?? null } };
    }

    // Existing attendance records for that date
    const studentIds     = enrollments.map(e => e.student.id);
    const existingRecords = await db.studentAttendance.findMany({
      where: { studentId: { in: studentIds }, date: normalizedDate, schoolId: data.schoolId },
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

    return {
      ok: true as const,
      data: {
        students,
        date:          data.date,
        termId:        activeTerm?.id          ?? null,
        academicYearId: stream.classYear.academicYearId,
        alreadyMarked: existingRecords.length > 0,
      },
    };
  } catch (error: any) {
    console.error("❌ getStreamAttendance:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load attendance" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MARK ATTENDANCE (BULK UPSERT)
// ════════════════════════════════════════════════════════════════════════════

export async function markAttendance(data: {
  streamId:       string;
  termId:         string;
  academicYearId: string;
  schoolId:       string;
  date:           string;   // "YYYY-MM-DD"
  markedById:     string;   // User.id
  records: Array<{
    studentId: string;
    status:    StudentAttendanceStatus;
    notes?:    string;
  }>;
}) {
  try {
    if (!data.records.length) {
      return { ok: false as const, message: "No attendance records provided" };
    }

    const normalizedDate = toMidnightUTC(data.date);

    // Validate stream belongs to school
    const stream = await db.stream.findFirst({
      where: { id: data.streamId, schoolId: data.schoolId },
      select: { id: true },
    });
    if (!stream) return { ok: false as const, message: "Stream not found" };

    // Upsert each record in a transaction
    const results = await db.$transaction(
      data.records.map(r =>
        db.studentAttendance.upsert({
          where:  { studentId_date: { studentId: r.studentId, date: normalizedDate } },
          update: {
            status:    r.status,
            notes:     r.notes?.trim() || null,
            markedById: data.markedById,
            streamId:   data.streamId,
          },
          create: {
            studentId:      r.studentId,
            streamId:       data.streamId,
            academicYearId: data.academicYearId,
            termId:         data.termId,
            schoolId:       data.schoolId,
            date:           normalizedDate,
            status:         r.status,
            notes:          r.notes?.trim() || null,
            markedById:     data.markedById,
          },
        })
      )
    );

    revalidatePath("/teacher/attendance");
    revalidatePath("/academics/attendance");

    const counts = data.records.reduce(
      (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; },
      {} as Record<string, number>
    );

    return {
      ok:      true as const,
      message: `Attendance saved — ${results.length} student${results.length !== 1 ? "s" : ""} (P:${counts.PRESENT ?? 0} A:${counts.ABSENT ?? 0} L:${counts.LATE ?? 0} E:${counts.EXCUSED ?? 0})`,
      data:    { saved: results.length },
    };
  } catch (error: any) {
    console.error("❌ markAttendance:", error);
    return { ok: false as const, message: error?.message ?? "Failed to save attendance" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STUDENT ATTENDANCE HISTORY
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentAttendanceHistory(data: {
  studentId: string;
  schoolId:  string;
  termId?:   string;
  from?:     string;   // "YYYY-MM-DD"
  to?:       string;   // "YYYY-MM-DD"
}) {
  try {
    const where: any = { studentId: data.studentId, schoolId: data.schoolId };
    if (data.termId) where.termId = data.termId;
    if (data.from || data.to) {
      where.date = {};
      if (data.from) where.date.gte = toMidnightUTC(data.from);
      if (data.to)   where.date.lte = toMidnightUTC(data.to);
    }

    const records = await db.studentAttendance.findMany({
      where,
      include: {
        stream:   { select: { name: true, classYear: { include: { classTemplate: { select: { name: true } } } } } },
        markedBy: { select: { firstName: true, lastName: true } },
        term:     { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    // Compute statistics
    const total     = records.length;
    const present   = records.filter(r => r.status === "PRESENT").length;
    const late      = records.filter(r => r.status === "LATE").length;
    const absent    = records.filter(r => r.status === "ABSENT").length;
    const excused   = records.filter(r => r.status === "EXCUSED").length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      ok: true as const,
      data: {
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
      },
    };
  } catch (error: any) {
    console.error("❌ getStudentAttendanceHistory:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load history" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET CLASS ATTENDANCE SUMMARY (for admin reports)
// ════════════════════════════════════════════════════════════════════════════

export async function getClassAttendanceSummary(data: {
  streamId:  string;
  schoolId:  string;
  termId:    string;
  from?:     string;
  to?:       string;
}) {
  try {
    const where: any = {
      streamId: data.streamId,
      schoolId: data.schoolId,
      termId:   data.termId,
    };
    if (data.from || data.to) {
      where.date = {};
      if (data.from) where.date.gte = toMidnightUTC(data.from);
      if (data.to)   where.date.lte = toMidnightUTC(data.to);
    }

    const records = await db.studentAttendance.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      },
      orderBy: [{ date: "asc" }, { student: { lastName: "asc" } }],
    });

    // Group by student
    const byStudent = new Map<string, { student: any; records: typeof records }>();
    for (const r of records) {
      if (!byStudent.has(r.studentId)) {
        byStudent.set(r.studentId, { student: r.student, records: [] });
      }
      byStudent.get(r.studentId)!.records.push(r);
    }

    const summary = Array.from(byStudent.values()).map(({ student, records: rs }) => {
      const total    = rs.length;
      const present  = rs.filter(r => r.status === "PRESENT").length;
      const late     = rs.filter(r => r.status === "LATE").length;
      const absent   = rs.filter(r => r.status === "ABSENT").length;
      const excused  = rs.filter(r => r.status === "EXCUSED").length;
      const rate     = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
      return {
        studentId:      student.id,
        studentName:    `${student.firstName} ${student.lastName}`,
        admissionNo:    student.admissionNo,
        total, present, late, absent, excused,
        attendanceRate: rate,
      };
    });

    return { ok: true as const, data: summary };
  } catch (error: any) {
    console.error("❌ getClassAttendanceSummary:", error);
    return { ok: false as const, message: error?.message ?? "Failed to load summary" };
  }
}
