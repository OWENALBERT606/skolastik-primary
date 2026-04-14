import { getAuthenticatedUser }          from "@/config/useAuth";
import { getClassHeadStream }            from "@/actions/class-teacher";
import { getClassTeacherDashboardData }  from "@/actions/class-teacher";
import { db }                            from "@/prisma/db";
import { notFound, redirect }            from "next/navigation";
import ClassTeacherDashboardClient       from "./components/class-teacher-dashboard-client";

export default async function ClassTeacherDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();

  const school = await db.school.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!school) notFound();

  // Resolve teacher record
  const teacher = await db.teacher.findFirst({
    where:  { userId: authUser.id, schoolId: school.id },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!teacher) redirect(`/school/${slug}/teacher/dashboard`);

  // Find stream this teacher is class head of
  const streamResult = await getClassHeadStream(teacher.id, school.id);
  if (!streamResult.ok || !streamResult.data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="font-semibold text-slate-700 dark:text-slate-300 text-lg">
            No Class Assigned
          </p>
          <p className="text-sm text-slate-400 mt-2">
            You are not currently assigned as a class teacher for any stream.
            Contact your DOS to be assigned.
          </p>
        </div>
      </div>
    );
  }

  const stream = streamResult.data;
  const dashResult = await getClassTeacherDashboardData(stream.id, teacher.id);

  if (!dashResult.ok || !dashResult.data) {
    return (
      <div className="p-6 text-red-500">
        Failed to load class dashboard: {dashResult.message}
      </div>
    );
  }

  return (
    <ClassTeacherDashboardClient
      teacher={{ id: teacher.id, firstName: teacher.firstName, lastName: teacher.lastName }}
      stream={{
        id:           stream.id,
        name:         stream.name,
        className:    stream.classYear.classTemplate.name,
        classLevel:   stream.classYear.classLevel,
        year:         stream.classYear.academicYear.year,
        classYearId:  stream.classYear.id,
      }}
      data={dashResult.data}
      slug={slug}
      schoolId={school.id}
      userId={authUser.id}
    />
  );
}
