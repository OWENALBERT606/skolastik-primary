

import Navbar from "@/components/dashboard/Navbar";
import Sidebar from "@/components/dashboard/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

// Skolastik brand: navy #1e3a6e, gold #e8a020
// These override any school-specific CSS variables that may have been set
const SKOLASTIK_THEME = `
  :root {
    --primary: 218 60% 27%;
    --ring:    218 60% 27%;
    --accent:  38 85% 51%;
    --secondary: 218 40% 93%;
    --secondary-foreground: 218 60% 27%;
  }
  .dark {
    --primary: 218 60% 55%;
    --ring:    218 60% 55%;
    --accent:  38 85% 51%;
    --secondary: 218 30% 16%;
    --secondary-foreground: 218 60% 55%;
  }
`;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  // Non-admin users landing on /dashboard get redirected to their correct portal
  const loginAs = (user as any).loginAs as string | undefined;
  const userId  = (user as any).id as string;

  if (loginAs === "student") {
    const student = await db.student.findFirst({
      where:  { userId },
      select: { school: { select: { slug: true } } },
    });
    if (student?.school?.slug) redirect(`/school/${student.school.slug}/student/dashboard`);
  }

  if (loginAs === "teacher") {
    const teacher = await db.teacher.findFirst({
      where:  { userId },
      select: { school: { select: { slug: true } } },
    });
    if (teacher?.school?.slug) redirect(`/school/${teacher.school.slug}/teacher/dashboard`);
  }

  if (loginAs === "staff") {
    const staff = await db.staff.findFirst({
      where:  { userId },
      select: { schoolId: true },
    });
    if (staff?.schoolId) {
      const school = await db.school.findUnique({ where: { id: staff.schoolId }, select: { slug: true } });
      if (school?.slug) redirect(`/school/${school.slug}/dos/dashboard`);
    }
  }

  return (
    <SidebarProvider>
      {/* Hard-reset to Skolastik brand — prevents school palette bleed */}
      <style dangerouslySetInnerHTML={{ __html: SKOLASTIK_THEME }} />
      <div className="min-h-screen w-full">
        <Sidebar user={user} />
        <div className="md:ml-[220px] lg:ml-[280px]">
          <SidebarInset>
            <Navbar user={user} />
            <div className="p-8">{children}</div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}