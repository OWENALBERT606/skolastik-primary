import { db } from "@/prisma/db";

export async function generateReceiptNumber(): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await db.systemPayment.count();
  const seq   = String(count + 1).padStart(4, "0");
  return `RCP-${year}-${seq}`;
}
