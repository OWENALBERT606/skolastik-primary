// app/school/[slug]/academics/report-cards/page.tsx
import { getAuthenticatedUser }   from "@/config/useAuth";
import { db }                     from "@/prisma/db";
import { notFound, redirect }     from "next/navigation";
import ReportCardsClient from "./components/report-cards-client";

export default async function ReportCardsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug }   = await params;
  const authUser   = await getAuthenticatedUser();

  // Resolve schoolId — always use slug as source of truth
  const schoolRecord = await db.school.findUnique({
    where:  { slug },
    select: { id: true },
  });
  if (!schoolRecord) notFound();
  let schoolId = schoolRecord.id;

  // For teacher/DOS users, verify they belong to this school
  const role = authUser.roles?.[0]?.roleName ?? "";
  const isAdmin = ["schooladmin","school_admin","admin","super_admin"].includes(role);
  if (!isAdmin) {
    const teacher = await db.teacher.findUnique({
      where:  { userId: authUser.id },
      select: { schoolId: true, staffId: true },
    });
    if (!teacher?.schoolId) notFound();

    let hasDOS = false;
    if (teacher.staffId) {
      const dosRole = await db.staffRole.findFirst({
        where: { staffId: teacher.staffId, isActive: true, roleDefinition: { code: "DOS" } },
      });
      hasDOS = !!dosRole;
    }
    if (!hasDOS) redirect(`/school/${slug}/teacher/dashboard`);
    schoolId = teacher.schoolId;
  }

  // All academic years + their terms
  const allYears = await db.academicYear.findMany({
    where:   { schoolId },
    include: { terms: { orderBy: { termNumber: "asc" } } },
    orderBy: { year: "desc" },
  });

  if (!allYears.length) notFound();

  // Default to active year/term, fall back to most recent
  const activeYear = allYears.find(y => y.isActive) ?? allYears[0];
  const activeTerm = activeYear.terms.find(t => t.isActive) ?? activeYear.terms[0];
  if (!activeTerm) notFound();

  // All streams across all years, with enrollment counts per term
  // We fetch all terms across all years so the client can filter
  const allTermIds = allYears.flatMap(y => y.terms.map(t => t.id));

  const streams = await db.stream.findMany({
    where: { schoolId },
    include: {
      classYear: {
        include: {
          classTemplate: { select: { name: true, level: true } },
          academicYear:  { select: { id: true, year: true } },
        },
      },
      enrollments: {
        where: { termId: { in: allTermIds } },
        select: {
          termId:     true,
          status:     true,
          reportCard: { select: { id: true, isPublished: true, generatedAt: true } },
        },
      },
    },
    orderBy: [
      { classYear: { classTemplate: { level: "asc" } } },
      { name: "asc" },
    ],
  });

  const school = await db.school.findUnique({
    where:  { id: schoolId },
    select: { name: true, motto: true, logo: true, address: true, contact: true, contact2: true, email: true, email2: true },
  });

  // Build stream data with per-term enrollment counts
  const streamData = streams.map(s => ({
    streamId:      s.id,
    streamName:    s.name,
    className:     s.classYear.classTemplate.name,
    classLevel:    s.classYear.classLevel,
    academicYearId: s.classYear.academicYear.id,
    // enrollmentsByTerm[termId] = { total, withReports, published }
    enrollmentsByTerm: Object.fromEntries(
      allTermIds.map(termId => {
        const enrs = s.enrollments.filter(e => e.termId === termId);
        return [termId, {
          total:       enrs.length,
          withReports: enrs.filter(e => e.reportCard).length,
          published:   enrs.filter(e => e.reportCard?.isPublished).length,
        }];
      })
    ),
  }));

  // Serialise years for the client selector
  const yearsData = allYears.map(y => ({
    id:       y.id,
    year:     y.year,
    isActive: y.isActive,
    terms:    y.terms.map(t => ({
      id:         t.id,
      name:       t.name,
      termNumber: t.termNumber,
      isActive:   t.isActive,
    })),
  }));

  return (
    <div className="p-6">
      <ReportCardsClient
        streams={streamData}
        school={school}
        years={yearsData}
        defaultYearId={activeYear.id}
        defaultTermId={activeTerm.id}
        schoolId={schoolId}
        slug={slug}
        approverId={authUser.id}
      />
    </div>
  );
}
