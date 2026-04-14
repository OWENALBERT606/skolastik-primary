// // app/school/[slug]/communication/messages/page.tsx
// import { getAuthenticatedUser } from "@/config/useAuth";
// import { redirect } from "next/navigation";
// import { getCommunicationStats, getMessagesBySchool } from "@/actions/communication-actions";
// import MessagesClient, { type Message } from "../components/message-client";

// interface Props {
//   params: { slug: string };
//   searchParams: { status?: string; audience?: string; page?: string };
// }

// export default async function MessagesPage({ params, searchParams }: Props) {
//   const { slug } = await params;
//   const sp = await searchParams;

//   const user = await getAuthenticatedUser();
//   const userId = user.id;
//   const schoolId = user.school?.id;

//   if (!schoolId) redirect("/login");
//   const sid = schoolId as string;

//   const page = parseInt(sp.page ?? "1");
//   const [messagesResult, stats] = await Promise.all([
//     getMessagesBySchool(sid, {
//       status: sp.status as any,
//       audience: sp.audience as any,
//       page,
//       pageSize: 15,
//     }),
//     getCommunicationStats(sid),
//   ]);

//   return (
//     <MessagesClient
//       schoolId={sid}
//       schoolSlug={slug}
//       userId={userId}
//       messages={(messagesResult.data ?? []) as unknown as Message[]}
//       total={messagesResult.total ?? 0}
//       page={page}
//       totalPages={messagesResult.totalPages ?? 1}
//       stats={stats.data}
//     />
//   );
// }




// app/school/[slug]/communication/messages/page.tsx
import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect } from "next/navigation";
import { getCommunicationStats, getMessagesBySchool } from "@/actions/communication-actions";
import MessagesClient, { type Message } from "../components/message-client";

interface Props {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; audience?: string; page?: string }>;
}

export default async function MessagesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp       = await searchParams;

  const user     = await getAuthenticatedUser();
  const userId   = user.id;
  const schoolId = user.school?.id;

  if (!schoolId) redirect("/login");
  const sid = schoolId as string;

  const page = parseInt(sp.page ?? "1");
  const [messagesResult, stats] = await Promise.all([
    getMessagesBySchool(sid, {
      status:   sp.status   as any,
      audience: sp.audience as any,
      page,
      pageSize: 15,
    }),
    getCommunicationStats(sid),
  ]);

  return (
    <MessagesClient
      schoolId={sid}
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