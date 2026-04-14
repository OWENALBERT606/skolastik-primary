// app/(teacher)/school/[slug]/teacher/assignments/page.tsx

import { redirect }                from "next/navigation";
import { getAuthenticatedUser }    from "@/config/useAuth";
import { db }                      from "@/prisma/db";
import { getTeacherAssignments }   from "@/actions/lms-assignments";
import AssignmentsClient           from "./assignments-client";

export default async function TeacherAssignmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const authUser = await getAuthenticatedUser();
  if (!authUser?.id) redirect("/login");

  const teacher = await db.teacher.findUnique({
    where:  { userId: authUser.id },
    select: { id: true, firstName: true, lastName: true, schoolId: true },
  });
  if (!teacher) redirect("/login");

  // Streams + subjects this teacher is assigned to (subject teacher or class head)
  const streamSubjectTeachers = await db.streamSubjectTeacher.findMany({
    where:  { teacherId: teacher.id },
    select: {
      streamSubject: {
        select: {
          subjectId: true,
          subject:   { select: { name: true } },
          streamId:  true,
          stream:    { select: { name: true } },
        },
      },
    },
  });

  // Also include streams where teacher is class head
  const headedStreams = await db.stream.findMany({
    where: {
      classHeadId: teacher.id,
      classYear:   { academicYear: { isActive: true } },
    },
    select: { id: true, name: true },
  });

  // Build unique subject+stream pairs
  type SubjectStream = { subjectId: string; subjectName: string; streamId: string; streamName: string };
  const pairs: SubjectStream[] = streamSubjectTeachers.map(sst => ({
    subjectId:   sst.streamSubject.subjectId,
    subjectName: sst.streamSubject.subject.name,
    streamId:    sst.streamSubject.streamId,
    streamName:  sst.streamSubject.stream.name,
  }));

  const result = await getTeacherAssignments(teacher.id, teacher.schoolId);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <AssignmentsClient
        assignments={result.ok ? result.data : []}
        subjectStreams={pairs}
        teacherId={teacher.id}
        schoolId={teacher.schoolId}
        slug={slug}
      />
    </div>
  );
}
