// DOS Messages page — same as admin messages but scoped to this DOS user's school
// Resolved from JWT capabilities, falling back to slug-based lookup
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";
import { redirect, notFound } from "next/navigation";
import { getCommunicationStats, getMessagesBySchool } from "@/actions/communication-actions";
import MessagesClient, { type Message } from "@/app/(school)/school/[slug]/communication/components/message-client";

interface Props {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; audience?: string; page?: string }>;
}

export default async function DOSMessagesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const user = await getAuthenticatedUser();
  const userId = user.id;

  // Resolve school from slug (DOS user may not have school in JWT if stale)
  let schoolId = user.school?.id;
  if (!schoolId) {
    const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
    if (!school) notFound();
    schoolId = school.id;
  }

  const page = parseInt(sp.page ?? "1");
  const [messagesResult, stats] = await Promise.all([
    getMessagesBySchool(schoolId, {
      status:   sp.status   as any,
      audience: sp.audience as any,
      page,
      pageSize: 15,
    }),
    getCommunicationStats(schoolId),
  ]);

  return (
    <MessagesClient
      schoolId={schoolId}
      schoolSlug={slug}
      userId={userId}
      messages={(messagesResult.data ?? []) as unknown as Message[]}
      total={messagesResult.total ?? 0}
      page={page}
      totalPages={messagesResult.totalPages ?? 1}
      stats={stats.data}
    />
  );
}
