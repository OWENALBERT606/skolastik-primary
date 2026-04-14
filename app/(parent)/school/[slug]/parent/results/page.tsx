import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import ParentResultsClient      from "./parent-results-client";

export default async function ParentResultsPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();
  if (!authUser?.id) redirect("/login");
  return <ParentResultsClient slug={slug} />;
}
