// ─── SERVER PAGE ─────────────────────────────────────────────────────────────
// app/(school)/school/[slug]/staff/offboarding/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import OffboardingClient from "../components/offboarding-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OffboardingPage({ params }: Props) {
  const { slug } = await params;

  const user = await getAuthenticatedUser();
  if (!user) notFound();

  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!school) notFound();

  return (
    <Suspense fallback={null}>
      <OffboardingClient
        slug={slug}
        schoolId={school.id}
        schoolName={school.name}
      />
    </Suspense>
  );
}