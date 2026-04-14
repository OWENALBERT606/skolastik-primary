// app/(student)/school/[slug]/student/layout.tsx

import * as React from "react";
import { redirect }             from "next/navigation";
import { cookies }              from "next/headers";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import StudentSidebar from "@/components/student/student-sidebar";
import { getSchoolColorStyle }  from "@/lib/utils/school-colors";

export default async function StudentLayout({
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

  if (userData.loginAs !== "student") redirect(`/school/${slug}/teacher/dashboard`);

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
      <StudentSidebar school={school} session={session} />
      <SidebarInset>
        <div className="p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
