// app/(school)/school/[slug]/academics/classes/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { db } from "@/prisma/db";
import { getClassTemplatesBySchool, getClassYearsBySchool } from "@/actions/classes";
import { ClassesList } from "./components/classes-list";
import { getAuthenticatedUser } from "@/config/useAuth";

export default async function ClassesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ yearId?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const userData = await getAuthenticatedUser();
  const userId = userData?.id;
  if (!userId) redirect("/login");

  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, slug: true },
  });
  if (!school) redirect("/login");

  const schoolId   = school.id;
  const schoolSlug = school.slug;

  // Get active academic year
  const activeAcademicYear = await db.academicYear.findFirst({
    where: {
      schoolId,
      isActive: true,
    },
    include: {
      terms: {
        orderBy: { termNumber: "asc" },
      },
    },
  });

  if (!activeAcademicYear) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-400">
            Please create an academic year first before managing classes.
          </p>
        </div>
      </div>
    );
  }

  // Get all academic years for filter
  const academicYears = await db.academicYear.findMany({
    where: { schoolId },
    orderBy: { year: "desc" },
    include: {
      terms: {
        orderBy: { termNumber: "asc" },
      },
    },
  });

  const selectedYearId = resolvedSearchParams.yearId || activeAcademicYear.id;

  // Get class templates and class years
  const [classTemplates, classYears] = await Promise.all([
    getClassTemplatesBySchool(schoolId),
    getClassYearsBySchool(schoolId, selectedYearId),
  ]);

  // Get available teachers for class teacher assignment
  const teachers = await db.teacher.findMany({
    where: {
      schoolId,
      // status: "ACTIVE",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      staffNo: true,
    },
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
          schoolSlug={schoolSlug}
          userId={userId}
        />
      </Suspense>
    </div>
  );
}

function ClassesListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 max-w-md"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}