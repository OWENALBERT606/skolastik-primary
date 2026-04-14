// DOS Classes page — mirrors admin classes page but under DOS route
import { Suspense } from "react";
import { db } from "@/prisma/db";
import { getClassTemplatesBySchool, getClassYearsBySchool } from "@/actions/classes";
import { ClassesList } from "@/app/(school)/school/[slug]/academics/classes/components/classes-list";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";

export default async function DOSClassesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ yearId?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const authUser = await getAuthenticatedUser();

  const school = await db.school.findUnique({ where: { slug }, select: { id: true, slug: true } });
  if (!school) notFound();

  const schoolId = school.id;

  const activeAcademicYear = await db.academicYear.findFirst({
    where: { schoolId, isActive: true },
    include: { terms: { orderBy: { termNumber: "asc" } } },
  });

  if (!activeAcademicYear) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-400">Please create an academic year first before managing classes.</p>
        </div>
      </div>
    );
  }

  const academicYears = await db.academicYear.findMany({
    where: { schoolId },
    orderBy: { year: "desc" },
    include: { terms: { orderBy: { termNumber: "asc" } } },
  });

  const selectedYearId = sp.yearId || activeAcademicYear.id;

  const [classTemplates, classYears] = await Promise.all([
    getClassTemplatesBySchool(schoolId),
    getClassYearsBySchool(schoolId, selectedYearId),
  ]);

  const teachers = await db.teacher.findMany({
    where: { schoolId },
    select: { id: true, firstName: true, lastName: true, staffNo: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <Suspense fallback={<ClassesListSkeleton />}>
        <ClassesList
          classTemplates={classTemplates}
          classYears={classYears}
          academicYears={academicYears}
          activeAcademicYear={activeAcademicYear}
          selectedYearId={selectedYearId}
          teachers={teachers}
          schoolId={schoolId}
          schoolSlug={school.slug}
          userId={authUser.id}
        />
      </Suspense>
    </div>
  );
}

function ClassesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
