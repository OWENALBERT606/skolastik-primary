// app/(parent)/school/[slug]/parent/events/page.tsx

import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db }                   from "@/prisma/db";
import { getEventsBySchool }    from "@/actions/communication-actions";
import TeacherEventsClient      from "@/app/(teacher)/school/[slug]/teacher/events/teacher-events-client";

interface Props {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ParentEventsPage({ params, searchParams }: Props) {
  const authUser = await getAuthenticatedUser();
  if (!authUser?.id) redirect("/login");

  const { slug } = await params;
  const sp   = await searchParams;
  const page = Number(sp.page ?? 1);

  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) redirect("/school");

  // Parents see events published for ALL and PARENTS audiences
  const [allResult, parentsResult] = await Promise.all([
    getEventsBySchool(school.id, { status: "PUBLISHED", audience: "ALL",     page, pageSize: 50 }),
    getEventsBySchool(school.id, { status: "PUBLISHED", audience: "PARENTS", page, pageSize: 50 }),
  ]);

  const allEvents = [
    ...((allResult.data    as any[]) ?? []),
    ...((parentsResult.data as any[]) ?? []),
  ]
    .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i) // deduplicate
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const total = allEvents.length;

  return (
    <TeacherEventsClient
      slug={slug}
      events={allEvents}
      total={total}
      page={page}
    />
  );
}
