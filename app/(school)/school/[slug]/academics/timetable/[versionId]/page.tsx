import { db }                  from "@/prisma/db";
import { notFound }            from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { getSchoolsByAdminId }  from "@/actions/schools";
import VersionDetailClient     from "./version-detail-client";

export default async function VersionDetailPage({
  params,
}: {
  params: Promise<{ slug: string; versionId: string }>;
}) {
  const { slug, versionId } = await params;
  const user     = await getAuthenticatedUser();
  const schoolData = await getSchoolsByAdminId(user.id);
  const school   = schoolData.data?.[0];
  if (!school) notFound();

  const version = await db.timetableVersion.findUnique({
    where:   { id: versionId },
    include: {
      term:        { select: { name: true, termNumber: true } },
      academicYear:{ select: { year: true } },
      conflicts:   { orderBy: [{ severity: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!version || version.schoolId !== school.id) notFound();

  // Load slots grouped by stream
  const slots = await db.timetableSlot.findMany({
    where:   { timetableVersionId: versionId, isActive: true },
    include: {
      stream:        { select: { id: true, name: true } },
      streamSubject: {
        include: {
          subject: { select: { name: true, code: true } },
          teacherAssignments: {
            where:   { status: "ACTIVE" },
            include: { teacher: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { slotNumber: "asc" }],
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {version.label ?? `Version ${version.versionNumber}`}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {version.academicYear.year} — {version.term.name} · {version.status}
        </p>
      </div>

      <VersionDetailClient
        version={version as any}
        slots={slots as any}
        slug={slug}
      />
    </div>
  );
}
