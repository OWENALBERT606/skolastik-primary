import { getAuthenticatedUser }  from "@/config/useAuth";
import { redirect }              from "next/navigation";
import MarksApprovalsClient      from "./components/marks-approvals-client";
import { getMarksApprovalsData } from "@/actions/marks-approval";
import { db }                    from "@/prisma/db";

export default async function MarksApprovalsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();
  if (!authUser?.id) redirect("/login");

  // Resolve schoolId from slug (most reliable)
  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true },
  });
  if (!school) redirect("/login");

  const schoolId = school.id;
  const result   = await getMarksApprovalsData(schoolId);

  // Show empty state instead of 404 when no active year/term
  if (!result.ok || !result.data) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marks Approvals</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Review and approve submitted exam marks
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {result.message ?? "No active academic year or term found."}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Set an active academic year and term to enable mark approvals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <MarksApprovalsClient
        data={result.data}
        approverId={authUser.id}
        schoolId={schoolId}
        slug={slug}
      />
    </div>
  );
}
