// app/school/[slug]/academics/streams/[streamId]/subjects/[subjectId]/page.tsx
import { getAuthenticatedUser }        from "@/config/useAuth";
import { getStreamSubjectById }        from "@/actions/stream-subjects";
import { getStreamSubjectMarksData }   from "@/actions/stream-subject-marks";
import { notFound }                    from "next/navigation";
import SubjectDetailClient             from "./components/stream-subject-detail-client";
import { db }                          from "@/prisma/db";

export default async function Page({
  params,
}: {
  params: Promise<{
    slug:      string;
    id:        string;
    subjectId: string;
  }>;
}) {
  const { slug, id, subjectId } = await params;

  // getAuthenticatedUser() redirects to /login if no session
  const authUser = await getAuthenticatedUser();

  // Pass the User.id as userId. The mark-entry server actions handle the
  // Teacher lookup internally — if the logged-in user has no Teacher record
  // (e.g. school admin), AOIScore falls back to the first active teacher in
  // the school, while ExamMark/AOIUnit allow null enteredById (String? in schema).
  const userId    = authUser.id;
  const isTeacher = authUser.roles[0]?.roleName === "teacher";

  // ── Data ──────────────────────────────────────────────────────────────────
  const result = await getStreamSubjectById(subjectId);
  if (!result.ok || !result.data) notFound();

  const streamSubject = result.data;

  // ── Computed metrics ──────────────────────────────────────────────────────
  const totalStudents = streamSubject.studentEnrollments.length;

  const allMarks = streamSubject.studentEnrollments.flatMap(
    (enrollment: any) => enrollment.marks ?? []
  );

  const withResults = allMarks.length;

  const averageMark =
    allMarks.length > 0
      ? allMarks.reduce(
          (acc: number, m: any) => acc + (m.marksObtained || 0),
          0
        ) / allMarks.length
      : 0;

  const uniqueTeachersMap = new Map<string, any>();
  streamSubject.teacherAssignments.forEach((ta: any) => {
    uniqueTeachersMap.set(ta.teacher.id, ta.teacher);
  });
  const uniqueTeachers = Array.from(uniqueTeachersMap.values());

  // ── Marks data (pre-fetched server-side to avoid cold DB on client) ────────
  const marksResult = await getStreamSubjectMarksData(subjectId);
  const initialMarksData = marksResult.ok ? marksResult.data ?? null : null;

  // ── Lock status ────────────────────────────────────────────────────────────
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
    <div className="space-y-6 p-6 w-[1000px] bg-slate-50 dark:bg-slate-950 min-h-screen">
      <SubjectDetailClient
        streamSubject={streamSubject}
        schoolId={streamSubject.stream.schoolId}
        schoolSlug={slug}
        streamId={id}
        userId={userId}
        totalStudents={totalStudents}
        withResults={withResults}
        averageMark={averageMark}
        uniqueTeachers={uniqueTeachers}
        isLocked={isLocked}
        initialMarksData={initialMarksData}
        isTeacher={isTeacher}
      />
    </div>
  );
}