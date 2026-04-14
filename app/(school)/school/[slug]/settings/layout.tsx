// app/(school)/school/[slug]/settings/layout.tsx
import { redirect } from "next/navigation";
import { db }       from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import { Settings }             from "lucide-react";
import SettingsTabNav           from "./components/settings-tab-nav";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userData = await getAuthenticatedUser();
  const role     = userData?.roles?.[0]?.roleName ?? "";

  // Block teacher / DOS — they have no access to school settings
  const isNonAdmin = role === "teacher" || role === "dos" || role === "director_of_studies";
  if (isNonAdmin) redirect(`/school/${slug}/dashboard`);

  // Resolve school by slug — the URL already proves the user is in this school's portal
  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, name: true },
  });
  if (!school) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">School Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{school.name}</p>
        </div>
      </div>

      {/* Tab navigation */}
      <SettingsTabNav slug={slug} />

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
