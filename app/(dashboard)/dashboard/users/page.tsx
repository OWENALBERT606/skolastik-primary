import DataTable from "@/components/DataTableComponents/DataTable";
import TableHeader from "@/components/dashboard/Tables/TableHeader";
import { columns } from "./columns";
import { db } from "@/prisma/db";

export default async function page() {
  // Only show users with the schooladmin role
  const users = await db.user.findMany({
    where: {
      roles: {
        some: {
          roleName: { in: ["schooladmin", "school_admin", "SCHOOLADMIN"] },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      roles:        true,
      schoolAdmins: true,
    },
  });

  return (
    <div className="p-8">
      <TableHeader
        title="School Admins"
        linkTitle="Add User"
        href="/dashboard/users/new"
        data={users}
        model="user"
      />
      <DataTable columns={columns} data={users} />
    </div>
  );
}
