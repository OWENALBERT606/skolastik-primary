// lib/fees/utils.ts

import { db } from "@/prisma/db";

/**
 * Generates a unique invoice number like: INV-2025-T1-00042
 */
export async function generateInvoiceNumber(schoolId: string, termId: string): Promise<string> {
  const year = new Date().getFullYear();
  const term = await db.academicTerm.findUnique({
    where: { id: termId },
    select: { name: true },
  });

  const termCode = (term?.name ?? "T")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3);

  // Atomic counter using Prisma — count existing invoices this term
  const count = await db.invoice.count({
    where: {
      studentFeeAccount: { schoolId, termId },
    },
  });

  const seq = String(count + 1).padStart(5, "0");
  return `INV-${year}-${termCode}-${seq}`;
}

/**
 * Generates a unique receipt number like: RCT-20250215-00087
 */
export async function generateReceiptNumber(): Promise<string> {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");

  const count = await db.feeReceipt.count({
    where: {
      issuedAt: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      },
    },
  });

  const seq = String(count + 1).padStart(5, "0");
  return `RCT-${datePart}-${seq}`;
}