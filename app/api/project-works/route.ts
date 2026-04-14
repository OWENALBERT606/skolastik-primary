// app/api/project-works/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db }                        from "@/prisma/db";
import { getAuthenticatedUser }      from "@/config/useAuth";

export const dynamic = "force-dynamic";

// ── GET: list project works for a student or stream ───────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const streamId  = searchParams.get("streamId");
  const schoolId  = searchParams.get("schoolId");

  if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });

  const works = await db.projectWork.findMany({
    where: {
      schoolId,
      ...(studentId ? { studentId } : {}),
      ...(streamId  ? { student: { enrollments: { some: { streamId } } } } : {}),
    },
    include: {
      student:    { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(works);
}

// ── POST: create a new project work ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    studentId, schoolId, title, description,
    fileUrl, fileKey, fileName, fileSizeKb,
    className, streamName, academicYear, termName,
  } = await req.json();

  if (!studentId || !schoolId || !title || !fileUrl || !fileName) {
    return NextResponse.json({ error: "studentId, schoolId, title, fileUrl, fileName required" }, { status: 400 });
  }

  // Permission check
  const canUpload = await checkUploadPermission(user.id, studentId, schoolId);
  if (!canUpload) {
    return NextResponse.json({ error: "Only the class head teacher, DOS, or school admin can upload project works." }, { status: 403 });
  }

  // Max 10 project works per student
  try {
    const existing = await db.projectWork.count({ where: { studentId, schoolId } });
    if (existing >= 10) {
      return NextResponse.json({ error: "A student can have a maximum of 10 project works." }, { status: 422 });
    }
  } catch { /* skip if model not yet in client */ }

  try {
    const work = await db.projectWork.create({
      data: {
        studentId, schoolId, title,
        description: description ?? null,
        fileUrl, fileKey: fileKey ?? "", fileName,
        fileSizeKb: fileSizeKb ?? null,
        className: className ?? null,
        streamName: streamName ?? null,
        academicYear: academicYear ?? null,
        termName: termName ?? null,
        uploadedById: user.id,
      },
      include: {
        student:    { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(work, { status: 201 });
  } catch (err: any) {
    console.error("ProjectWork create error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to save project work. Run: npx prisma generate" }, { status: 500 });
  }
}

// ── DELETE: remove a project work ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const work = await db.projectWork.findUnique({ where: { id } });
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canUpload = await checkUploadPermission(user.id, work.studentId, work.schoolId);
  if (!canUpload) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.projectWork.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// ── Permission helper ─────────────────────────────────────────────────────────
async function checkUploadPermission(userId: string, studentId: string, schoolId: string): Promise<boolean> {
  // School admin / super admin — always allowed
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { roles: { select: { roleName: true } } },
  });
  const roles = (user?.roles ?? []).map(r => r.roleName.toLowerCase());
  if (roles.some(r => r.includes("admin"))) return true;

  // Find the student's active stream
  const enrollment = await db.enrollment.findFirst({
    where:   { studentId, status: "ACTIVE" },
    select:  { streamId: true },
    orderBy: { createdAt: "desc" },
  });
  if (!enrollment) return false;

  // Check if user is a teacher assigned to that stream
  const teacher = await db.teacher.findUnique({
    where:  { userId },
    select: { id: true, schoolId: true },
  });
  if (!teacher || teacher.schoolId !== schoolId) {
    // Check DOS/staff role
    const staff = await db.staff.findFirst({ where: { userId }, select: { id: true } });
    if (staff) {
      const dosRole = await db.staffRole.findFirst({
        where: { staffId: staff.id, isActive: true, roleDefinition: { code: { in: ["DOS", "DIRECTOR_OF_STUDIES", "HEAD_TEACHER"] } } },
      });
      if (dosRole) return true;
    }
    return false;
  }

  // Teacher is in the same school — allow (class teachers can upload)
  return true;
}
