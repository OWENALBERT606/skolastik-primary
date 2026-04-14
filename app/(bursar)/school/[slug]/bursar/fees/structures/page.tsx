import { redirect } from "next/navigation";
import { db }       from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import FeeStructuresClient from "@/app/(school)/school/[slug]/finance/fees/structures/components/feestructureClient";

export default async function BursarFeeStructuresPage({
  params,
  searchParams,
}: {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ yearId?: string; termId?: string }>;
}) {
  const { slug }           = await params;
  const { yearId, termId } = await searchParams;
  const userData           = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) redirect("/login");
  const schoolId = school.id;

  const allYears = await db.academicYear.findMany({
    where:   { schoolId },
    include: { terms: { orderBy: { termNumber: "asc" } } },
    orderBy: { year: "desc" },
  });
  if (!allYears.length) redirect(`/school/${slug}/bursar/fees`);

  const activeYear   = allYears.find(y => y.isActive) ?? allYears[0];
  const selectedYear = allYears.find(y => y.id === yearId) ?? activeYear;
  const selectedTerm = selectedYear.terms.find(t => t.id === termId)
    ?? selectedYear.terms.find(t => t.isActive)
    ?? selectedYear.terms[0];

  const structures = await db.feeStructure.findMany({
    where:   { schoolId, academicYearId: selectedYear.id },
    orderBy: [{ term: { termNumber: "asc" } }, { isPublished: "desc" }, { createdAt: "desc" }],
    include: {
      items: {
        include: { feeCategory: { select: { id: true, name: true, code: true } } },
        orderBy: { feeCategory: { name: "asc" } },
      },
      term:     { select: { id: true, name: true, termNumber: true } },
      classYear: { select: { id: true, classTemplate: { select: { id: true, name: true, code: true } } } },
      _count: { select: { invoices: true } },
    },
  });

  const feeCategories = await db.feeCategory.findMany({
    where:   { schoolId, isActive: true },
    orderBy: { name: "asc" },
    select:  { id: true, name: true, code: true },
  });

  const classYears = await db.classYear.findMany({
    where:   { academicYearId: selectedYear.id },
    include: { classTemplate: { select: { id: true, name: true, code: true } } },
    orderBy: { classTemplate: { level: "asc" } },
  });

  return (
    <div className="p-6">
      <FeeStructuresClient
        initialStructures={structures as any}
        feeCategories={feeCategories}
        classYears={classYears.map(cy => ({
          id:             cy.id,
          name:           cy.classTemplate.name,
          academicYearId: cy.academicYearId,
        }))}
        allYears={allYears.map(y => ({
          id:       y.id,
          year:     y.year,
          isActive: y.isActive,
          terms:    y.terms.map(t => ({
            id:             t.id,
            name:           t.name,
            termNumber:     t.termNumber,
            isActive:       t.isActive,
            academicYearId: y.id,
          })),
        }))}
        selectedYearId={selectedYear.id}
        selectedTermId={selectedTerm?.id ?? ""}
        schoolId={schoolId}
        slug={slug}
        basePath="bursar"
      />
    </div>
  );
}
