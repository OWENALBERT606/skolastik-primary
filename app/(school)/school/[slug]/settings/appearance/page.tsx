// app/(school)/school/[slug]/settings/appearance/page.tsx
import { redirect }             from "next/navigation";
import { db }                   from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import AppearanceSettingsClient from "./components/appearance-settings-client";

export default async function AppearanceSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug }  = await params;
  const userData  = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  // Resolve school by slug — safe since the layout already verified access
  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, name: true },
  }) as { id: string; name: string; primaryColor?: string | null; accentColor?: string | null } | null;
  if (!school) redirect("/login");

  return (
    <AppearanceSettingsClient
      schoolId={school.id}
      schoolName={school.name}
      initialPrimary={school.primaryColor ?? null}
      initialAccent={school.accentColor   ?? null}
      slug={slug}
    />
  );
}
