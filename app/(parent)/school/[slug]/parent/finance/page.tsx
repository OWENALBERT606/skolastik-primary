import { redirect }             from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import ParentFinanceClient      from "./parent-finance-client";

export default async function ParentFinancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();
  if (!authUser?.id) redirect("/login");
  return <ParentFinanceClient slug={slug} />;
}
