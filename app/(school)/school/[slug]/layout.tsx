
import * as React from "react";
import type { Metadata } from "next";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import SchoolSidebar      from "@/components/school/school-sidebar";
import SchoolDashboardNav from "@/components/school/school-dashboard-nav";
import { redirect }       from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { cookies }              from "next/headers";
import { db }                   from "@/prisma/db";
import { getSchoolColorStyle }  from "@/lib/utils/school-colors";
import { buildMetadata }        from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = await db.school.findUnique({
    where:  { slug },
    select: { name: true, logo: true },
  });
  return buildMetadata({
    title: school?.name ?? "School Portal",
    description: `${school?.name ?? "School"} management portal — powered by Skolastik.`,
    path: `/school/${slug}`,
    noIndex: true,
  });
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  await cookies(); // ensure cookies are readable before session calls

  const { slug } = await params;
  const userData = await getAuthenticatedUser();
  const userId   = userData?.id;
  let   role     = userData?.roles?.[0]?.roleName ?? "";

  // Always resolve the true role from DB for teacher/DOS users,
  // since JWT may only carry "teacher" even for DOS-assigned staff.
  // We also need to know which portal they're currently in (path-based).
  const isAdminRole = role === "schooladmin" || role === "school_admin" || role === "admin" || role === "super_admin";

  if (!isAdminRole) {
    const teacherRecord = await db.teacher.findUnique({
      where:  { userId },
      select: { id: true, staffId: true },
    });
    if (teacherRecord) {
      // Check if they have a DOS staff role
      let hasDOS = false;
      if (teacherRecord.staffId) {
        const dosRole = await db.staffRole.findFirst({
          where: { staffId: teacherRecord.staffId, isActive: true, roleDefinition: { code: "DOS" } },
        });
        hasDOS = !!dosRole;
      }
      // Use path to determine which portal context we're in
      // If they're on a DOS path, show DOS sidebar; otherwise teacher
      role = hasDOS ? "dos" : "teacher";
    } else if (!isAdminRole) {
      redirect("/login");
    }
  }

  // Resolve school by slug — safe for all roles.
  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, name: true, slug: true, logo: true, motto: true, address: true, email: true, primaryColor: true, accentColor: true },
  });

  if (!school) {
    // No school found — show a clear error rather than crashing
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-sm">
          <p className="font-semibold text-slate-700 dark:text-slate-300 text-lg">No school found</p>
          <p className="text-sm text-slate-400 mt-2">
            Your account is not linked to a school. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // Always pass the DB-resolved role to the sidebar, not the stale JWT role.
  const sessionWithRole = {
    ...userData,
    roles: [{ roleName: role }],
  };

  const colorStyle = await getSchoolColorStyle(school.id);

  return (
    <SidebarProvider>
      {colorStyle && <style dangerouslySetInnerHTML={{ __html: colorStyle }} />}
      <SchoolSidebar school={school} session={sessionWithRole} />
      <SidebarInset>
        <SchoolDashboardNav session={sessionWithRole} slug={slug} />
        <div className="p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}