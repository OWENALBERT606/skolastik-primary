// "use client";

// import { useSession } from "next-auth/react";

// export function usePermission() {
//   const { data: session } = useSession();

//   const hasPermission = (permission: string): boolean => {
//     if (!session?.user?.permissions) return false;
//     return session.user.permissions.includes(permission);
//   };

//   const hasAnyPermission = (permissions: string[]): boolean => {
//     if (!session?.user?.permissions) return false;
//     return permissions.some((permission) =>
//       session.user.permissions.includes(permission)
//     );
//   };

//   const hasAllPermissions = (permissions: string[]): boolean => {
//     if (!session?.user?.permissions) return false;
//     return permissions.every((permission) =>
//       session.user.permissions.includes(permission)
//     );
//   };

//   return {
//     hasPermission,
//     hasAnyPermission,
//     hasAllPermissions,
//   };
// }




"use client";

import { useSession } from "next-auth/react";
import type { Role } from "@prisma/client";

interface SessionUser {
  id: string;
  roles: Role[];
  permissions: string[];
  school?: { id: string; slug: string; name: string } | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function usePermission() {
  const { data: session } = useSession();
  const user = session?.user as unknown as SessionUser | undefined;

  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user?.permissions) return false;
    return permissions.some((p) => user.permissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user?.permissions) return false;
    return permissions.every((p) => user.permissions.includes(p));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    user,
    session,
  };
}