// // app/school/[slug]/communication/events/page.tsx
// import { getEventsBySchool } from "@/actions/communication-actions";
// import { getAuthenticatedUser } from "@/config/useAuth";
// import { redirect } from "next/navigation";
// import EventsClient, { type SchoolEvent } from "../components/event-client";

// interface Props {
//   params: { slug: string };
//   searchParams: { status?: string; type?: string; page?: string };
// }

// export default async function EventsPage({ params, searchParams }: Props) {
//   const { slug } = await params;
//   const sp = await searchParams;

//   const user = await getAuthenticatedUser();
//   const userId = user.id;
//   const schoolId = user.school?.id;

//   if (!schoolId) redirect("/login");
//   const sid = schoolId as string;

//   const page = parseInt(sp.page ?? "1");
//   const result = await getEventsBySchool(sid, {
//     status: sp.status as any,
//     eventType: sp.type as any,
//     page,
//     pageSize: 12,
//   });

//   return (
//     <EventsClient
//       schoolId={sid}
//       schoolSlug={slug}
//       userId={userId}
//       events={(result.data ?? []) as unknown as SchoolEvent[]}
//       total={result.total ?? 0}
//       page={page}
//       totalPages={result.totalPages ?? 1}
//     />
//   );
// }




// app/school/[slug]/communication/events/page.tsx
import { getEventsBySchool } from "@/actions/communication-actions";
import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect } from "next/navigation";
import EventsClient, { type SchoolEvent } from "../components/event-client";

interface Props {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}

export default async function EventsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp       = await searchParams;

  const user    = await getAuthenticatedUser();
  const userId  = user.id;
  const schoolId = user.school?.id;

  if (!schoolId) redirect("/login");
  const sid = schoolId as string;

  const page   = parseInt(sp.page ?? "1");
  const result = await getEventsBySchool(sid, {
    status:    sp.status    as any,
    eventType: sp.type      as any,
    page,
    pageSize:  12,
  });

  return (
    <EventsClient
      schoolId={sid}
      schoolSlug={slug}
      userId={userId}
      events={(result.data ?? []) as unknown as SchoolEvent[]}
      total={result.total ?? 0}
      page={page}
      totalPages={result.totalPages ?? 1}
    />
  );
}