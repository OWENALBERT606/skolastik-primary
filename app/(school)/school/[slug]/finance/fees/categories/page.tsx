// app/school/[slug]/finance/fees/categories/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import { redirect } from "next/navigation";
import { db } from "@/prisma/db";
import { Session } from "next-auth";
import FeeCategoriesClient from "./components/FeeCategoriesClient";

export default async function FeeCategoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = (await getServerSession(authOptions)) as Session | null;
  const schoolId = session?.user?.school?.id;
  const userId   = session?.user?.id;

  if (!schoolId || !slug || !userId) {
    redirect("/login");
  }

  // Fetch all fee categories with usage counts
  const categories = await db.feeCategory.findMany({
    where: { schoolId },
    orderBy: [{ isMandatory: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          structureItems: true,
          invoiceItems:   true,
        },
      },
    },
  });

  // Shape data for the client component
  const categoriesForUI = categories.map((cat) => ({
    id:          cat.id,
    name:        cat.name,
    code:        cat.code,
    description: cat.description,
    isActive:    cat.isActive,
    isMandatory: cat.isMandatory,
    isOptional:  cat.isOptional,
    createdAt:   cat.createdAt,
    updatedAt:   cat.updatedAt,
    schoolId:    cat.schoolId,
    stats: {
      totalStructureItems: cat._count.structureItems,
      totalInvoiceItems:   cat._count.invoiceItems,
      isInUse:             cat._count.structureItems > 0 || cat._count.invoiceItems > 0,
    },
  }));

  return (
    <div className="p-6">
      <FeeCategoriesClient
        initialCategories={categoriesForUI}
        schoolId={schoolId}
      />
    </div>
  );
}