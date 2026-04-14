// DOS Events page
import { getEventsBySchool } from "@/actions/communication-actions";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import { notFound } from "next/navigation";
import EventsClient, { type SchoolEvent } from "@/app/(school)/school/[slug]/communication/components/event-client";

interface Props {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}

export default async function DOSEventsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const user = await getAuthenticatedUser();
  const userId = user.id;

  let schoolId = user.school?.id;
  if (!schoolId) {
    const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
    if (!school) notFound();
    schoolId = school.id;
  }

  const page = parseInt(sp.page ?? "1");
  const result = await getEventsBySchool(schoolId, {
    status:    sp.status as any,
    eventType: sp.type   as any,
    page,
    pageSize:  12,
  });

  return (
    <EventsClient
      schoolId={schoolId}
      schoolSlug={slug}
      userId={userId}
      events={(result.data ?? []) as unknown as SchoolEvent[]}
      total={result.total ?? 0}
      page={page}
      totalPages={result.totalPages ?? 1}
    />
  );
}
