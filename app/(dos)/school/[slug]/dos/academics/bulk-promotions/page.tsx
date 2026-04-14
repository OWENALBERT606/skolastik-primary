// app/(dos)/school/[slug]/dos/academics/bulk-promotions/page.tsx
import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import { notFound }             from "next/navigation";
import BulkPromotionsClient     from "./components/bulk-promotions-client";

export default async function BulkPromotionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug }   = await params;
  const authUser   = await getAuthenticatedUser();

  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, name: true },
  });
  if (!school) notFound();

  // All academic years with their terms — for source + destination selectors
  const allYears = await db.academicYear.findMany({
    where:   { schoolId: school.id },
    include: { terms: { orderBy: { termNumber: "asc" } } },
    orderBy: { year: "desc" },
  });
  if (!allYears.length) notFound();

  const years = allYears.map(y => ({
    id:       y.id,
    year:     y.year,
    isActive: y.isActive,
    terms: y.terms.map(t => ({
      id:         t.id,
      name:       t.name,
      termNumber: t.termNumber,
      isActive:   t.isActive,
    })),
  }));

  return (
    <div className="p-6">
      <BulkPromotionsClient
        years={years}
        schoolId={school.id}
        schoolName={school.name}
        slug={slug}
        userId={authUser.id}
      />
    </div>
  );
}
