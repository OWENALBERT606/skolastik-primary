// app/school/[slug]/finance/fees/penalties/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions }       from "@/config/auth";
import { redirect }          from "next/navigation";
import { db }                from "@/prisma/db";
import { Session }           from "next-auth";
import PenaltyRulesClient    from "./PenaltyRulesClient";

export default async function PenaltyRulesPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session  = (await getServerSession(authOptions)) as Session | null;
  const schoolId = session?.user?.school?.id;
  const userId   = session?.user?.id;
  if (!schoolId || !userId) redirect("/login");

  const rules = await db.penaltyRule.findMany({
    where:   { schoolId },
    orderBy: [{ isActive: "desc" }, { daysOverdue: "asc" }],
  });

  const rulesForUI = rules.map((r) => ({
    id:          r.id,
    name:        r.name,
    description: r.description ?? null,
    daysOverdue: r.daysOverdue,
    percentage:  r.percentage  ?? null,
    fixedAmount: r.fixedAmount ?? null,
    isRecurring: r.isRecurring,
    isActive:    r.isActive,
    createdAt:   r.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <PenaltyRulesClient
        initialRules={rulesForUI}
        schoolId={schoolId}
        userId={userId}
      />
    </div>
  );
}