import { notFound } from "next/navigation";
import { db } from "@/prisma/db";
import RolesClient from "./components/roles-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StaffRolesPage({ params }: Props) {
  const { slug } = await params;

  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!school) notFound();

  return <RolesClient slug={slug} schoolId={school.id} schoolName={school.name} />;
}
