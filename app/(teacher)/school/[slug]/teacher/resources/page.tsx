// app/(teacher)/school/[slug]/teacher/resources/page.tsx

import { redirect }                    from "next/navigation";
import { getAuthenticatedUser }        from "@/config/useAuth";
import { db }                          from "@/prisma/db";
import { getTeacherSubjectResources }  from "@/actions/subject-resources";
import ResourcesClient                 from "./resources-client";

export default async function TeacherResourcesPage({
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

  const terms = await db.academicTerm.findMany({
    where:   { academicYear: { schoolId: teacher.schoolId } },
    select:  { id: true, name: true, termNumber: true, isActive: true },
    orderBy: { termNumber: "asc" },
  });

  const result = await getTeacherSubjectResources(teacher.id, teacher.schoolId);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <ResourcesClient
        resources={result.ok ? result.data.resources : []}
        subjects={result.ok ? result.data.subjects : []}
        terms={terms}
        teacherId={teacher.id}
        schoolId={teacher.schoolId}
        slug={slug}
      />
    </div>
  );
}
