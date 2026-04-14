// actions/class-subject-assignment.ts
"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { SubjectType } from "@prisma/client";

// ═════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════

export type PaperAssignment = {
  paperId:          string;   // SubjectPaper.id  (null-safe: empty means no papers)
  weightPercentage: number;   // must sum to 100 across all papers for this class
};

export type ClassPaperSelection = {
  classYearId:  string;
  // Empty array = subject has no papers (subjectPaperId will be null on StreamSubject)
  papers:       PaperAssignment[];
};

// ═════════════════════════════════════════════════════════════════════════
// ASSIGN SUBJECT WITH PAPER SELECTION TO ONE OR MORE CLASSES
//
// Replaces the old bulkAssignSubjectsToClassYear for the UI flow where
// the admin selects which papers each class takes and sets weights.
//
// For each classYearId:
//   1. Creates ClassSubject (skips if already exists)
//   2. Creates ClassSubjectPaper rows for selected papers with weights
//   3. Creates StreamSubject rows — one per (stream × term × paper)
//      If papers is empty → one StreamSubject per (stream × term) with null paperId
// ═════════════════════════════════════════════════════════════════════════

export async function assignSubjectWithPapersToClasses(input: {
  subjectId:   string;
  schoolId:    string;
  selections:  ClassPaperSelection[];  // one per class year
}) {
  const { subjectId, schoolId, selections } = input;

  if (selections.length === 0) {
    return { ok: false, message: "No classes selected" };
  }

  // Validate weights sum to 100 for every class that has papers
  for (const sel of selections) {
    if (sel.papers.length === 0) continue;

    const total = sel.papers.reduce((s, p) => s + p.weightPercentage, 0);
    // Allow small float drift (e.g. 99.99)
    if (Math.abs(total - 100) > 0.5) {
      return {
        ok: false,
        message: `Paper weights for class ${sel.classYearId} must sum to 100% (currently ${total.toFixed(1)}%)`,
      };
    }
  }

  try {
    const results: { classYearId: string; created: boolean }[] = [];

    await db.$transaction(async (tx) => {
      for (const sel of selections) {
        const { classYearId, papers } = sel;

        // ── 1. Get or create ClassSubject ─────────────────────────────────
        let classSubject = await tx.classSubject.findUnique({
          where: { classYearId_subjectId: { classYearId, subjectId } },
        });

        if (classSubject) {
          results.push({ classYearId, created: false });
          // Subject already assigned to this class — skip (don't overwrite)
          continue;
        }

        classSubject = await tx.classSubject.create({
          data: {
            classYearId,
            subjectId,
            subjectType: SubjectType.COMPULSORY,
            aoiCount: 0,
          },
        });

        // ── 2. Create ClassSubjectPaper rows (paper → class weight config) ─
        //    Only if the subject has papers and user selected some
        if (papers.length > 0) {
          await tx.classSubjectPaper.createMany({
            data: papers.map((p) => ({
              classSubjectId:  classSubject!.id,
              subjectPaperId:  p.paperId,
              weightPercentage: p.weightPercentage,
              isActive: true,
            })),
            skipDuplicates: true,
          });
        }

        // ── 3. Get streams and active terms for this class year ────────────
        const classYear = await tx.classYear.findUnique({
          where: { id: classYearId },
          include: {
            streams: { select: { id: true } },
            academicYear: {
              include: {
                terms: {
                  where: { isActive: true },
                  select: { id: true },
                },
              },
            },
          },
        });

        if (!classYear || classYear.streams.length === 0) {
          results.push({ classYearId, created: true });
          continue;
        }

        // ── 4. Create StreamSubject rows ───────────────────────────────────
        const streamSubjectRows = [];

        for (const stream of classYear.streams) {
          for (const term of classYear.academicYear.terms) {
            if (papers.length > 0) {
              // One StreamSubject row per paper (the architecture requires this)
              for (const paper of papers) {
                streamSubjectRows.push({
                  streamId:       stream.id,
                  subjectId,
                  classSubjectId: classSubject.id,
                  termId:         term.id,
                  subjectPaperId: paper.paperId,
                  subjectType:    classSubject.subjectType,
                  isActive:       true,
                });
              }
            } else {
              // No papers defined on this subject — single row with null paperId
              streamSubjectRows.push({
                streamId:       stream.id,
                subjectId,
                classSubjectId: classSubject.id,
                termId:         term.id,
                subjectPaperId: null,
                subjectType:    classSubject.subjectType,
                isActive:       true,
              });
            }
          }
        }

        if (streamSubjectRows.length > 0) {
          await tx.streamSubject.createMany({
            data: streamSubjectRows,
            skipDuplicates: true,
          });
        }

        results.push({ classYearId, created: true });
      }
    });

    const created = results.filter((r) => r.created).length;
    const skipped = results.filter((r) => !r.created).length;

    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/classes");

    const parts = [];
    if (created > 0) parts.push(`Assigned to ${created} class${created !== 1 ? "es" : ""}`);
    if (skipped > 0) parts.push(`${skipped} already assigned`);

    return {
      ok: true,
      message: parts.join(". ") || "Done",
      created,
      skipped,
    };
  } catch (error: any) {
    console.error("❌ assignSubjectWithPapersToClasses:", error);
    return { ok: false, message: error?.message ?? "Failed to assign subject" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// REMOVE SUBJECT FROM CLASS YEAR (unchanged — kept here for co-location)
// ═════════════════════════════════════════════════════════════════════════

export async function removeSubjectFromClassYear(classSubjectId: string) {
  try {
    const classSubject = await db.classSubject.findUnique({
      where: { id: classSubjectId },
      include: {
        subject: { select: { name: true } },
        streamSubjects: {
          include: {
            _count: {
              select: { studentEnrollments: true, teacherAssignments: true },
            },
          },
        },
      },
    });

    if (!classSubject) return { ok: false, message: "Class subject not found" };

    const hasStudents = classSubject.streamSubjects.some(
      (ss) => ss._count.studentEnrollments > 0
    );
    const hasTeachers = classSubject.streamSubjects.some(
      (ss) => ss._count.teacherAssignments > 0
    );

    if (hasStudents || hasTeachers) {
      return {
        ok: false,
        message: `Cannot remove ${classSubject.subject.name}. ${
          hasStudents ? "Students are enrolled" : ""
        }${hasStudents && hasTeachers ? " and " : ""}${
          hasTeachers ? "teachers are assigned" : ""
        }.`,
      };
    }

    // Cascade deletes ClassSubjectPaper and StreamSubject rows
    await db.classSubject.delete({ where: { id: classSubjectId } });

    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/classes");

    return { ok: true, message: `${classSubject.subject.name} removed from class` };
  } catch (error: any) {
    console.error("❌ removeSubjectFromClassYear:", error);
    return { ok: false, message: error?.message ?? "Failed to remove subject" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// BULK ASSIGN (kept for compatibility with class-subject.ts page)
// Assigns ALL papers — only use this when you want the old behaviour
// (e.g. bulk-seeding from the class detail page, not subject detail page)
// ═════════════════════════════════════════════════════════════════════════

export async function bulkAssignSubjectsToClassYear(data: {
  classYearId: string;
  subjectIds:  string[];
}) {
  const { classYearId, subjectIds } = data;

  if (!classYearId || subjectIds.length === 0) {
    return { ok: false, message: "Class year and at least one subject are required" };
  }

  const results = await Promise.all(
    subjectIds.map(async (subjectId) => {
      // Get all active papers for this subject
      const subject = await db.subject.findUnique({
        where: { id: subjectId },
        include: {
          papers: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      });

      if (!subject) return { ok: false, subjectId, message: "Subject not found" };

      return assignSubjectWithPapersToClasses({
        subjectId,
        schoolId: subject.schoolId,
        selections: [{
          classYearId,
          // Use all papers with equal weights
          papers: subject.papers.map((p, _, arr) => ({
            paperId:          p.id,
            weightPercentage: parseFloat((100 / arr.length).toFixed(2)),
          })),
        }],
      });
    })
  );

  const created = results.filter((r) => r.ok).length;
  const failed  = results.filter((r) => !r.ok).length;

  revalidatePath("/dashboard/classes");

  return {
    ok:      failed === 0,
    message: `${created} subject${created !== 1 ? "s" : ""} assigned${failed > 0 ? `, ${failed} failed` : ""}`,
  };
}