import * as React from "react";
import type { Metadata } from "next";
import { redirect }             from "next/navigation";
import { cookies }              from "next/headers";
import { getAuthenticatedUser } from "@/config/useAuth";
import { buildCapabilities }    from "@/lib/utils/capabilities";
import { db }                   from "@/prisma/db";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DOSSidebar from "@/components/dos/dos-sidebar";
import DOSNav     from "@/components/dos/dos-nav";
import { getSchoolColorStyle }  from "@/lib/utils/school-colors";
import { buildMetadata }        from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = await db.school.findUnique({ where: { slug }, select: { name: true } });
  return buildMetadata({
    title: `DOS Portal — ${school?.name ?? "School"}`,
    description: `Director of Studies portal for ${school?.name ?? "school"} — academics, approvals, and report cards.`,
    path: `/school/${slug}/dos`,
    noIndex: true,
  });
}

export default async function DOSLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  await cookies();
  const { slug } = await params;

  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  // loginAs is the primary gate — TCH logins belong in the teacher portal
  if (userData.loginAs === "teacher") redirect(`/school/${slug}/teacher/dashboard`);

  const caps = await buildCapabilities(userData.id);

  if (!caps.school || caps.school.slug !== slug) redirect("/login");

  const [unreadCount, colorStyle] = await Promise.all([
    db.systemMessagePost.count({ where: { userId: userData.id, isRead: false } }),
    caps.school ? getSchoolColorStyle(caps.school.id) : null,
  ]);

  const session = {
    id:             userData.id,
    name:           userData.name ?? "",
    email:          userData.email ?? "",
    image:          userData.image ?? null,
    hasTeacherRole: caps.isTeacher,
  };

  return (
    <SidebarProvider>
      {colorStyle && <style dangerouslySetInnerHTML={{ __html: colorStyle }} />}
      <DOSSidebar school={caps.school} session={session} unreadCount={unreadCount} />
      <SidebarInset>
        <DOSNav session={session} slug={slug} caps={caps} />
        <div className="p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
