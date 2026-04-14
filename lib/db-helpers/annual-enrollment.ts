// lib/db-helpers/annual-enrollment.ts
//
// Shared helper for ANNUAL subject enrollment.
//
// When a student joins a stream in an academic year, they should be enrolled
// in that stream's compulsory subjects for EVERY configured term of that year —
// not just the term they first joined in.  This function is called inside any
// db.$transaction() that creates a primary Enrollment record, so it can reuse
// the same transaction and roll back atomically if anything fails.
//
// IMPORTANT: this is NOT a "use server" action — it is a pure helper that
// must be called from within an existing Prisma transaction (tx).

import {
  Prisma,
  EnrollmentStatus,
  EnrollmentType,
  SubjectEnrollmentStatus,
} from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// enrollStudentAnnually
//
// For a student who already has a primary Enrollment for `baseTermId`, this
// function:
//   1. Fetches every term in `academicYearId`.
//   2. Finds all COMPULSORY StreamSubjects for `streamId` across those terms.
//   3. For each non-base term that has StreamSubjects configured:
//      a. Finds the existing Enrollment for that term (or creates one).
//      b. Creates StudentSubjectEnrollment rows (skipDuplicates = safe to
//         call multiple times).
//   4. Also creates subject enrollments for the base term itself (step 2b)
//      using the enrollment that already exists.
//
// Returns the total number of StudentSubjectEnrollment rows created/upserted.
// ════════════════════════════════════════════════════════════════════════════

export async function enrollStudentAnnually(
  tx: Prisma.TransactionClient,
  params: {
    studentId:      string;
    streamId:       string;
    classYearId:    string;
    academicYearId: string;
    baseTermId:     string; // The term for which the primary Enrollment was just created
  },
): Promise<number> {
  const { studentId, streamId, classYearId, academicYearId, baseTermId } = params;

  // ── 1. All terms in the academic year ────────────────────────────────────
  const allTerms = await tx.academicTerm.findMany({
    where:   { academicYearId },
    orderBy: { termNumber: "asc" },
    select:  { id: true },
  });

  if (allTerms.length === 0) return 0;

  // ── 2. All COMPULSORY stream-subjects for this stream across all terms ────
  const streamSubjects = await tx.streamSubject.findMany({
    where: {
      streamId,
      termId:      { in: allTerms.map(t => t.id) },
      subjectType: "COMPULSORY",
      isActive:    true,
    },
    select: { id: true, termId: true },
  });

  if (streamSubjects.length === 0) return 0;

  // Group stream-subject ids by termId for fast lookup
  const ssByTerm = new Map<string, string[]>();
  for (const ss of streamSubjects) {
    const list = ssByTerm.get(ss.termId) ?? [];
    list.push(ss.id);
    ssByTerm.set(ss.termId, list);
  }

  let totalCreated = 0;

  // ── 3. Per-term: ensure Enrollment + create StudentSubjectEnrollments ─────
  for (const { id: termId } of allTerms) {
    const subjectIds = ssByTerm.get(termId);
    if (!subjectIds || subjectIds.length === 0) continue; // term not configured yet

    let enrollmentId: string;

    if (termId === baseTermId) {
      // The primary enrollment was just created — find it (it MUST exist)
      const existing = await tx.enrollment.findFirst({
        where:  { studentId, termId },
        select: { id: true },
      });
      if (!existing) continue; // safety guard — should never happen
      enrollmentId = existing.id;
    } else {
      // Find or create the Enrollment for this term
      const existing = await tx.enrollment.findFirst({
        where:  { studentId, termId },
        select: { id: true },
      });

      if (existing) {
        enrollmentId = existing.id;
      } else {
        const created = await tx.enrollment.create({
          data: {
            studentId,
            classYearId,
            streamId,
            academicYearId,
            termId,
            status:         EnrollmentStatus.ACTIVE,
            enrollmentType: EnrollmentType.CONTINUING,
          },
        });
        enrollmentId = created.id;
      }
    }

    // Create subject enrollments — skipDuplicates makes this idempotent
    await tx.studentSubjectEnrollment.createMany({
      data: subjectIds.map(streamSubjectId => ({
        enrollmentId,
        streamSubjectId,
        status:         SubjectEnrollmentStatus.ACTIVE,
        isCompulsory:   true,
        isAutoEnrolled: true,
      })),
      skipDuplicates: true,
    });

    totalCreated += subjectIds.length;
  }

  return totalCreated;
}
