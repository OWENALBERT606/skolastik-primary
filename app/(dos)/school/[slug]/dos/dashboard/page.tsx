import { getAuthenticatedUser } from "@/config/useAuth";
import { getDOSDashboardData } from "@/actions/dos-portal";
import { redirect } from "next/navigation";
import DOSDashboardClient from "./components/dos-dashboard-client";
import { db } from "@/prisma/db";
import { buildCapabilities } from "@/lib/utils/capabilities";

export default async function DOSDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();
  if (!authUser?.id) redirect("/login");

  const caps = await buildCapabilities(authUser.id);
  if (!caps.isDOS && !caps.isHeadTeacher) redirect(`/school/${slug}/teacher/dashboard`);

  const result = await getDOSDashboardData(authUser.id);
  if (!result.ok || !result.data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <p className="text-slate-500 dark:text-slate-400">{result.message ?? "Failed to load DOS dashboard"}</p>
      </div>
    );
  }

  const { teacher: teacherData, summary, streams, streamSubjects, unassignedSubjects, teachers, activeTerm } = result.data;

  const hasTeachingSubjects = await db.streamSubjectTeacher.count({
    where: { teacher: { userId: authUser.id }, status: "ACTIVE" },
  }) > 0;

  return (
    <DOSDashboardClient
      teacher={teacherData}
      summary={summary}
      streams={streams}
      streamSubjects={streamSubjects}
      unassignedSubjects={unassignedSubjects}
      teachers={teachers}
      activeTerm={activeTerm}
      slug={slug}
      hasTeachingSubjects={hasTeachingSubjects}
    />
  );
}
