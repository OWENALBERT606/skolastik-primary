import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import ParentDashboardClient    from "./parent-dashboard-client";

export default async function ParentDashboardPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();
  if (!authUser?.id) redirect("/login");

  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, name: true, slug: true, logo: true },
  });
  if (!school) redirect("/login");

  return <ParentDashboardClient slug={slug} schoolId={school.id} />;
}
