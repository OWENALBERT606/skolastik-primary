// DOS Timetable page — mirrors admin timetable page but under DOS route
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import TimetableClient from "@/app/(school)/school/[slug]/academics/timetable/components/timetable-client";
import { notFound } from "next/navigation";

export default async function DOSTimetablePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await getAuthenticatedUser();

  const school = await db.school.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } });
  if (!school) notFound();

  const [years, versions, teachers, classYears, classYearsWithSubjects] = await Promise.all([
    db.academicYear.findMany({
      where: { schoolId: school.id },
      include: { terms: { orderBy: { termNumber: "asc" } } },
      orderBy: { year: "desc" },
    }),
    db.timetableVersion.findMany({
      where: { schoolId: school.id },
      include: { _count: { select: { slots: true, conflicts: true } } },
      orderBy: [{ termId: "asc" }, { versionNumber: "desc" }],
    }),
    db.teacher.findMany({
      where: { schoolId: school.id, currentStatus: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, staffNo: true, employmentType: true, availabilities: { orderBy: { dayOfWeek: "asc" } } },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    db.classYear.findMany({
      where: { isActive: true, academicYear: { schoolId: school.id } },
      include: {
        classTemplate: { select: { name: true, classLevel: true, level: true } },
        academicYear: { select: { year: true } },
      },
      orderBy: [{ classTemplate: { level: "asc" } }, { classTemplate: { name: "asc" } }],
    }),
    db.classYear.findMany({
      where: { isActive: true, academicYear: { schoolId: school.id } },
      include: {
        classTemplate: { select: { name: true, classLevel: true, level: true } },
        academicYear: { select: { year: true } },
        classSubjects: {
          include: {
            subject: { select: { name: true, code: true } },
            timetableConfig: { select: { id: true, lessonsPerWeek: true, allowDoubles: true } },
          },
          orderBy: { subject: { name: "asc" } },
        },
      },
      orderBy: [{ classTemplate: { level: "asc" } }, { classTemplate: { name: "asc" } }],
    }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Timetable Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Configure school days, generate timetables, and manage versions.</p>
      </div>
      <TimetableClient
        schoolId={school.id}
        slug={slug}
        years={years as any}
        versions={versions as any}
        teachers={teachers as any}
        classYears={classYears as any}
        classYearsWithSubjects={classYearsWithSubjects as any}
      />
    </div>
  );
}
