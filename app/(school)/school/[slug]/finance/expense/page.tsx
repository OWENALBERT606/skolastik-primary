import { db } from "@/prisma/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import type { Session } from "next-auth";
import ExpensesPage from "./components/expense-page";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [school, session] = await Promise.all([
    db.school.findUnique({ where: { slug }, select: { id: true } }),
    getServerSession(authOptions as any) as Promise<Session | null>,
  ]);

  if (!school) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        School not found:{" "}
        <code className="ml-2 font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded">{slug}</code>
      </div>
    );
  }

  // Derive permissions from session roles
  const roles: string[] = (session?.user?.roles ?? []).map(
    (r: any) => (r.roleName ?? r) as string
  );

  const APPROVER_ROLES = ["school_admin", "schooladmin", "director_of_studies", "dos", "principal"];
  const PAYER_ROLES    = ["school_admin", "schooladmin", "bursar", "accountant"];

  const canApprove  = roles.some(r => APPROVER_ROLES.includes(r.toLowerCase()));
  const canMarkPaid = roles.some(r => PAYER_ROLES.includes(r.toLowerCase()));

  return (
    <ExpensesPage
      schoolId={school.id}
      canApprove={canApprove}
      canMarkPaid={canMarkPaid}
    />
  );
}