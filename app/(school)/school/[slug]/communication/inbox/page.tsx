// // app/school/[slug]/communication/inbox/page.tsx
// import { getUserInbox } from "@/actions/communication-actions";
// import { getAuthenticatedUser } from "@/config/useAuth";
// import { redirect } from "next/navigation";
// import InboxClient, { type Post } from "../components/inbox-client";

// interface Props {
//   params: { slug: string };
//   searchParams: { unread?: string; archived?: string; page?: string };
// }

// export default async function InboxPage({ params, searchParams }: Props) {
//   const { slug } = await params;
//   const sp = await searchParams;

//   const user = await getAuthenticatedUser();
//   const userId = user.id;
//   const schoolId = user.school?.id;

//   if (!schoolId) redirect("/login");
//   const sid = schoolId as string;

//   const page = parseInt(sp.page ?? "1");
//   const result = await getUserInbox(userId, {
//     unreadOnly: sp.unread === "1",
//     archived: sp.archived === "1",
//     page,
//     pageSize: 20,
//   });

//   return (
//     <InboxClient
//       userId={userId}
//       posts={(result.data ?? []) as unknown as Post[]}
//       total={result.total ?? 0}
//       unreadCount={result.unreadCount ?? 0}
//       page={page}
//       totalPages={Math.ceil((result.total ?? 0) / 20)}
//     />
//   );
// }






// app/school/[slug]/communication/inbox/page.tsx
import { getUserInbox } from "@/actions/communication-actions";
import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect } from "next/navigation";
import InboxClient, { type Post } from "../components/inbox-client";

interface Props {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ unread?: string; archived?: string; page?: string }>;
}

export default async function InboxPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp       = await searchParams;

  const user     = await getAuthenticatedUser();
  const userId   = user.id;
  const schoolId = user.school?.id;

  if (!schoolId) redirect("/login");
  const sid = schoolId as string;

  const page   = parseInt(sp.page ?? "1");
  const result = await getUserInbox(userId, {
    unreadOnly: sp.unread   === "1",
    archived:   sp.archived === "1",
    page,
    pageSize:   20,
  });

  return (
    <InboxClient
      userId={userId}
      posts={(result.data ?? []) as unknown as Post[]}
      total={result.total ?? 0}
      unreadCount={result.unreadCount ?? 0}
      page={page}
      totalPages={Math.ceil((result.total ?? 0) / 20)}
    />
  );
}