import { db } from "@/prisma/db";
import InventoryPage from "./components/inventories";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!school) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        School not found:{" "}
        <code className="ml-2 font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded">
          {slug}
        </code>
      </div>
    );
  }

  return <InventoryPage schoolId={school.id} />;
}