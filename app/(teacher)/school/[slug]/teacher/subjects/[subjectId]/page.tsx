import { getAuthenticatedUser }      from "@/config/useAuth";
import { getStreamSubjectById }      from "@/actions/stream-subjects";
import { getStreamSubjectMarksData } from "@/actions/stream-subject-marks";
import { notFound, redirect }        from "next/navigation";
import TeacherSubjectDetailClient    from "./components/teacher-subject-detail-client";
import { db }                        from "@/prisma/db";

export default async function TeacherSubjectPage({
  params,
}: {
  params: Promise<{ slug: string; subjectId: string }>;
}) {
  const { slug, subjectId } = await params;

  const authUser = await getAuthenticatedUser();
  if (!authUser?.id) redirect("/login");

  const result = await getStreamSubjectById(subjectId);
  if (!result.ok || !result.data) notFound();

  const streamSubject = result.data;

  // Verify this teacher is actually assigned to this subject
  const teacher = await db.teacher.findUnique({
    where: { userId: authUser.id },
    select: { id: true },
  });
  if (!teacher) redirect(`/school/${slug}/teacher/dashboard`);

  const isAssigned = await db.streamSubjectTeacher.findFirst({
    where: { teacherId: teacher.id, streamSubjectId: subjectId, status: "ACTIVE" },
  });

  // Also allow class heads of the stream to view any subject in their class
  const isClassHead = !isAssigned
    ? await db.stream.findFirst({
        where: { classHeadId: teacher.id, id: streamSubject.stream.id },
        select: { id: true },
      })
    : null;

  if (!isAssigned && !isClassHead) redirect(`/school/${slug}/teacher/dashboard`);

  // Metrics
  const totalStudents = streamSubject.studentEnrollments.length;
  const allMarks = streamSubject.studentEnrollments.flatMap((e: any) => e.marks ?? []);
  const withResults = allMarks.length;
  const averageMark = allMarks.length > 0
    ? allMarks.reduce((acc: number, m: any) => acc + (m.marksObtained || 0), 0) / allMarks.length
    : 0;

  const uniqueTeachersMap = new Map<string, any>();
  streamSubject.teacherAssignments.forEach((ta: any) => uniqueTeachersMap.set(ta.teacher.id, ta.teacher));
  const uniqueTeachers = Array.from(uniqueTeachersMap.values());

  const marksResult = await getStreamSubjectMarksData(subjectId);
  const initialMarksData = marksResult.ok ? marksResult.data ?? null : null;

  const classYearId = streamSubject.stream?.classYear?.id;
  const termId      = streamSubject.term?.id;
  let   isLocked    = false;
  if (classYearId && termId) {
    const cfg = await db.classAssessmentConfig.findUnique({
      where:  { classYearId_termId: { classYearId, termId } },
      select: { isLocked: true },
    });
    isLocked = cfg?.isLocked ?? false;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <TeacherSubjectDetailClient
        streamSubject={streamSubject}
        schoolId={streamSubject.stream.schoolId}
        schoolSlug={slug}
        streamId={streamSubject.stream.id}
        userId={authUser.id}
        totalStudents={totalStudents}
        withResults={withResults}
        averageMark={averageMark}
        uniqueTeachers={uniqueTeachers}
        isLocked={isLocked}
        initialMarksData={initialMarksData}
      />
    </div>
  );
}
