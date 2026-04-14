// types/next-auth.d.ts
import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      roles: Role[];
      permissions: string[];
       school?: {
      id: string;
      slug: string;
      name: string;
    } | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    roles: Role[];
    permissions: string[];
    name?: string | null;
    email?: string | null;
    image?: string | null;
     school?: {
      id: string;
      slug: string;
      name: string;
    } | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    roles: Role[];
    permissions: string[];
     school?: {
      id: string;
      slug: string;
      name: string;
    } | null;
  }
}
