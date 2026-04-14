import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";

export function getAuthSession() {
  // return getServerSession(authOptions);
  return getServerSession(authOptions as any);
}
