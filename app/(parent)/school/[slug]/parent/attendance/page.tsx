import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import ParentAttendanceClient   from "./parent-attendance-client";

export default async function ParentAttendancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();
  if (!authUser?.id) redirect("/login");
  return <ParentAttendanceClient slug={slug} />;
}
