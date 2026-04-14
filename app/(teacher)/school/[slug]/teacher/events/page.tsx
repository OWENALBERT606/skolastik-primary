import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect } from "next/navigation";
import { getEventsBySchool } from "@/actions/communication-actions";
import TeacherEventsClient from "./teacher-events-client";
import { db } from "@/prisma/db";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function TeacherEventsPage({ params, searchParams }: Props) {
  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) redirect("/school");

  // Fetch published events visible to staff (ALL, ALL_STAFF, TEACHERS)
  const [allResult, staffResult, teacherResult] = await Promise.all([
    getEventsBySchool(school.id, { status: "PUBLISHED", audience: "ALL", page, pageSize: 10 }),
    getEventsBySchool(school.id, { status: "PUBLISHED", audience: "ALL_STAFF", page, pageSize: 10 }),
    getEventsBySchool(school.id, { status: "PUBLISHED", audience: "TEACHERS", page, pageSize: 10 }),
  ]);

  const allEvents = [
    ...((allResult.data as any[]) ?? []),
    ...((staffResult.data as any[]) ?? []),
    ...((teacherResult.data as any[]) ?? []),
  ].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const total = (allResult.total ?? 0) + (staffResult.total ?? 0) + (teacherResult.total ?? 0);

  return (
    <TeacherEventsClient
      slug={slug}
      events={allEvents}
      total={total}
      page={page}
    />
  );
}
