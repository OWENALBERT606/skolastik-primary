// app/(school)/school/[slug]/staff/leave/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/prisma/db";
import LeaveClient from "../components/leave-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LeavePage({ params }: Props) {
  const { slug } = await params;

  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!school) notFound();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080c10] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
      </div>
    }>
      <LeaveClient schoolId={school.id} schoolName={school.name} slug={slug} />
    </Suspense>
  );
}