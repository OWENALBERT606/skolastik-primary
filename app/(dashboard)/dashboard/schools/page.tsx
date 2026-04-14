// app/super-admin/schools/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { getAllSchools } from "@/actions/schools";
import { getAllUsers } from "@/actions/users";
import { getAuthenticatedUser } from "@/config/useAuth";
import { authOptions } from "@/config/auth";
import SchoolsClient from "./components/school-client";
export default async function SchoolsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await getAuthenticatedUser();

  const [result, usersData] = await Promise.all([
    getAllSchools(),
    getAllUsers(),
  ]);

  if (!result.ok) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error loading schools: {result.message}</p>
      </div>
    );
  }

  const users = Array.isArray(usersData)
    ? usersData.map((u) => ({
        id: u.id,
        name: u.name || "Unknown",
        email: u.email || "",
        image: u.image || null,
        role:
          u.roles?.[0]?.displayName || u.roles?.[0]?.roleName || undefined,
      }))
    : [];

  return (
    <SchoolsClient
      initialSchools={result.data ?? []}
      userId={user?.id ?? ""}
      users={users}
    />
  );
}