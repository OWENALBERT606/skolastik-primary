// DOS Report Cards page — mirrors admin report-cards page but under DOS route
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import { notFound } from "next/navigation";
import ReportCardsClient from "@/app/(school)/school/[slug]/academics/report-cards/components/report-cards-client";

export default async function DOSReportCardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();

  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true, name: true, motto: true, logo: true, address: true, contact: true, contact2: true, email: true, email2: true },
  });
  if (!school) notFound();

  const schoolId = school.id;

  // All academic years + their terms
  const allYears = await db.academicYear.findMany({
    where:   { schoolId },
    include: { terms: { orderBy: { termNumber: "asc" } } },
    orderBy: { year: "desc" },
  });

  if (!allYears.length) notFound();

  const activeYear = allYears.find(y => y.isActive) ?? allYears[0];
  const activeTerm = activeYear.terms.find(t => t.isActive) ?? activeYear.terms[0];
  if (!activeTerm) notFound();

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

  const streamData = streams.map(s => ({
    streamId:       s.id,
    streamName:     s.name,
    className:      s.classYear.classTemplate.name,
    classLevel:     s.classYear.classLevel,
    academicYearId: s.classYear.academicYear.id,
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
        school={{ name: school.name, motto: school.motto, logo: school.logo, address: school.address, contact: school.contact, contact2: school.contact2, email: school.email, email2: school.email2 }}
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
