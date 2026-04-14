// app/dashboard/academic-years/page.tsx
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getAcademicYearsWithStats } from "@/actions/years";
import AcademicYearsList from "./components/academic-year-list";
import { getAuthenticatedUser } from "@/config/useAuth";
import { getSchoolsByAdminId } from "@/actions/schools";

export default async function AcademicYearsPage() {
  const userData = await getAuthenticatedUser();
  const userId = userData?.id;
  const schoolData = await getSchoolsByAdminId(userId);
  const schoolId = schoolData.data?.[0].id;

  if (!schoolId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">
            No school found for this user.
          </p>
        </div>
      </div>
    );
  }

  const result = await getAcademicYearsWithStats(schoolId);

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Academic Years
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage academic years and their terms for your school
          </p>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<AcademicYearsListSkeleton />}>
        {result.ok ? (
          <AcademicYearsList 
            initialData={result.data} 
            schoolId={schoolId} 
          />
        ) : (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-300">
              {result.error}
            </p>
          </div>
        )}
      </Suspense>
    </div>
  );
}

function AcademicYearsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 animate-pulse"
        >
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}
