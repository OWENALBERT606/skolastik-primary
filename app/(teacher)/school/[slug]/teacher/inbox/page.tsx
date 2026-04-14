import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect } from "next/navigation";
import { getUserInbox } from "@/actions/communication-actions";
import TeacherInboxClient from "./teacher-inbox-client";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; unread?: string; archived?: string }>;
}

export default async function TeacherInboxPage({ params, searchParams }: Props) {
  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const unreadOnly = sp.unread === "1";
  const archived = sp.archived === "1";

  const result = await getUserInbox(userData.id, { page, unreadOnly, archived });

  return (
    <TeacherInboxClient
      userId={userData.id}
      slug={slug}
      posts={(result.data as any[]) ?? []}
      total={result.total ?? 0}
      unreadCount={result.unreadCount ?? 0}
      page={page}
      totalPages={Math.ceil((result.total ?? 0) / 20)}
    />
  );
}
