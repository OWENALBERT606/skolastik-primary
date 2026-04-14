// app/(school)/school/[slug]/settings/profile/page.tsx
import { redirect }             from "next/navigation";
import { db }                   from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import ProfileSettingsClient    from "./components/profile-settings-client";

export default async function ProfileSettingsPage({
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
    select: {
      id: true, name: true, motto: true, slug: true, code: true,
      address: true, contact: true, contact2: true, contact3: true,
      email: true, email2: true, website: true, logo: true,
    },
  });
  if (!school) redirect("/login");

  return (
    <ProfileSettingsClient
      school={school}
      slug={slug}
    />
  );
}
