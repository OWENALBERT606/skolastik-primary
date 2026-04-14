import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect }             from "next/navigation";
import { buildCapabilities }    from "@/lib/utils/capabilities";
import PortalSelectClient       from "./portal-select-client";

export default async function PortalSelectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug }  = await params;
  const authUser  = await getAuthenticatedUser();
  const caps      = await buildCapabilities(authUser.id);

  const hasElevatedRole = caps.isDOS || caps.isHeadTeacher || caps.isDeputy;

  // Bursar-only (no teaching) — go straight to bursar portal
  if (caps.isBursar && !caps.isTeacher && !hasElevatedRole) {
    redirect(`/school/${slug}/bursar/dashboard`);
  }

  // Pure teacher with no elevated role — nothing to choose, go straight in
  if (caps.isTeacher && !hasElevatedRole && !caps.isBursar) {
    redirect(`/school/${slug}/teacher/dashboard`);
  }

  // No teacher record AND no elevated role AND no bursar — not a portal user
  if (!caps.isTeacher && !hasElevatedRole && !caps.isBursar) {
    redirect(`/school/${slug}/teacher/dashboard`);
  }

  // Only elevated role, no teaching, no bursar — skip selector, go to DOS
  if (!caps.isTeacher && hasElevatedRole && !caps.isBursar) {
    redirect(`/school/${slug}/dos/dashboard`);
  }

  // Has multiple portals — show the selector
  const firstName = authUser.name?.split(" ")[0] ?? "there";

  return (
    <PortalSelectClient
      firstName={firstName}
      slug={slug}
      isDOS={caps.isDOS}
      isHeadTeacher={caps.isHeadTeacher}
      isDeputy={caps.isDeputy}
      isBursar={caps.isBursar}
      isTeacher={caps.isTeacher}
    />
  );
}
