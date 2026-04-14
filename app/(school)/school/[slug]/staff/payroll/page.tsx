// app/(school)/school/[slug]/staff/payroll/page.tsx
// SERVER COMPONENT — resolves [slug] → real school.id before rendering client

import { notFound } from "next/navigation";
import { db } from "@/prisma/db";
import PayrollClient from "../components/payroll-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PayrollPage({ params }: Props) {
  const { slug } = await params;

  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!school) notFound();

  return (
    <PayrollClient
      slug={slug}
      schoolId={school.id}
      schoolName={school.name}
    />
  );
}