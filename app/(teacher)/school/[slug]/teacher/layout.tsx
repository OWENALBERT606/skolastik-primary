import * as React from "react";
import type { Metadata } from "next";
import { redirect }             from "next/navigation";
import { cookies }              from "next/headers";
import { getAuthenticatedUser } from "@/config/useAuth";
import { buildCapabilities }    from "@/lib/utils/capabilities";
import { db }                   from "@/prisma/db";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TeacherSidebar from "@/components/teacher/teacher-sidebar";
import TeacherNav     from "@/components/teacher/teacher-nav";
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
    title: `Teacher Portal — ${school?.name ?? "School"}`,
    description: `Teacher portal for ${school?.name ?? "school"} — mark entry, timetables, and student management.`,
    path: `/school/${slug}/teacher`,
    noIndex: true,
  });
}

export default async function TeacherLayout({
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

  // loginAs is the primary gate — STF logins belong in the DOS/staff portal
  if (userData.loginAs === "staff") redirect(`/school/${slug}/dos/dashboard`);

  // Use capabilities — single DB query covers everything
  const caps = await buildCapabilities(userData.id);

  if (!caps.isTeacher) redirect("/login");
  if (!caps.school || caps.school.slug !== slug) redirect("/login");

  // Check if this teacher is a class head for any stream
  const teacherRecord = caps.school
    ? await db.teacher.findFirst({
        where:  { userId: userData.id, schoolId: caps.school.id },
        select: { id: true },
      })
    : null;

  const [unreadCount, colorStyle, isClassHead] = await Promise.all([
    db.systemMessagePost.count({ where: { userId: userData.id, isRead: false } }),
    caps.school ? getSchoolColorStyle(caps.school.id) : null,
    teacherRecord
      ? db.stream.count({
          where: {
            classHeadId: teacherRecord.id,
            classYear: { academicYear: { isActive: true } },
          },
        }).then(c => c > 0)
      : Promise.resolve(false),
  ]);

  const session = {
    id:    userData.id,
    name:  userData.name ?? "",
    email: userData.email ?? "",
    image: userData.image ?? null,
    isDOS: caps.isDOS,
  };

  return (
    <SidebarProvider>
      {colorStyle && <style dangerouslySetInnerHTML={{ __html: colorStyle }} />}
      <TeacherSidebar school={caps.school} session={session} unreadCount={unreadCount} isClassHead={isClassHead} />
      <SidebarInset>
        <TeacherNav session={session} slug={slug} caps={caps} />
        <div className="p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
