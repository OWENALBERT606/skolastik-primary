// DOS Inbox page
import { getUserInbox } from "@/actions/communication-actions";
import { getAuthenticatedUser } from "@/config/useAuth";
import InboxClient, { type Post } from "@/app/(school)/school/[slug]/communication/components/inbox-client";

interface Props {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ unread?: string; archived?: string; page?: string }>;
}

export default async function DOSInboxPage({ params, searchParams }: Props) {
  const sp = await searchParams;
  const user = await getAuthenticatedUser();
  const page = parseInt(sp.page ?? "1");

  const result = await getUserInbox(user.id, {
    unreadOnly: sp.unread   === "1",
    archived:   sp.archived === "1",
    page,
    pageSize:   20,
  });

  return (
    <InboxClient
      userId={user.id}
      posts={(result.data ?? []) as unknown as Post[]}
      total={result.total ?? 0}
      unreadCount={result.unreadCount ?? 0}
      page={page}
      totalPages={Math.ceil((result.total ?? 0) / 20)}
    />
  );
}
