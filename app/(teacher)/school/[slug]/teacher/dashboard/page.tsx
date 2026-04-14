import { getAuthenticatedUser }        from "@/config/useAuth";
import { getTeacherDashboardData }     from "@/actions/teacher-portal";
import { getTeacherCommunications }    from "@/actions/communication-actions";
import TeacherDashboardClient          from "./components/teacher-dashboard-client";
import { db }                          from "@/prisma/db";
import { buildCapabilities }           from "@/lib/utils/capabilities";

export default async function TeacherDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();

  const caps = await buildCapabilities(authUser.id);
  const isDOS = caps.isDOS || caps.isHeadTeacher;

  const [result, commsResult] = await Promise.all([
    getTeacherDashboardData(authUser.id),
    getTeacherCommunications(authUser.id, authUser.school?.id ?? ""),
  ]);

  if (!result.ok || !result.data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="font-semibold text-slate-700 dark:text-slate-300 text-lg">
            Teacher record not found
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Your user account is not linked to a teacher profile. Please contact your school admin.
          </p>
        </div>
      </div>
    );
  }

  const { teacher, subjects, summary, headedStreams } = result.data;
  const comms = commsResult.ok && commsResult.data
    ? {
        ...commsResult.data,
        messages: commsResult.data.messages.map((m: any) => ({
          ...m,
          sentAt:    m.sentAt    ? new Date(m.sentAt).toISOString()    : null,
          createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
        })),
        events: commsResult.data.events.map((e: any) => ({
          ...e,
          startDate: e.startDate ? new Date(e.startDate).toISOString() : null,
          endDate:   e.endDate   ? new Date(e.endDate).toISOString()   : null,
          createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
        })),
        inboxPosts: commsResult.data.inboxPosts.map((p: any) => ({
          ...p,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
        })),
      }
    : { messages: [], events: [], inboxPosts: [], unreadCount: 0 };

  return (
    <TeacherDashboardClient
      teacher={teacher}
      subjects={subjects}
      summary={summary}
      headedStreams={headedStreams}
      slug={slug}
      communications={comms}
      isDOS={isDOS}
      userId={authUser.id}
    />
  );
}