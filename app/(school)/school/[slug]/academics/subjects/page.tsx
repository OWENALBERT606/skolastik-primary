// app/(school)/school/[slug]/academics/subjects/page.tsx
import { redirect } from "next/navigation";
import { getAvailableTeachersForHead } from "@/actions/subjects";
import { db } from "@/prisma/db";
import { SubjectsList } from "./components/subjects-list";
import { getAuthenticatedUser } from "@/config/useAuth";

export default async function SubjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ yearId?: string }>;
}) {
  const { slug } = await params;
  const { yearId } = await searchParams;

  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const school = await db.school.findUnique({
    where:  { slug },
    select: { id: true, slug: true },
  });
  if (!school) redirect("/login");

  const schoolId   = school.id;
  const schoolSlug = school.slug;

  // Get active academic year
  const activeAcademicYear = await db.academicYear.findFirst({
    where: {
      schoolId,
      isActive: true,
    },
    select: {
      id: true,
      year: true,
      isActive: true,
    },
  });

  // Get all academic years for the dropdown
  const academicYears = await db.academicYear.findMany({
    where: { schoolId },
    select: { id: true, year: true, isActive: true },
    orderBy: { year: "desc" },
  });

  if (!activeAcademicYear) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Active Academic Year</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Please create and activate an academic year first.</p>
        </div>
      </div>
    );
  }

  // Use yearId from query param if provided, else active year
  const selectedYearId = yearId ?? activeAcademicYear.id;

  // Get available class years for the selected year
  const availableClassYears = await db.classYear.findMany({
    where: { academicYearId: selectedYearId },
    include: {
      classTemplate: {
        select: {
          id: true,
          name: true,
          code: true,
          level: true,
        },
      },
      streams: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      classTemplate: {
        level: 'asc',
      },
    },
  });

  // Fetch subjects — no papers in primary education
  const subjects = await db.subject.findMany({
    where:   { schoolId },
    include: {
      headTeacher: {
        select: { id: true, firstName: true, lastName: true, staffNo: true },
      },
      classSubjects: {
        include: {
          classYear: {
            include: {
              classTemplate: {
                select: { id: true, name: true, code: true, level: true },
              },
              academicYear: {
                select: { id: true, year: true, isActive: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          classSubjects:  true,
          streamSubjects: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Fetch available teachers
  const teachers = await getAvailableTeachersForHead(schoolId);

  return (
    <div className="p-6 lg:p-8">
      <SubjectsList 
        subjects={subjects} 
        schoolId={schoolId}
        schoolSlug={schoolSlug}
        teachers={teachers}
        activeAcademicYear={activeAcademicYear}
        academicYears={academicYears}
        availableClassYears={availableClassYears}
      />
    </div>
  );
}