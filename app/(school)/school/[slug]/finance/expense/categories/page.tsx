import { db } from "@/prisma/db";
import CategoriesPage from "./components/categories-client";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!school) return <div>School not found</div>;

  return <CategoriesPage schoolId={school.id} />;
}