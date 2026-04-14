// app/(school)/school/[slug]/students/attendance/page.tsx

import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import AttendanceClient         from "./attendance-client";

export default async function AdminAttendancePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const authUser = await getAuthenticatedUser();
  const schoolId = authUser?.school?.id;
  if (!schoolId || !authUser?.id) redirect("/login");

  // Fetch all active streams with class info
  const classYears = await db.classYear.findMany({
    where: {
      academicYear: { schoolId, isActive: true },
    },
    include: {
      classTemplate: { select: { name: true, level: true } },
      academicYear:  { select: { id: true, year: true } },
      streams: {
        select: {
          id:   true,
          name: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { classTemplate: { level: "asc" } },
  });

  // Also include past-year streams (for historical reports)
  const pastClassYears = await db.classYear.findMany({
    where: {
      academicYear: { schoolId, isActive: false },
    },
    include: {
      classTemplate: { select: { name: true, level: true } },
      academicYear:  { select: { id: true, year: true } },
      streams: {
        select: {
          id:   true,
          name: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: [{ academicYear: { year: "desc" } }, { classTemplate: { level: "asc" } }],
    take: 50,
  });

  type StreamItem = {
    streamId:       string;
    streamName:     string;
    className:      string;
    academicYearId: string;
    academicYear:   string;
    isActiveYear:   boolean;
    studentCount:   number;
  };

  const toStreamItems = (cys: typeof classYears, isActive: boolean): StreamItem[] =>
    cys.flatMap(cy =>
      cy.streams.map(s => ({
        streamId:       s.id,
        streamName:     s.name,
        className:      cy.classTemplate.name,
        academicYearId: cy.academicYear.id,
        academicYear:   cy.academicYear.year,
        isActiveYear:   isActive,
        studentCount:   s._count.enrollments,
      }))
    );

  const streams = [
    ...toStreamItems(classYears, true),
    ...toStreamItems(pastClassYears, false),
  ];

  // Active terms for report filter
  const terms = await db.academicTerm.findMany({
    where:   { academicYear: { schoolId } },
    select:  { id: true, name: true, termNumber: true, isActive: true, academicYearId: true },
    orderBy: { termNumber: "asc" },
  });

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <AttendanceClient
        streams={streams}
        terms={terms}
        schoolId={schoolId}
        userId={authUser.id}
        slug={slug}
      />
    </div>
  );
}
