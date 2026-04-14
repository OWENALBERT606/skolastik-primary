// DOS Teachers page — mirrors admin teachers page but under DOS route
import { db } from "@/prisma/db";
import TeachersListClient from "@/app/(school)/school/[slug]/users/teachers/components/teacher-list-client";
import { getTeachersBySchoolEnhanced } from "@/actions/teachers";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";

export default async function DOSTeachersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();

  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) notFound();
  const schoolId = school.id;

  const academicYears = await db.academicYear.findMany({
    where: { schoolId },
    orderBy: { year: "desc" },
  });

  const currentYear = academicYears.find(y => y.isActive) || academicYears[0];
  const teachers = await getTeachersBySchoolEnhanced(schoolId, currentYear?.id);

  return (
    <div className="p-6">
      <TeachersListClient
        teachers={teachers}
        academicYears={academicYears}
        currentYear={currentYear}
        schoolId={schoolId}
        slug={slug}
        userId={authUser.id}
        hideAddTeacher
        detailLinkPrefix={`/school/${slug}/dos/teachers`}
      />
    </div>
  );
}
