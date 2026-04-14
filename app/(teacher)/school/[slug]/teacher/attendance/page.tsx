// app/(teacher)/school/[slug]/teacher/attendance/page.tsx
import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import { getTeacherStreamsForAttendance } from "@/actions/student-attendance";
import AttendanceClient from "./attendance-client";

export default async function TeacherAttendancePage({
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

  const streamsResult = await getTeacherStreamsForAttendance(authUser.id);
  if (!streamsResult.ok) redirect(`/school/${slug}/teacher/dashboard`);

  const { streams, schoolId } = streamsResult.data;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <AttendanceClient
        streams={streams}
        schoolId={schoolId}
        userId={authUser.id}
        slug={slug}
        teacherName={`${teacher.firstName} ${teacher.lastName}`}
      />
    </div>
  );
}
