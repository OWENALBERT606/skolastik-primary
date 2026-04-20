import { db }          from "@/prisma/db";
import UsersClient      from "./users-client";

export default async function UsersPage() {
  const [users, roles] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        roles:   true,
        school:  { select: { id: true, name: true, code: true } },
      },
    }),
    db.role.findMany({ orderBy: { displayName: "asc" } }),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <UsersClient users={users as any} roles={roles} />
    </div>
  );
}
