// DOS Academic Terms page — mirrors admin terms page but under DOS route
import { Suspense } from "react";
import { getAcademicTermsWithStats } from "@/actions/terms";
import AcademicTermsList from "@/app/(school)/school/[slug]/academics/terms/components/academic-terms-list";
import { db } from "@/prisma/db";
import { notFound } from "next/navigation";

export default async function DOSAcademicTermsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) notFound();

  const result = await getAcademicTermsWithStats(school.id);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Academic Terms</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage academic terms for all academic years</p>
        </div>
      </div>
      <Suspense fallback={<AcademicTermsListSkeleton />}>
        {result.ok ? (
          <AcademicTermsList initialData={result.data} schoolId={school.id} />
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400">{result.error}</p>
          </div>
        )}
      </Suspense>
    </div>
  );
}

function AcademicTermsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}
