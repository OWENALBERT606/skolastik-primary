"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import {
  StudentFeeAccount,
  Invoice,
  InvoiceStatus,
  InvoiceTrigger,
  TransactionType,
  AccountStatus,
} from "@prisma/client";
import { recalculateAccountBalance } from "./fee-account-invoice";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

interface EnrollmentPayload {
  studentId: string;
  academicYearId: string;
  termId: string;
  classYearId: string;
  schoolId: string;
  enrolledById: string;
}

interface AutoInvoiceResult {
  studentFeeAccountId: string;
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  carryForward: number;
  discountApplied: number;
  wasSkipped: boolean;
  skipReason?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// INVOICE NUMBER GENERATOR
// ════════════════════════════════════════════════════════════════════════════

async function generateInvoiceNumber(schoolId: string, termId: string): Promise<string> {
  const year = new Date().getFullYear();
  const term = await db.academicTerm.findUnique({
    where: { id: termId },
    select: { name: true },
  });
  const termCode = (term?.name ?? "T")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3);

  const count = await db.invoice.count({
    where: { studentFeeAccount: { schoolId, termId } },
  });
  return `INV-${year}-${termCode}-${String(count + 1).padStart(5, "0")}`;
}

// ════════════════════════════════════════════════════════════════════════════
// CARRY FORWARD LOOKUP — resolves previous term balance for a student
// ════════════════════════════════════════════════════════════════════════════

async function getPreviousTermBalance(
  studentId: string,
  currentTermId: string,
  schoolId: string
): Promise<number> {
  // Get the current term's number and year so we can find the immediately preceding term
  const currentTerm = await db.academicTerm.findUnique({
    where:  { id: currentTermId },
    select: { termNumber: true, academicYearId: true, academicYear: { select: { year: true, startDate: true } } },
  });

  if (!currentTerm) return 0;

  // Find the most recent StudentFeeAccount for this student ordered by
  // academic year desc, then term number desc — excluding the current term
  const previousAccount = await db.studentFeeAccount.findFirst({
    where: {
      studentId,
      schoolId,
      termId: { not: currentTermId },
    },
    orderBy: [
      { academicYear: { startDate: "desc" } },
      { term: { termNumber: "desc" } },
    ],
    select: { balance: true },
  });

  // Positive balance = arrears (student owes money) → carry forward as debt
  // Negative balance = overpaid (credit) → carry forward as credit
  return previousAccount?.balance ?? 0;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN — generateAutoInvoiceOnEnrollment
// Call this immediately after an Enrollment row is created.
// It is idempotent — safe to call multiple times for the same student/term.
// ════════════════════════════════════════════════════════════════════════════

export async function generateAutoInvoiceOnEnrollment(
  payload: EnrollmentPayload
): Promise<ActionResult<AutoInvoiceResult>> {
  const { studentId, academicYearId, termId, classYearId, schoolId, enrolledById } = payload;

  try {
    // ── 1. Check auto-invoice config ─────────────────────────────────────
    const config = await db.autoInvoiceConfig.findUnique({
      where: {
        schoolId_academicYearId_termId: { schoolId, academicYearId, termId },
      },
    });

    if (!config || !config.isEnabled || !config.generateOnEnrollment) {
      return {
        ok: true,
        data: {
          studentFeeAccountId: "",
          invoiceId: "",
          invoiceNumber: "",
          totalAmount: 0,
          carryForward: 0,
          discountApplied: 0,
          wasSkipped: true,
          skipReason: "Auto-invoice not enabled for this term",
        },
      };
    }

    // ── 2. Check for existing account (idempotency guard) ─────────────────
    const existingAccount = await db.studentFeeAccount.findUnique({
      where: { studentId_academicYearId_termId: { studentId, academicYearId, termId } },
    });

    if (existingAccount?.autoInvoiceGenerated) {
      return {
        ok: true,
        data: {
          studentFeeAccountId: existingAccount.id,
          invoiceId: "",
          invoiceNumber: "",
          totalAmount: existingAccount.totalInvoiced,
          carryForward: existingAccount.carryForward,
          discountApplied: existingAccount.totalDiscount,
          wasSkipped: true,
          skipReason: "Auto-invoice already generated for this student and term",
        },
      };
    }

    // ── 3. Get published fee structure ────────────────────────────────────
    const feeStructure = await db.feeStructure.findUnique({
      where: {
        academicYearId_termId_classYearId: { academicYearId, termId, classYearId },
      },
      include: {
        items: {
          include: { feeCategory: { select: { id: true, name: true, isMandatory: true, isActive: true } } },
          where: { feeCategory: { isActive: true } },
        },
      },
    });

    if (!feeStructure) {
      return {
        ok: false,
        error: `No fee structure found for this class and term. Create and publish one first.`,
      };
    }

    if (!feeStructure.isPublished) {
      return {
        ok: false,
        error: "Fee structure exists but is not published. Publish it before enrolling students.",
      };
    }

    if (feeStructure.items.length === 0) {
      return { ok: false, error: "Fee structure has no active items" };
    }

    // ── 4. Calculate carry-forward ────────────────────────────────────────
    const carryForward = config.includeCarryForward
      ? await getPreviousTermBalance(studentId, termId, schoolId)
      : 0;

    // ── 5. Get active student bursaries ───────────────────────────────────
    const studentBursaries = config.applyBursaries
      ? await db.studentBursary.findMany({
          where: {
            studentId,
            schoolId,
            isActive: true,
            OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
          },
          include: { bursary: true },
        })
      : [];

    // ── 6. Calculate totals ───────────────────────────────────────────────
    const feeItemsTotal = feeStructure.items.reduce((sum, item) => sum + item.amount, 0);

    let totalDiscount = 0;
    const bursaryApplications: { studentBursaryId: string; bursaryId: string; amount: number }[] = [];

    for (const sb of studentBursaries) {
      const discountAmount = sb.bursary.percentage
        ? parseFloat(((sb.bursary.percentage / 100) * feeItemsTotal).toFixed(2))
        : (sb.bursary.fixedAmount ?? 0);

      totalDiscount += discountAmount;
      bursaryApplications.push({
        studentBursaryId: sb.id,
        bursaryId: sb.bursaryId,
        amount: discountAmount,
      });
    }

    // Discount cannot exceed fee total
    totalDiscount = Math.min(totalDiscount, feeItemsTotal);

    const positiveCarry = carryForward > 0 ? carryForward : 0;
    const creditCarry   = carryForward < 0 ? Math.abs(carryForward) : 0;
    const invoiceBalance = feeItemsTotal - totalDiscount + positiveCarry - creditCarry;

    // ── 7. Execute atomically ─────────────────────────────────────────────
    const result = await db.$transaction(async (tx) => {
      // 7a. Create or update StudentFeeAccount
      const feeAccount = await tx.studentFeeAccount.upsert({
        where: { studentId_academicYearId_termId: { studentId, academicYearId, termId } },
        create: {
          studentId,
          academicYearId,
          termId,
          schoolId,
          carryForward,
          balance: 0,
          status: "ACTIVE" as AccountStatus,
        },
        update: { carryForward },
      });

      const invoiceNumber = await generateInvoiceNumber(schoolId, termId);

      // 7b. Create invoice
      const invoice = await tx.invoice.create({
        data: {
          studentFeeAccountId: feeAccount.id,
          feeStructureId: feeStructure.id,
          invoiceNumber,
          status: "ISSUED" as InvoiceStatus,
          trigger: "AUTO_ENROLLMENT" as InvoiceTrigger,
          issueDate: new Date(),
          dueDate: feeStructure.items[0]?.dueDate ?? null,
          totalAmount: feeItemsTotal,
          discountAmount: totalDiscount,
          balance: Math.max(0, invoiceBalance),
          createdById: enrolledById,
          items: {
            create: feeStructure.items.map((item) => ({
              feeCategoryId: item.feeCategoryId,
              description: item.feeCategory.name,
              amount: item.amount,
              quantity: 1,
              unitPrice: item.amount,
            })),
          },
        },
      });

      // 7c. INVOICE ledger transaction
      await tx.feeTransaction.create({
        data: {
          studentFeeAccountId: feeAccount.id,
          invoiceId: invoice.id,
          transactionType: "INVOICE" as TransactionType,
          amount: feeItemsTotal,
          description: `Auto-invoice: ${feeStructure.name ?? "Term fees"}`,
          createdById: enrolledById,
        },
      });

      // 7d. CARRY_FORWARD ledger transaction (if applicable)
      if (carryForward !== 0) {
        await tx.feeTransaction.create({
          data: {
            studentFeeAccountId: feeAccount.id,
            invoiceId: invoice.id,
            transactionType: "CARRY_FORWARD" as TransactionType,
            amount: Math.abs(carryForward),
            description:
              carryForward > 0
                ? "Arrears carried forward from previous term"
                : "Credit carried forward from previous term",
            createdById: enrolledById,
          },
        });
      }

      // 7e. DISCOUNT transactions for each bursary applied
      for (const bApp of bursaryApplications) {
        await tx.feeTransaction.create({
          data: {
            studentFeeAccountId: feeAccount.id,
            invoiceId: invoice.id,
            transactionType: "DISCOUNT" as TransactionType,
            amount: bApp.amount,
            description: "Bursary discount applied on enrollment",
            createdById: enrolledById,
          },
        });

        await tx.bursaryAllocation.create({
          data: {
            studentFeeAccountId: feeAccount.id,
            bursaryId: bApp.bursaryId,
            studentBursaryId: bApp.studentBursaryId,
            amountAwarded: bApp.amount,
            approvedById: enrolledById,
            notes: "Auto-applied on term enrollment",
          },
        });
      }

      // 7f. Recalculate balance from all ledger entries
      await recalculateAccountBalance(feeAccount.id, tx);

      // 7g. Mark auto-invoice as done
      await tx.studentFeeAccount.update({
        where: { id: feeAccount.id },
        data: {
          autoInvoiceGenerated: true,
          autoInvoiceGeneratedAt: new Date(),
        },
      });

      // 7h. Queue notification if configured
      if (config.sendNotification) {
        const student = await tx.student.findUnique({
          where: { id: studentId },
          select: {
            parent: { select: { phone: true, email: true } },
            firstName: true,
            lastName: true,
          },
        });

        if (student?.parent) {
          await tx.feeNotification.create({
            data: {
              schoolId,
              studentFeeAccountId: feeAccount.id,
              channel: student.parent.phone ? "SMS" : "EMAIL",
              recipientPhone: student.parent.phone ?? undefined,
              recipientEmail: student.parent.email ?? undefined,
              subject: "Fee Invoice Generated",
              body: `Dear Parent, an invoice of ${feeItemsTotal.toLocaleString()} has been generated for ${student.firstName} ${student.lastName}. Balance due: ${Math.max(0, invoiceBalance).toLocaleString()}.`,
              triggerType: "INVOICE_GENERATED",
              triggerId: invoice.id,
              createdById: enrolledById,
            },
          });
        }
      }

      return { feeAccount, invoice };
    });

    revalidatePath(`/dashboard/fees/accounts`);
    revalidatePath(`/dashboard/students/${studentId}`);

    return {
      ok: true,
      data: {
        studentFeeAccountId: result.feeAccount.id,
        invoiceId: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber,
        totalAmount: feeItemsTotal,
        carryForward,
        discountApplied: totalDiscount,
        wasSkipped: false,
      },
    };
  } catch (error) {
    console.error("Error generating auto invoice on enrollment:", error);
    return { ok: false, error: "Failed to generate invoice. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// RETRY — regenerate for a student if skipped or errored
// ════════════════════════════════════════════════════════════════════════════

export async function retryAutoInvoice(
  enrollmentId: string,
  enrolledById: string
): Promise<ActionResult<AutoInvoiceResult>> {
  try {
    if (!enrollmentId) return { ok: false, error: "Enrollment ID is required" };

    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        studentId: true,
        academicYearId: true,
        termId: true,
        classYearId: true,
        student: { select: { schoolId: true } },
      },
    });

    if (!enrollment) return { ok: false, error: "Enrollment not found" };

    // Reset flag so idempotency guard doesn't block
    await db.studentFeeAccount.updateMany({
      where: {
        studentId: enrollment.studentId,
        academicYearId: enrollment.academicYearId,
        termId: enrollment.termId,
      },
      data: { autoInvoiceGenerated: false, autoInvoiceGeneratedAt: null },
    });

    return generateAutoInvoiceOnEnrollment({
      studentId: enrollment.studentId,
      academicYearId: enrollment.academicYearId,
      termId: enrollment.termId,
      classYearId: enrollment.classYearId,
      schoolId: enrollment.student.schoolId,
      enrolledById,
    });
  } catch (error) {
    console.error("Error retrying auto invoice:", error);
    return { ok: false, error: "Failed to retry invoice generation" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BULK GENERATE — for a full class (retroactive, admin-triggered)
// ════════════════════════════════════════════════════════════════════════════

export async function bulkGenerateAutoInvoices(input: {
  schoolId: string;
  academicYearId: string;
  termId: string;
  classYearId: string;
  triggeredById: string;
}): Promise<
  ActionResult<{ success: number; skipped: number; failed: number; errors: string[] }>
> {
  try {
    const enrollments = await db.enrollment.findMany({
      where: {
        classYearId: input.classYearId,
        termId: input.termId,
        academicYearId: input.academicYearId,
        status: "ACTIVE",
        student: { schoolId: input.schoolId },
      },
      select: {
        studentId: true,
        classYearId: true,
        student: { select: { schoolId: true } },
      },
    });

    if (enrollments.length === 0) {
      return { ok: false, error: "No active enrollments found for this class and term" };
    }

    let success = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const enrollment of enrollments) {
      const result = await generateAutoInvoiceOnEnrollment({
        studentId: enrollment.studentId,
        academicYearId: input.academicYearId,
        termId: input.termId,
        classYearId: enrollment.classYearId,
        schoolId: enrollment.student.schoolId,
        enrolledById: input.triggeredById,
      });

      if (!result.ok) {
        failed++;
        errors.push(`Student ${enrollment.studentId}: ${result.error}`);
      } else if (result.data.wasSkipped) {
        skipped++;
      } else {
        success++;
      }
    }

    revalidatePath("/dashboard/fees/accounts");
    return { ok: true, data: { success, skipped, failed, errors } };
  } catch (error) {
    console.error("Error bulk generating auto invoices:", error);
    return { ok: false, error: "Failed to bulk generate invoices" };
  }
}