// actions/bulk-promotions.ts
"use server";

import { db }                          from "@/prisma/db";
import { EnrollmentStatus, EnrollmentType } from "@prisma/client";
import { revalidatePath }              from "next/cache";
import { enrollStudentAnnually }       from "@/lib/db-helpers/annual-enrollment";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type StudentPromotionAction = "PROMOTE" | "REPEAT" | "SKIP";

export type StudentPromotionEntry = {
  studentId:        string;
  fromEnrollmentId: string;
  action:           StudentPromotionAction;
  toClassYearId:    string;
  toStreamId?:      string | null;
  toTermId:         string;
  toAcademicYearId: string;
};

// ════════════════════════════════════════════════════════════════════════════
// FETCH STUDENTS FOR SOURCE CLASS / TERM
// Returns active enrollments with report card data for bulk promotion review.
// ════════════════════════════════════════════════════════════════════════════

export async function getBulkPromotionStudents(data: {
  classYearId: string;
  termId:      string;
  schoolId:    string;
}) {
  try {
    const { classYearId, termId, schoolId } = data;

    const enrollments = await db.enrollment.findMany({
      where: {
        classYearId,
        termId,
        status:  EnrollmentStatus.ACTIVE,
        student: { schoolId },
      },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true,
            admissionNo: true, gender: true,
          },
        },
        stream:   { select: { id: true, name: true } },
        classYear: {
          include: {
            classTemplate: { select: { name: true, level: true, classLevel: true } },
          },
        },
        reportCard: {
          select: {
            id: true, isPublished: true, classLevel: true,
            // O-Level
            division: true, aggregatePoints: true,
            // A-Level
            totalPoints: true, principalPasses: true, subsidiaryPasses: true,
            // Shared
            totalSubjects: true, averageMarks: true,
            streamPosition: true, classPosition: true,
          },
        },
      },
      orderBy: [
        { stream: { name: "asc" } },
        { student: { firstName: "asc" } },
      ],
    });

    return { ok: true as const, data: enrollments };
  } catch (error: any) {
    console.error("❌ getBulkPromotionStudents:", error);
    return { ok: false as const, message: "Failed to load students" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FETCH CLASS YEARS WITH STREAMS FOR A GIVEN ACADEMIC YEAR
// Used to populate both source and destination dropdowns.
// ════════════════════════════════════════════════════════════════════════════

export async function getClassYearsForYear(schoolId: string, academicYearId: string) {
  try {
    const classYears = await db.classYear.findMany({
      where: { academicYearId, isActive: true, classTemplate: { schoolId } },
      include: {
        classTemplate: {
          select: { id: true, name: true, code: true, level: true, classLevel: true },
        },
        streams: {
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { classTemplate: { level: "asc" } },
    });
    return { ok: true as const, data: classYears };
  } catch (error: any) {
    console.error("❌ getClassYearsForYear:", error);
    return { ok: false as const, message: "Failed to load class years" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EXECUTE BULK PROMOTION
// Processes each student entry: PROMOTE, REPEAT, or SKIP.
// - PROMOTE: new enrollment with EnrollmentType.PROMOTED + compulsory subjects
// - REPEAT:  new enrollment with EnrollmentType.REPEAT  + compulsory subjects
// - SKIP:    no-op (current enrollment left unchanged)
// Previous term results, report cards, and marks are never touched.
// ════════════════════════════════════════════════════════════════════════════

export async function executeBulkPromotion(data: {
  entries:      StudentPromotionEntry[];
  schoolId:     string;
  promotedById: string;
  slug:         string;
}) {
  const { entries, schoolId, promotedById, slug } = data;

  if (entries.length === 0) {
    return { ok: false as const, message: "No students to process" };
  }

  type RowResult = {
    studentId: string;
    action:    StudentPromotionAction;
    ok:        boolean;
    message?:  string;
  };

  const results: RowResult[] = [];

  for (const entry of entries) {
    if (entry.action === "SKIP") {
      results.push({ studentId: entry.studentId, action: "SKIP", ok: true });
      continue;
    }

    try {
      await db.$transaction(async (tx) => {
        // ── Validate source enrollment ─────────────────────────────────────
        const fromEnrollment = await tx.enrollment.findUnique({
          where:  { id: entry.fromEnrollmentId },
          select: { status: true, studentId: true },
        });
        if (!fromEnrollment) throw new Error("Source enrollment not found");
        if (fromEnrollment.status !== EnrollmentStatus.ACTIVE) {
          throw new Error("Source enrollment is not active");
        }
        if (fromEnrollment.studentId !== entry.studentId) {
          throw new Error("Student / enrollment mismatch");
        }

        // ── Guard: already enrolled in target term ─────────────────────────
        const existing = await tx.enrollment.findFirst({
          where: { studentId: entry.studentId, termId: entry.toTermId },
        });
        if (existing) throw new Error("Already enrolled in target term");

        // ── Mark source enrollment as completed ────────────────────────────
        await tx.enrollment.update({
          where: { id: entry.fromEnrollmentId },
          data:  { status: EnrollmentStatus.COMPLETED },
        });

        // ── Create new enrollment ──────────────────────────────────────────
        const newEnrollment = await tx.enrollment.create({
          data: {
            studentId:      entry.studentId,
            classYearId:    entry.toClassYearId,
            streamId:       entry.toStreamId ?? null,
            termId:         entry.toTermId,
            academicYearId: entry.toAcademicYearId,
            status:         EnrollmentStatus.ACTIVE,
            enrollmentType: entry.action === "PROMOTE"
              ? EnrollmentType.PROMOTED
              : EnrollmentType.REPEAT,
            promotedFromId: entry.fromEnrollmentId,
          },
        });

        // ── Auto-enroll in compulsory subjects for ALL terms in target year ─
        if (entry.toStreamId) {
          await enrollStudentAnnually(tx, {
            studentId:      entry.studentId,
            streamId:       entry.toStreamId,
            classYearId:    entry.toClassYearId,
            academicYearId: entry.toAcademicYearId,
            baseTermId:     entry.toTermId,
          });
        }
      });

      results.push({ studentId: entry.studentId, action: entry.action, ok: true });
    } catch (error: any) {
      results.push({
        studentId: entry.studentId,
        action:    entry.action,
        ok:        false,
        message:   error.message ?? "Unexpected error",
      });
    }
  }

  revalidatePath(`/school/${slug}/dos/academics/bulk-promotions`);
  revalidatePath(`/school/${slug}/dos/academics/classes`);

  const succeeded = results.filter(r => r.ok  && r.action !== "SKIP").length;
  const failed    = results.filter(r => !r.ok).length;
  const skipped   = results.filter(r => r.action === "SKIP").length;

  return {
    ok:      true as const,
    results,
    summary: { succeeded, failed, skipped, total: entries.length },
  };
}
