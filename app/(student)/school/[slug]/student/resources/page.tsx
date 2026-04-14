// app/(student)/school/[slug]/student/resources/page.tsx

import { redirect }                    from "next/navigation";
import { getAuthenticatedUser }        from "@/config/useAuth";
import { db }                          from "@/prisma/db";
import { getStudentSubjectResources }  from "@/actions/subject-resources";
import StudentResourcesClient          from "./resources-client";

export default async function StudentResourcesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const authUser = await getAuthenticatedUser();
  if (!authUser?.id || authUser.loginAs !== "student") redirect("/login");

  const student = await db.student.findFirst({
    where:  { userId: authUser.id },
    select: { id: true, schoolId: true, firstName: true, lastName: true },
  });
  if (!student) redirect("/login");

  const [result, academicYears] = await Promise.all([
    getStudentSubjectResources(student.id, student.schoolId),
    db.academicYear.findMany({
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
    }),
  ]);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <StudentResourcesClient
        resources={result.ok ? result.data.resources : []}
        subjects={result.ok ? result.data.subjects : []}
        academicYears={academicYears}
        slug={slug}
      />
    </div>
  );
}
