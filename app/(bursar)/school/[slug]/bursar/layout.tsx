import * as React from "react";
import type { Metadata } from "next";
import { redirect }             from "next/navigation";
import { cookies }              from "next/headers";
import { getAuthenticatedUser } from "@/config/useAuth";
import { buildCapabilities }    from "@/lib/utils/capabilities";
import { db }                   from "@/prisma/db";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import BursarSidebar           from "@/components/bursar/bursar-sidebar";
import BursarNav               from "@/components/bursar/bursar-nav";
import { getSchoolColorStyle } from "@/lib/utils/school-colors";
import { buildMetadata }       from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = await db.school.findUnique({ where: { slug }, select: { name: true } });
  return buildMetadata({
    title: `Bursar Portal — ${school?.name ?? "School"}`,
    description: `Bursar portal for ${school?.name ?? "school"} — fees, invoices, payments, and financial management.`,
    path: `/school/${slug}/bursar`,
    noIndex: true,
  });
}

export default async function BursarLayout({
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

  const caps = await buildCapabilities(userData.id);

  // Only bursars / accountants / finance officers may access this portal
  if (!caps.isBursar) redirect("/login");

  // Ensure the school in the URL matches this user's school
  if (!caps.school || caps.school.slug !== slug) redirect("/login");

  const [unreadCount, colorStyle] = await Promise.all([
    db.systemMessagePost.count({ where: { userId: userData.id, isRead: false } }),
    getSchoolColorStyle(caps.school.id),
  ]);

  const session = {
    id:    userData.id,
    name:  userData.name  ?? "",
    email: userData.email ?? "",
    image: userData.image ?? null,
  };

  return (
    <SidebarProvider>
      {colorStyle && <style dangerouslySetInnerHTML={{ __html: colorStyle }} />}
      <BursarSidebar school={caps.school} session={session} unreadCount={unreadCount} />
      <SidebarInset>
        <BursarNav session={session} slug={slug} />
        <div className="p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
