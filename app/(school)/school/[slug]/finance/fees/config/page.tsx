// app/school/[slug]/finance/fees/config/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import { redirect } from "next/navigation";
import { db } from "@/prisma/db";
import { Session } from "next-auth";
import AutoInvoiceConfigClient from "./components/AutoInvoiceConfigClient";

export default async function AutoInvoiceConfigPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session  = (await getServerSession(authOptions)) as Session | null;
  const schoolId = session?.user?.school?.id;
  const userId   = session?.user?.id;

  if (!schoolId || !slug || !userId) {
    redirect("/login");
  }

  // Active academic year + its terms
  const activeYear = await db.academicYear.findFirst({
    where: { schoolId, isActive: true },
    include: {
      terms: {
        orderBy: { termNumber: "asc" },
        select: { id: true, name: true, termNumber: true, isActive: true },
      },
    },
  });

  const terms          = activeYear?.terms ?? [];
  const activeTerm     = terms.find((t) => t.isActive) ?? terms[0] ?? null;
  const academicYearId = activeYear?.id ?? "";

  // Load existing config for the active term (if any)
  const existingConfig = activeTerm
    ? await db.autoInvoiceConfig.findUnique({
        where: {
          schoolId_academicYearId_termId: {
            schoolId,
            academicYearId,
            termId: activeTerm.id,
          },
        },
      })
    : null;

  return (
    <div className="p-6">
      <AutoInvoiceConfigClient
        schoolId={schoolId}
        academicYearId={academicYearId}
        terms={terms}
        activeTermId={activeTerm?.id ?? ""}
        existingConfig={existingConfig}
      />
    </div>
  );
}