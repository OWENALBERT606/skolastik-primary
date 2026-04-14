// DOS Staff Attendance page — mirrors admin attendance page but under DOS route
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/prisma/db";
import AttendanceClient from "@/app/(school)/school/[slug]/staff/components/attendance-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DOSAttendancePage({ params }: Props) {
  const { slug } = await params;

  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!school) notFound();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    }>
      <AttendanceClient schoolId={school.id} schoolName={school.name} slug={slug} />
    </Suspense>
  );
}
