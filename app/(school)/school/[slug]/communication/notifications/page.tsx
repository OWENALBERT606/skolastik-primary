// // app/school/[slug]/communication/notifications/page.tsx
// import { getNotificationPreferences, getAppNotifications } from "@/actions/communication-actions";
// import { getAuthenticatedUser } from "@/config/useAuth";
// import { redirect } from "next/navigation";
// import NotificationsClient, { type AppNotification } from "../components/notification-client";

// interface Props {
//   params: { slug: string };
// }

// export default async function NotificationsPage({ params }: Props) {
//   const { slug } = await params;

//   const user = await getAuthenticatedUser();
//   const userId = user.id;
//   const schoolId = user.school?.id;

//   if (!schoolId) redirect("/login");
//   const sid = schoolId as string;

//   const [prefs, notifResult] = await Promise.all([
//     getNotificationPreferences(userId, sid),
//     getAppNotifications(userId, { page: 1, pageSize: 30 }),
//   ]);

//   return (
//     <NotificationsClient
//       userId={userId}
//       schoolId={sid}
//       prefs={prefs}
//       notifications={(notifResult.data ?? []) as unknown as AppNotification[]}
//       unreadCount={notifResult.unreadCount ?? 0}
//       total={notifResult.total ?? 0}
//     />
//   );
// }



// app/school/[slug]/communication/notifications/page.tsx
import { getNotificationPreferences, getAppNotifications } from "@/actions/communication-actions";
import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect } from "next/navigation";
import NotificationsClient, { type AppNotification } from "../components/notification-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function NotificationsPage({ params }: Props) {
  const { slug } = await params;

  const user     = await getAuthenticatedUser();
  const userId   = user.id;
  const schoolId = user.school?.id;

  if (!schoolId) redirect("/login");
  const sid = schoolId as string;

  const [prefs, notifResult] = await Promise.all([
    getNotificationPreferences(userId, sid),
    getAppNotifications(userId, { page: 1, pageSize: 30 }),
  ]);

  return (
    <NotificationsClient
      userId={userId}
      schoolId={sid}
      prefs={prefs}
      notifications={(notifResult.data ?? []) as unknown as AppNotification[]}
      unreadCount={notifResult.unreadCount ?? 0}
      total={notifResult.total ?? 0}
    />
  );
}