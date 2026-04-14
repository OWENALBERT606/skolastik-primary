// DOS Subjects page — mirrors admin subjects page but under DOS route
import { db } from "@/prisma/db";
import { getAvailableTeachersForHead } from "@/actions/subjects";
import { SubjectsList } from "@/app/(school)/school/[slug]/academics/subjects/components/subjects-list";
import { notFound } from "next/navigation";

export default async function DOSSubjectsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) notFound();
  const schoolId = school.id;

  const activeAcademicYear = await db.academicYear.findFirst({
    where: { schoolId, isActive: true },
    select: { id: true, year: true, isActive: true },
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

  const [academicYears, availableClassYears, subjects, teachers] = await Promise.all([
    db.academicYear.findMany({ where: { schoolId }, select: { id: true, year: true, isActive: true }, orderBy: { year: "desc" } }),
    db.classYear.findMany({
      where: { academicYearId: activeAcademicYear.id, isActive: true },
      include: {
        classTemplate: { select: { id: true, name: true, code: true, level: true } },
        streams: { select: { id: true } },
      },
      orderBy: { classTemplate: { level: "asc" } },
    }),
    db.subject.findMany({
      where: { schoolId },
      include: {
        headTeacher: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
        papers: {
          select: { id: true, paperNumber: true, name: true, description: true, paperCode: true, maxMarks: true, weight: true, isActive: true, aoiCount: true, _count: { select: { aoiTopics: true, aoiUnits: true, examMarks: true, paperResults: true } } },
          orderBy: { paperNumber: "asc" },
        },
        classSubjects: { include: { classYear: { include: { classTemplate: { select: { id: true, name: true, code: true, level: true } }, academicYear: { select: { id: true, year: true, isActive: true } } } } } },
        _count: { select: { classSubjects: true, streamSubjects: true, papers: true } },
      },
      orderBy: { name: "asc" },
    }),
    getAvailableTeachersForHead(schoolId),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <SubjectsList
        subjects={subjects}
        schoolId={schoolId}
        schoolSlug={slug}
        teachers={teachers}
        activeAcademicYear={activeAcademicYear}
        academicYears={academicYears}
        availableClassYears={availableClassYears}
      />
    </div>
  );
}
