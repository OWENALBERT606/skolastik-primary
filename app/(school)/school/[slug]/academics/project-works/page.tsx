// Project Works — Senior 3 and above
import { redirect }             from "next/navigation";
import { db }                   from "@/prisma/db";
import { getAuthenticatedUser } from "@/config/useAuth";
import ProjectWorksClient       from "./components/project-works-client";

export default async function ProjectWorksPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user     = await getAuthenticatedUser();
  if (!user?.id) redirect("/login");

  const school = await db.school.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!school) redirect("/login");
  const schoolId = school.id;

  // Active year + term
  const activeYear = await db.academicYear.findFirst({
    where:   { schoolId, isActive: true },
    include: { terms: { where: { isActive: true }, take: 1 } },
  });
  const activeTermId   = activeYear?.terms[0]?.id   ?? null;
  const activeTermName = activeYear?.terms[0]?.name ?? null;
  const activeYearStr  = activeYear?.year ?? null;

  // Classes S3 and above (level >= 3 for O-Level, all A-Level)
  const classYears = await db.classYear.findMany({
    where: {
      academicYear: { schoolId, isActive: true },
      OR: [
        { classTemplate: { level: { gte: 3 } } },
        { classLevel: "A_LEVEL" },
      ],
    },
    include: {
      classTemplate: { select: { name: true, level: true } },
      streams: {
        select: {
          id: true, name: true, classHeadId: true,
          classHead: { select: { id: true, firstName: true, lastName: true } },
          enrollments: {
            where:  { status: "ACTIVE" },
            select: {
              student: {
                select: {
                  id: true, firstName: true, lastName: true, admissionNo: true,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { classTemplate: { level: "asc" } },
  });

  // Fetch project works separately (avoids Prisma client regeneration requirement)
  const studentIds = classYears.flatMap(cy =>
    cy.streams.flatMap(s => s.enrollments.map(e => e.student.id))
  );

  const projectWorks = studentIds.length > 0
    ? await (db as any).projectWork?.findMany({
        where:   { studentId: { in: studentIds }, schoolId },
        orderBy: { createdAt: "desc" as const },
        select: {
          id: true, studentId: true, title: true, description: true,
          fileUrl: true, fileName: true, fileSizeKb: true,
          className: true, streamName: true, termName: true, academicYear: true,
          createdAt: true, updatedAt: true,
          uploadedBy: { select: { name: true } },
        },
      }).catch(() => [])
    : [];

  // Group project works by studentId
  const worksByStudent: Record<string, any[]> = {};
  for (const w of (projectWorks ?? [])) {
    if (!worksByStudent[w.studentId]) worksByStudent[w.studentId] = [];
    worksByStudent[w.studentId].push(w);
  }

  // Check if current user is class head, DOS, or admin
  const teacher = await db.teacher.findUnique({ where: { userId: user.id }, select: { id: true } });
  const staff   = teacher ? await db.staff.findFirst({ where: { userId: user.id }, select: { id: true } }) : null;
  const userRoles = (user.roles ?? []).map((r: any) => (r.roleName ?? "").toLowerCase());
  const isAdmin   = userRoles.some(r => r.includes("admin"));

  let isDOS = false;
  if (staff) {
    const dosRole = await db.staffRole.findFirst({
      where: { staffId: staff.id, isActive: true, roleDefinition: { code: { in: ["DOS", "DIRECTOR_OF_STUDIES", "HEAD_TEACHER"] } } },
    });
    isDOS = !!dosRole;
  }

  // Which stream IDs this teacher is class head of
  const classHeadStreamIds = teacher
    ? classYears.flatMap(cy => cy.streams.filter(s => s.classHeadId === teacher.id).map(s => s.id))
    : [];

  const canUploadAll = isAdmin || isDOS;

  return (
    <div className="p-6">
      <ProjectWorksClient
        schoolId={schoolId}
        slug={slug}
        classYears={classYears.map(cy => ({
          id:        cy.id,
          className: cy.classTemplate.name,
          level:     cy.classTemplate.level ?? 0,
          streams:   cy.streams.map(s => ({
            id:          s.id,
            name:        s.name,
            classHeadId: s.classHeadId,
            classHead:   s.classHead ? `${s.classHead.firstName} ${s.classHead.lastName}` : null,
            students:    s.enrollments.map(e => ({
              id:          e.student.id,
              name:        `${e.student.firstName} ${e.student.lastName}`,
              admissionNo: e.student.admissionNo,
              projectWorks: worksByStudent[e.student.id] ?? [],
            })),
          })),
        }))}
        canUploadAll={canUploadAll}
        classHeadStreamIds={classHeadStreamIds}
        activeTermId={activeTermId}
        activeTermName={activeTermName}
        activeYear={activeYearStr}
        userId={user.id}
      />
    </div>
  );
}
