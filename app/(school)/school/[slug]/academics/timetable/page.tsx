import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import TimetableClient          from "./components/timetable-client";

export default async function TimetablePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await getAuthenticatedUser();

  // Resolve school by slug — works for any authenticated user in this school
  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!school) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">School not found.</p>
        </div>
      </div>
    );
  }

  // Load academic years + terms for the selectors
  const years = await db.academicYear.findMany({
    where:   { schoolId: school.id },
    include: { terms: { orderBy: { termNumber: "asc" } } },
    orderBy: { year: "desc" },
  });

  // Load existing timetable versions
  const versions = await db.timetableVersion.findMany({
    where:   { schoolId: school.id },
    include: { _count: { select: { slots: true, conflicts: true } } },
    orderBy: [{ termId: "asc" }, { versionNumber: "desc" }],
  });

  // Load teachers with their existing availability records
  const teachers = await db.teacher.findMany({
    where:   { schoolId: school.id, currentStatus: "ACTIVE" },
    select: {
      id:             true,
      firstName:      true,
      lastName:       true,
      staffNo:        true,
      employmentType: true,
      availabilities: { orderBy: { dayOfWeek: "asc" } },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  // Load classes (ClassYear) for per-class day config
  // Note: dayConfigs relation requires prisma generate after db push
  const classYears = await db.classYear.findMany({
    where: {
      isActive:     true,
      academicYear: { schoolId: school.id },
    },
    include: {
      classTemplate: { select: { name: true, classLevel: true, level: true } },
      academicYear:  { select: { year: true } },
    },
    orderBy: [
      { classTemplate: { level: "asc" } },
      { classTemplate: { name: "asc" } },
    ],
  });

  // Load classes with subjects + existing period configs for the "Subject Periods" tab
  const classYearsWithSubjects = await db.classYear.findMany({
    where: {
      isActive:     true,
      academicYear: { schoolId: school.id },
    },
    include: {
      classTemplate: { select: { name: true, classLevel: true, level: true } },
      academicYear:  { select: { year: true } },
      classSubjects: {
        include: {
          subject:         { select: { name: true, code: true } },
          timetableConfig: { select: { id: true, lessonsPerWeek: true, allowDoubles: true } },
        },
        orderBy: { subject: { name: "asc" } },
      },
    },
    orderBy: [
      { classTemplate: { level: "asc" } },
      { classTemplate: { name: "asc" } },
    ],
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Timetable Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configure school days, generate timetables, and manage versions.
        </p>
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
