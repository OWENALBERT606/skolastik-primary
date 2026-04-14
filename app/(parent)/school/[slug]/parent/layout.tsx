import * as React from "react";
import { redirect }             from "next/navigation";
import { cookies }              from "next/headers";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ParentSidebar from "@/components/parent/parent-sidebar";
import ParentNav     from "@/components/parent/parent-nav";
import { getSchoolColorStyle }  from "@/lib/utils/school-colors";

export default async function ParentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params:   Promise<{ slug: string }>;
}) {
  await cookies();
  const { slug } = await params;

  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, name: true, slug: true, logo: true },
  });
  if (!school) redirect("/login");

  const colorStyle = await getSchoolColorStyle(school.id);

  const session = {
    id:    userData.id,
    name:  userData.name  ?? "",
    email: userData.email ?? "",
    image: userData.image ?? null,
  };

  return (
    <SidebarProvider>
      {colorStyle && <style dangerouslySetInnerHTML={{ __html: colorStyle }} />}
      <ParentSidebar school={school} session={session} />
      <SidebarInset>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <ParentNav session={session} schoolName={school.name} />
          <div className="p-3 sm:p-4 md:p-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
