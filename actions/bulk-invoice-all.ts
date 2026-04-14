"use server";

import { db }             from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { recalculateAccountBalance } from "./fee-account-invoice";
import {
  InvoiceStatus, InvoiceTrigger, TransactionType, AccountStatus,
} from "@prisma/client";

type Result =
  | { ok: true;  data: { success: number; skipped: number; failed: number; errors: string[] } }
  | { ok: false; error: string };

async function generateInvoiceNumber(schoolId: string, termId: string): Promise<string> {
  const year     = new Date().getFullYear();
  const term     = await db.academicTerm.findUnique({ where: { id: termId }, select: { name: true } });
  const termCode = (term?.name ?? "T").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 3);
  const count    = await db.invoice.count({ where: { studentFeeAccount: { schoolId, termId } } });
  return `INV-${year}-${termCode}-${String(count + 1).padStart(5, "0")}`;
}

async function getPreviousTermBalance(studentId: string, currentTermId: string, schoolId: string): Promise<number> {
  const prev = await db.studentFeeAccount.findFirst({
    where:   { studentId, schoolId, termId: { not: currentTermId } },
    orderBy: [{ academicYear: { startDate: "desc" } }, { term: { termNumber: "desc" } }],
    select:  { balance: true },
  });
  return prev?.balance ?? 0;
}

/**
 * Bulk-invoice ALL active enrolled students in a term, across all classes.
 * Bypasses the auto-invoice config check — bursar-triggered manual run.
 * Skips students who already have an invoice for this term.
 */
export async function bulkInvoiceAllStudents(input: {
  schoolId:      string;
  academicYearId: string;
  termId:        string;
  triggeredById: string;
  includeCarryForward?: boolean;
  applyBursaries?:      boolean;
}): Promise<Result> {
  const {
    schoolId, academicYearId, termId, triggeredById,
    includeCarryForward = true,
    applyBursaries      = true,
  } = input;

  try {
    // All active enrollments for this term
    const enrollments = await db.enrollment.findMany({
      where: {
        termId,
        academicYearId,
        status: "ACTIVE",
        student: { schoolId },
      },
      select: {
        studentId:   true,
        classYearId: true,
        student:     { select: { schoolId: true } },
      },
    });

    if (enrollments.length === 0) {
      return { ok: false, error: "No active enrollments found for this term." };
    }

    let success = 0, skipped = 0, failed = 0;
    const errors: string[] = [];

    for (const enr of enrollments) {
      try {
        // Skip if already invoiced this term
        const existing = await db.studentFeeAccount.findUnique({
          where:  { studentId_academicYearId_termId: { studentId: enr.studentId, academicYearId, termId } },
          select: { id: true, autoInvoiceGenerated: true },
        });
        if (existing?.autoInvoiceGenerated) { skipped++; continue; }

        // Get fee structure for this class + term
        const feeStructure = await db.feeStructure.findUnique({
          where: { academicYearId_termId_classYearId: { academicYearId, termId, classYearId: enr.classYearId } },
          include: {
            items: {
              include: { feeCategory: { select: { id: true, name: true, isMandatory: true, isActive: true } } },
              where:   { feeCategory: { isActive: true } },
            },
          },
        });

        if (!feeStructure || !feeStructure.isPublished || feeStructure.items.length === 0) {
          skipped++;
          continue; // No published structure for this class — skip silently
        }

        const feeItemsTotal = feeStructure.items.reduce((s, i) => s + i.amount, 0);

        // Carry forward
        const carryForward = includeCarryForward
          ? await getPreviousTermBalance(enr.studentId, termId, schoolId)
          : 0;

        // Bursaries
        let totalDiscount = 0;
        const bursaryApps: { studentBursaryId: string; bursaryId: string; amount: number }[] = [];

        if (applyBursaries) {
          const studentBursaries = await db.studentBursary.findMany({
            where: {
              studentId: enr.studentId,
              schoolId,
              isActive:  true,
              OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
            },
            include: { bursary: true },
          });
          for (const sb of studentBursaries) {
            const disc = sb.bursary.percentage
              ? parseFloat(((sb.bursary.percentage / 100) * feeItemsTotal).toFixed(2))
              : (sb.bursary.fixedAmount ?? 0);
            totalDiscount += disc;
            bursaryApps.push({ studentBursaryId: sb.id, bursaryId: sb.bursaryId, amount: disc });
          }
          totalDiscount = Math.min(totalDiscount, feeItemsTotal);
        }

        const positiveCarry  = carryForward > 0 ? carryForward : 0;
        const creditCarry    = carryForward < 0 ? Math.abs(carryForward) : 0;
        const invoiceBalance = feeItemsTotal - totalDiscount + positiveCarry - creditCarry;

        await db.$transaction(async (tx) => {
          const feeAccount = await tx.studentFeeAccount.upsert({
            where:  { studentId_academicYearId_termId: { studentId: enr.studentId, academicYearId, termId } },
            create: { studentId: enr.studentId, academicYearId, termId, schoolId, carryForward, balance: 0, status: "ACTIVE" as AccountStatus },
            update: { carryForward },
          });

          const invoiceNumber = await generateInvoiceNumber(schoolId, termId);

          const invoice = await tx.invoice.create({
            data: {
              studentFeeAccountId: feeAccount.id,
              feeStructureId:      feeStructure.id,
              invoiceNumber,
              status:      "ISSUED" as InvoiceStatus,
              trigger:     "MANUAL"  as InvoiceTrigger,
              issueDate:   new Date(),
              dueDate:     feeStructure.items[0]?.dueDate ?? null,
              totalAmount: feeItemsTotal,
              discountAmount: totalDiscount,
              balance:     Math.max(0, invoiceBalance),
              createdById: triggeredById,
              items: {
                create: feeStructure.items.map((item) => ({
                  feeCategoryId: item.feeCategoryId,
                  description:   item.feeCategory.name,
                  amount:        item.amount,
                  quantity:      1,
                  unitPrice:     item.amount,
                })),
              },
            },
          });

          await tx.feeTransaction.create({
            data: {
              studentFeeAccountId: feeAccount.id,
              invoiceId:           invoice.id,
              transactionType:     "INVOICE" as TransactionType,
              amount:              feeItemsTotal,
              description:         `Bulk invoice: ${feeStructure.name ?? "Term fees"}`,
              createdById:         triggeredById,
            },
          });

          if (carryForward !== 0) {
            await tx.feeTransaction.create({
              data: {
                studentFeeAccountId: feeAccount.id,
                invoiceId:           invoice.id,
                transactionType:     "CARRY_FORWARD" as TransactionType,
                amount:              Math.abs(carryForward),
                description:         carryForward > 0 ? "Arrears carried forward" : "Credit carried forward",
                createdById:         triggeredById,
              },
            });
          }

          for (const bApp of bursaryApps) {
            await tx.feeTransaction.create({
              data: {
                studentFeeAccountId: feeAccount.id,
                invoiceId:           invoice.id,
                transactionType:     "DISCOUNT" as TransactionType,
                amount:              bApp.amount,
                description:         "Bursary discount applied",
                createdById:         triggeredById,
              },
            });
            await tx.bursaryAllocation.create({
              data: {
                studentFeeAccountId: feeAccount.id,
                bursaryId:           bApp.bursaryId,
                studentBursaryId:    bApp.studentBursaryId,
                amountAwarded:       bApp.amount,
                approvedById:        triggeredById,
                notes:               "Bulk invoice — bursar triggered",
              },
            });
          }

          await recalculateAccountBalance(feeAccount.id, tx);

          await tx.studentFeeAccount.update({
            where: { id: feeAccount.id },
            data:  { autoInvoiceGenerated: true, autoInvoiceGeneratedAt: new Date() },
          });
        });

        success++;
      } catch (err: any) {
        failed++;
        errors.push(`Student ${enr.studentId}: ${err?.message ?? "Unknown error"}`);
      }
    }

    revalidatePath(`/school/${schoolId}/bursar/fees/accounts`);
    revalidatePath(`/school/${schoolId}/finance/fees/accounts`);

    return { ok: true, data: { success, skipped, failed, errors } };
  } catch (err: any) {
    console.error("bulkInvoiceAllStudents error:", err);
    return { ok: false, error: err?.message ?? "Failed to bulk generate invoices." };
  }
}
