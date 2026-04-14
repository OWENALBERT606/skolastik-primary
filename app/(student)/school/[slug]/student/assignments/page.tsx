// app/(student)/school/[slug]/student/assignments/page.tsx

import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import { getStudentAssignments, getStudentSubmissions } from "@/actions/lms-assignments";
import StudentAssignmentsClient from "./assignments-client";

export default async function StudentAssignmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const authUser = await getAuthenticatedUser();
  if (!authUser?.id || authUser.loginAs !== "student") redirect("/login");

  const student = await db.student.findFirst({
    where:  { userId: authUser.id },
    select: { id: true, schoolId: true },
  });
  if (!student) redirect("/login");

  // All academic years + terms for this school, ordered newest first
  const academicYears = await db.academicYear.findMany({
    where:   { schoolId: student.schoolId },
    orderBy: { year: "desc" },
    select: {
      id:       true,
      year:     true,
      isActive: true,
      terms: {
        orderBy: { termNumber: "asc" },
        select:  { id: true, name: true, termNumber: true, isActive: true },
      },
    },
  });

  const [assignmentsResult, submissionsResult] = await Promise.all([
    getStudentAssignments(student.id, student.schoolId),
    getStudentSubmissions(student.id, student.schoolId),
  ]);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <StudentAssignmentsClient
        assignments={assignmentsResult.ok ? assignmentsResult.data : []}
        submissions={submissionsResult.ok ? submissionsResult.data : []}
        academicYears={academicYears}
        studentId={student.id}
        schoolId={student.schoolId}
        slug={slug}
      />
    </div>
  );
}
