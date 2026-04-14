import { getServerSession } from "next-auth/next";
import { authOptions }      from "@/config/auth";
import { cookies }          from "next/headers";

export async function requireSuperAdmin(): Promise<{ ok: true } | { ok: false; status: number }> {
  await cookies(); // required in Next.js 15 before getServerSession
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false, status: 401 };

  const user = (session as any)?.user;
  const roles       = (user?.roles ?? []).map((r: any) => (r.roleName ?? "").toLowerCase());
  const loginAs     = (user?.loginAs ?? "").toLowerCase();
  const primaryRole = (user?.capabilities?.primaryRole ?? "").toLowerCase();

  const isAdmin =
    roles.some((r: string) => r.includes("admin") || r.includes("super")) ||
    loginAs === "admin" ||
    primaryRole.includes("admin") ||
    primaryRole === "schooladmin";

  if (!isAdmin) return { ok: false, status: 403 };
  return { ok: true };
}
