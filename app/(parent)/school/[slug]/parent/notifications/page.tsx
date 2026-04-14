import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { Bell } from "lucide-react";

export default async function ParentNotificationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();
  if (!authUser?.id) redirect("/login");

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-indigo-500" /> Notifications
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">School notices and announcements</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">No new notifications</p>
        <p className="text-sm text-slate-400 mt-1">Check back later for school announcements</p>
      </div>
    </div>
  );
}
