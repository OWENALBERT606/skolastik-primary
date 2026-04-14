

// app/school/[slug]/users/teachers/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import { redirect } from "next/navigation";
import { db } from "@/prisma/db";
import TeachersListClient from "./components/teacher-list-client";
import { getTeachersBySchoolEnhanced } from "@/actions/teachers";
import { Session } from "next-auth";

export default async function TeachersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions) as Session | null;
  const schoolId = session?.user?.school?.id;
  const userId = session?.user?.id;
  const { slug } = await params;

  if (!schoolId || !slug || !userId) {
    redirect("/login");
  }

  // Get all academic years
  const academicYears = await db.academicYear.findMany({
    where: { schoolId },
    orderBy: { year: "desc" },
  });

  // Get current academic year
  const currentYear = academicYears.find((year) => year.isActive) || academicYears[0];

  // Get teachers with enhanced data
  const teachers = await getTeachersBySchoolEnhanced(schoolId, currentYear?.id);

  return (
    <div className="p-6">
      <TeachersListClient
        teachers={teachers}
        academicYears={academicYears}
        currentYear={currentYear}
        schoolId={schoolId}
        slug={slug}
        userId={userId}
      />
    </div>
  );
}