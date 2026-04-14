// app/(school)/school/[slug]/staff/[staffId]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/prisma/db";
import StaffDetailClient from "../components/staff-detail-client";

interface Props {
  params: Promise<{ slug: string; staffId: string }>;
}

export default async function StaffDetailPage({ params }: Props) {
  const { slug, staffId } = await params;

  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!school) notFound();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#080c10] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <StaffDetailClient
        schoolId={school.id}
        schoolName={school.name}
        slug={slug}
        staffId={staffId}
      />
    </Suspense>
  );
}