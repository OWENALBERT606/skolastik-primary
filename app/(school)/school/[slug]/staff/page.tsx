// app/school/[slug]/staff/page.tsx
// ─── SERVER COMPONENT — resolves URL slug → real school DB id ─────────────────
// This file must NOT have "use client". Move all the interactive UI
// (the big component from page.tsx) into ./_components/StaffClient.tsx

import { notFound } from "next/navigation";
import { db } from "@/prisma/db";
import StaffClient from "./components/staff-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StaffPage({ params }: Props) {
    const { slug } = await params;

  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!school) notFound();

  return <StaffClient slug={slug} schoolId={school.id} schoolName={school.name} />;
}