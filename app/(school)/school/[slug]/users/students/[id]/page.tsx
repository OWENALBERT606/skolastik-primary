// app/school/[slug]/users/students/[id]/page.tsx
import { redirect } from "next/navigation";
import { db } from "@/prisma/db";
import StudentDetailClient from "../components/student-detail-client";
import { getAuthenticatedUser } from "@/config/useAuth";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const userData = await getAuthenticatedUser();
  const schoolId = userData?.school?.id;
  const userId   = userData?.id;
  if (!schoolId || !slug || !userId) redirect("/login");

  const [student, academicYears, parents, feeAccounts, school, projectWorks] = await Promise.all([
    // ── Student + full academic history ──────────────────────────────────
    db.student.findFirst({
      where: { id, schoolId },
      include: {
        parent: { include: { user: true } },
        school: true,
        user:   true,
        studentBursaries: {
          where: { isActive: true },
          include: { bursary: { select: { id: true, name: true, code: true, percentage: true, fixedAmount: true } } },
        },
        enrollments: {
          include: {
            classYear: {
              include: {
                classTemplate:    true,
                assessmentConfigs: true,
              },
            },
            stream: {
              include: {
                classHead: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
              },
            },
            academicYear: true,
            term:         true,
            subjectEnrollments: {
              include: {
                streamSubject: {
                  include: {
                    subject: true,
                    teacherAssignments: {
                      where:   { status: "ACTIVE" },
                      include: { teacher: { select: { id: true, firstName: true, lastName: true, staffNo: true } } },
                    },
                  },
                },

                examMarks: {
                  include: {
                    exam:      true,
                    enteredBy: { select: { id: true, firstName: true, lastName: true } },
                  },
                  orderBy: { exam: { date: "asc" } },
                },
                subjectResult:   true,
                subjectFinalMark: true,
              },
              orderBy: { streamSubject: { subject: { name: "asc" } } },
            },
            reportCard: true,
            promotedFrom: {
              include: {
                classYear: { include: { classTemplate: true } },
                stream:    true,
                academicYear: true,
                term:      true,
              },
            },
            promotedTo: {
              include: {
                classYear: { include: { classTemplate: true } },
                stream:    true,
                academicYear: true,
                term:      true,
              },
            },
          },
          orderBy: [
            { academicYear: { year: "desc" } },
            { term: { termNumber: "desc" } },
          ],
        },
      },
    }),

    // ── Academic years ────────────────────────────────────────────────────
    db.academicYear.findMany({
      where:   { schoolId },
      include: { terms: { orderBy: { termNumber: "asc" } } },
      orderBy: { year: "desc" },
    }),

    // ── Parents list ──────────────────────────────────────────────────────
    db.parent.findMany({
      where:   { schoolId },
      select:  { id: true, firstName: true, lastName: true, phone: true, email: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),

    // ── Fee accounts (all terms) ──────────────────────────────────────────
    db.studentFeeAccount.findMany({
      where: { studentId: id },
      include: {
        academicYear: true,
        term:         true,
        invoices: {
          include: {
            items: { include: { feeCategory: { select: { id: true, name: true, code: true } } } },
            receipts: true,
          },
          orderBy: { createdAt: "desc" },
        },
        transactions: {
          where:   { isReversal: false },
          include: { receipt: true },
          orderBy: { processedAt: "desc" },
        },
        bursaryAllocations: {
          include: { bursary: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: [
        { academicYear: { year: "desc" } },
        { term: { termNumber: "desc" } },
      ],
    }),

    // ── School info for report card ───────────────────────────────────────
    db.school.findUnique({
      where:  { id: schoolId },
      select: { name: true, motto: true, logo: true, address: true, contact: true },
    }),

    // ── Project works ─────────────────────────────────────────────────────
    db.projectWork.findMany({
      where:   { studentId: id },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  if (!student) redirect(`/school/${slug}/users/students`);

  // Senior 3 and above = O_LEVEL with level >= 3, OR any A_LEVEL class
  const isProjectEligible = student.enrollments.some((e: any) => {
    const cy = e.classYear;
    if (!cy) return false;
    if (cy.classLevel === "A_LEVEL") return true;
    if (cy.classLevel === "O_LEVEL" && (cy.classTemplate?.level ?? 0) >= 3) return true;
    return false;
  });

  // Only teachers (including class heads) may upload project works
  const canUploadProject = userData.loginAs === "teacher";

  // ── Class years for enroll/promote dialogs ────────────────────────────
  const currentYear = academicYears.find(y => y.isActive) ?? academicYears[0];
  const classYearsData = currentYear
    ? await db.classYear.findMany({
        where:   { academicYearId: currentYear.id, isActive: true },
        include: {
          classTemplate: true,
          streams:       { include: { classHead: { select: { id: true, firstName: true, lastName: true } } } },
          assessmentConfigs: true,
        },
        orderBy: { classTemplate: { level: "asc" } },
      })
    : [];

  const classYearsForEnroll  = classYearsData.map(cy => ({ id: cy.id, name: cy.classTemplate.name, academicYearId: cy.academicYearId }));
  const classYearsForPromote = classYearsData.map(cy => ({
    id: cy.id,
    academicYearId: cy.academicYearId,
    classTemplate: { id: cy.classTemplate.id, name: cy.classTemplate.name, code: cy.classTemplate.code },
    streams: cy.streams.map(s => ({ id: s.id, name: s.name })),
  }));

  return (
    <div className="p-6 min-h-screen bg-zinc-50 dark:bg-[#0d1117]">
      <StudentDetailClient
        student={student as any}
        academicYears={academicYears}
        classYearsForEnroll={classYearsForEnroll}
        classYearsForPromote={classYearsForPromote}
        parents={parents}
        gradingScales={[]}
        aoiGradingScales={[]}
        feeAccounts={feeAccounts as any}
        schoolId={schoolId}
        slug={slug}
        userId={userId}
        school={school}
        projectWorks={projectWorks as any}
        isProjectEligible={isProjectEligible}
        canUploadProject={canUploadProject}
      />
    </div>
  );
}
