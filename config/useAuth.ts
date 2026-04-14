


// config/useAuth.ts
import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  roles: Role[];
  permissions: string[];
  name?: string | null;
  email?: string | null;
  image?: string | null;
  school?: { id: string; slug: string; name: string } | null;
  loginAs?: "teacher" | "staff" | "admin" | "student" | "parent";
}

async function getTokenData() {
  const cookieStore = await cookies();
  const headersList = await headers();


  const token = await getToken({
    req: {
      cookies: Object.fromEntries(
        cookieStore.getAll().map((c) => [c.name, c.value])
      ),
      headers: Object.fromEntries(headersList.entries()),
    } as any,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  return token;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const token = await getTokenData();

  if (!token) {
    redirect("/login");
  }

  return {
    id: token.id as string,
    firstName: token.firstName as string | null,
    lastName: token.lastName as string | null,
    phone: token.phone as string | null,
    roles: (token.roles as Role[]) ?? [],
    permissions: (token.permissions as string[]) ?? [],
    name: token.name,
    email: token.email,
    image: token.picture as string | null,
    school: token.school as { id: string; slug: string; name: string } | null,
    loginAs: (token.loginAs as "teacher" | "staff" | "admin" | "student" | "parent") ?? "teacher",
  };
}

export async function checkPermission(requiredPermission: string) {
  const token = await getTokenData();

  if (!token) redirect("/login");

  const userPermissions = (token.permissions as string[]) ?? [];

  if (!userPermissions.includes(requiredPermission)) {
    redirect("/unauthorized");
  }

  return true;
}

export async function checkAnyPermission(permissions: string[]) {
  const token = await getTokenData();

  if (!token) redirect("/login");

  const userPermissions = (token.permissions as string[]) ?? [];

  if (!permissions.some((p) => userPermissions.includes(p))) {
    redirect("/unauthorized");
  }

  return true;
}

export async function checkAllPermissions(permissions: string[]) {
  const token = await getTokenData();

  if (!token) redirect("/login");

  const userPermissions = (token.permissions as string[]) ?? [];

  if (!permissions.every((p) => userPermissions.includes(p))) {
    redirect("/unauthorized");
  }

  return true;
}