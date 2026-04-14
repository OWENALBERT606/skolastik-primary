

import {
    TransactionType,
  InvoiceStatus,
  InvoiceTrigger,
  AccountStatus,
 } from "@prisma/client";
import { generateInvoiceNumber, generateReceiptNumber } from "./utils";
import { db } from "@/prisma/db";

// ─── TYPES ──────────────────────────────────────────────────

interface EnrollmentPayload {
  studentId: string;
  academicYearId: string;
  termId: string;
  classYearId: string;
  schoolId: string;
  enrolledById: string;
}

interface AutoInvoiceResult {
  success: boolean;
  studentFeeAccountId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  carryForward?: number;
  message?: string;
  skipped?: boolean;
  skipReason?: string;
}

// ─── MAIN ENTRY POINT ───────────────────────────────────────

/**
 * Call this function inside your term enrollment logic.
 * It is idempotent — safe to call multiple times for same student/term.
 *
 * Example usage in your enrollment server action:
 *   await generateAutoInvoiceOnEnrollment({ studentId, academicYearId, termId, ... });
 */
export async function generateAutoInvoiceOnEnrollment(
  payload: EnrollmentPayload
): Promise<AutoInvoiceResult> {
  const { studentId, academicYearId, termId, classYearId, schoolId, enrolledById } = payload;

  // ── 1. Check if auto-invoice is configured and enabled ──
  const config = await db.autoInvoiceConfig.findUnique({
    where: { schoolId_academicYearId_termId: { schoolId, academicYearId, termId } },
  });

  if (!config || !config.isEnabled || !config.generateOnEnrollment) {
    return {
      success: true,
      skipped: true,
      skipReason: "Auto-invoice not enabled for this term",
    };
  }

  // ── 2. Get or create StudentFeeAccount ──────────────────
  let account = await db.studentFeeAccount.findUnique({
    where: { studentId_academicYearId_termId: { studentId, academicYearId, termId } },
  });

  if (account?.autoInvoiceGenerated) {
    return {
      success: true,
      skipped: true,
      skipReason: "Auto-invoice already generated for this student/term",
      studentFeeAccountId: account.id,
    };
  }

  // ── 3. Get the published fee structure for this class/term ─
  const feeStructure = await db.feeStructure.findUnique({
    where: { academicYearId_termId_classYearId: { academicYearId, termId, classYearId } },
    include: {
      items: {
        include: { feeCategory: true },
        where: { feeCategory: { isActive: true } },
      },
    },
  });

  if (!feeStructure) {
    return {
      success: false,
      message: `No published fee structure found for classYearId=${classYearId}, termId=${termId}`,
    };
  }

  if (!feeStructure.isPublished) {
    return {
      success: false,
      message: "Fee structure is not yet published. Publish it before enrolling students.",
    };
  }

  if (feeStructure.items.length === 0) {
    return {
      success: false,
      message: "Fee structure has no active items. Add fee items before enrolling.",
    };
  }

  // ── 4. Calculate carry forward from previous term ────────
  const carryForward = config.includeCarryForward
    ? await calculateCarryForward(studentId, academicYearId, termId, schoolId)
    : 0;

  // ── 5. Get active bursary allocations for this student ───
  // Bursaries from previous term that should carry forward
  const activeBursaries = config.applyBursaries
    ? await getActiveBursaries(studentId, schoolId)
    : [];

  // ── 6. Calculate invoice totals ──────────────────────────
  const feeItemsTotal = feeStructure.items.reduce((sum, item) => sum + item.amount, 0);

  let totalDiscount = 0;
  const bursaryApplications: { bursaryId: string; amount: number }[] = [];

  for (const bursary of activeBursaries) {
    const discountAmount = bursary.percentage
      ? parseFloat(((bursary.percentage / 100) * feeItemsTotal).toFixed(2))
      : bursary.fixedAmount ?? 0;
    totalDiscount += discountAmount;
    bursaryApplications.push({ bursaryId: bursary.id, amount: discountAmount });
  }

  totalDiscount = Math.min(totalDiscount, feeItemsTotal); // Can't discount more than total
  const netFees = feeItemsTotal - totalDiscount;
  const invoiceTotal = netFees + (carryForward > 0 ? carryForward : 0); // Only add positive carry-forward (arrears)
  const creditCarryForward = carryForward < 0 ? Math.abs(carryForward) : 0; // Overpaid in previous term

  // ── 7. Execute in a transaction ──────────────────────────
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
        status: AccountStatus.ACTIVE,
      },
      update: {
        carryForward,
        status: AccountStatus.ACTIVE,
      },
    });

    const invoiceNumber = await generateInvoiceNumber(schoolId, termId);

    // 7b. Create the invoice
    const invoice = await tx.invoice.create({
      data: {
        studentFeeAccountId: feeAccount.id,
        feeStructureId: feeStructure.id,
        invoiceNumber,
        status: InvoiceStatus.ISSUED,
        trigger: InvoiceTrigger.AUTO_ENROLLMENT,
        issueDate: new Date(),
        dueDate: feeStructure.items[0]?.dueDate ?? null,
        totalAmount: feeItemsTotal,
        discountAmount: totalDiscount,
        balance: invoiceTotal - creditCarryForward,
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

    // 7c. Record INVOICE transaction in ledger
    await tx.feeTransaction.create({
      data: {
        studentFeeAccountId: feeAccount.id,
        invoiceId: invoice.id,
        transactionType: TransactionType.INVOICE,
        amount: feeItemsTotal,
        description: `Auto-generated invoice for ${feeStructure.name ?? "term fees"}`,
        createdById: enrolledById,
      },
    });

    // 7d. Record carry-forward transaction if applicable
    if (carryForward !== 0) {
      await tx.feeTransaction.create({
        data: {
          studentFeeAccountId: feeAccount.id,
          invoiceId: invoice.id,
          transactionType: TransactionType.CARRY_FORWARD,
          amount: Math.abs(carryForward),
          description:
            carryForward > 0
              ? "Arrears carried forward from previous term"
              : "Credit carried forward from previous term",
          createdById: enrolledById,
        },
      });

      // Log the carry-forward for audit trail
      await tx.carryForwardLog.create({
        data: {
          studentId,
          schoolId,
          fromAcademicYearId: academicYearId, // resolved in helper below
          fromTermId: "",                      // resolved in helper below
          toAcademicYearId: academicYearId,
          toTermId: termId,
          fromStudentFeeAccountId: "",         // resolved in helper below
          toStudentFeeAccountId: feeAccount.id,
          amount: carryForward,
          processedById: enrolledById,
          notes: "Auto carry-forward on enrollment",
        },
      });
    }

    // 7e. Apply discounts as DISCOUNT transactions
    for (const bApp of bursaryApplications) {
      await tx.feeTransaction.create({
        data: {
          studentFeeAccountId: feeAccount.id,
          invoiceId: invoice.id,
          transactionType: TransactionType.DISCOUNT,
          amount: bApp.amount,
          description: `Bursary/discount applied`,
          createdById: enrolledById,
        },
      });

      await tx.bursaryAllocation.create({
        data: {
          studentFeeAccountId: feeAccount.id,
          bursaryId: bApp.bursaryId,
          amountAwarded: bApp.amount,
          approvedById: enrolledById,
          notes: "Auto-applied on term enrollment",
        },
      });
    }

    // 7f. Recalculate and update account balance
    const updatedAccount = await recalculateAccountBalance(tx, feeAccount.id);

    // 7g. Mark auto-invoice as generated
    await tx.studentFeeAccount.update({
      where: { id: feeAccount.id },
      data: {
        autoInvoiceGenerated: true,
        autoInvoiceGeneratedAt: new Date(),
      },
    });

    return { feeAccount: updatedAccount, invoice };
  });

  return {
    success: true,
    studentFeeAccountId: result.feeAccount.id,
    invoiceId: result.invoice.id,
    invoiceNumber: result.invoice.invoiceNumber,
    totalAmount: result.invoice.totalAmount,
    carryForward,
  };
}

// ─── RECALCULATE BALANCE ─────────────────────────────────────
// Called after every transaction. Never manually edit balances.
//
// balance = totalInvoiced + totalPenalty + carryForward
//         - totalDiscount - totalWaived - totalPaid + totalRefunded

export async function recalculateAccountBalance(
  tx: Omit<typeof db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  studentFeeAccountId: string
) {
  const transactions = await tx.feeTransaction.findMany({
    where: { studentFeeAccountId, isReversal: false },
    select: { transactionType: true, amount: true },
  });

  const account = await tx.studentFeeAccount.findUniqueOrThrow({
    where: { id: studentFeeAccountId },
    select: { carryForward: true },
  });

  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalDiscount = 0;
  let totalPenalty = 0;
  let totalWaived = 0;
  let totalRefunded = 0;

  for (const tx_ of transactions) {
    switch (tx_.transactionType) {
      case "INVOICE":      totalInvoiced += tx_.amount; break;
      case "PAYMENT":      totalPaid     += tx_.amount; break;
      case "DISCOUNT":     totalDiscount += tx_.amount; break;
      case "PENALTY":      totalPenalty  += tx_.amount; break;
      case "WAIVER":       totalWaived   += tx_.amount; break;
      case "REFUND":       totalRefunded += tx_.amount; break;
      // CARRY_FORWARD and ADJUSTMENT handled via carryForward field
    }
  }

  const carryForward = account.carryForward;
  const positiveCarry = carryForward > 0 ? carryForward : 0;
  const creditCarry = carryForward < 0 ? Math.abs(carryForward) : 0;

  const balance =
    totalInvoiced + totalPenalty + positiveCarry
    - totalDiscount - totalWaived - totalPaid - creditCarry + totalRefunded;

  const status: AccountStatus =
    balance < 0 ? "OVERPAID"
    : balance === 0 ? "CLEARED"
    : "ACTIVE";

  return tx.studentFeeAccount.update({
    where: { id: studentFeeAccountId },
    data: {
      totalInvoiced,
      totalPaid,
      totalDiscount,
      totalPenalty,
      totalWaived,
      totalRefunded,
      balance: parseFloat(balance.toFixed(2)),
      status,
    },
  });
}

// ─── HELPERS ────────────────────────────────────────────────

async function calculateCarryForward(
  studentId: string,
  academicYearId: string,
  termId: string,
  schoolId: string
): Promise<number> {
  // Get previous term's account balance
  // Note: you'll need to resolve "previous term" from your Term model ordering
  const previousAccount = await db.studentFeeAccount.findFirst({
    where: {
      studentId,
      schoolId,
      // Exclude current term — filter by term ordering in your app
      NOT: { termId },
    },
    orderBy: { createdAt: "desc" },
    select: { balance: true, termId: true, academicYearId: true },
  });

  if (!previousAccount) return 0;

  // Positive balance = student owes money (arrears)
  // Negative balance = student overpaid (credit)
  return previousAccount.balance;
}

async function getActiveBursaries(studentId: string, schoolId: string) {
  // Fetch active bursaries assigned to the student's profile
  // This depends on how you link bursaries to students in your system.
  // Adjust this query based on your Student model.
  return db.bursary.findMany({
    where: {
      schoolId,
      isActive: true,
      // Add student-specific filter if you have a StudentBursary join table
    },
    select: {
      id: true,
      name: true,
      percentage: true,
      fixedAmount: true,
    },
  });
}

// ─── RECORD PAYMENT ─────────────────────────────────────────
// Call this when admin records a payment against an invoice.

export async function recordPayment({
  studentFeeAccountId,
  invoiceId,
  amount,
  paymentMethod,
  referenceNumber,
  mobileMoneyNetwork,
  mobileMoneyPhone,
  mobileMoneyTxId,
  recordedById,
}: {
  studentFeeAccountId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  mobileMoneyNetwork?: string;
  mobileMoneyPhone?: string;
  mobileMoneyTxId?: string;
  recordedById: string;
}) {
  return db.$transaction(async (tx) => {
    // Record transaction
    const transaction = await tx.feeTransaction.create({
      data: {
        studentFeeAccountId,
        invoiceId,
        transactionType: TransactionType.PAYMENT,
        amount,
        paymentMethod: paymentMethod as any,
        referenceNumber,
        mobileMoneyNetwork,
        mobileMoneyPhone,
        mobileMoneyTxId,
        description: `Payment via ${paymentMethod}`,
        createdById: recordedById,
      },
    });

    // Update invoice paid amount and status
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      select: { totalAmount: true, paidAmount: true, discountAmount: true, waivedAmount: true },
    });

    const newPaidAmount = invoice.paidAmount + amount;
    const remaining = invoice.totalAmount - invoice.discountAmount - invoice.waivedAmount - newPaidAmount;
    const newStatus: InvoiceStatus =
      remaining <= 0 ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "ISSUED";

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balance: Math.max(0, remaining),
        status: newStatus,
      },
    });

    // Recalculate account balance
    await recalculateAccountBalance(tx, studentFeeAccountId);

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber();

    await tx.feeReceipt.create({
      data: {
        receiptNumber,
        transactionId: transaction.id,
        studentId: (await tx.studentFeeAccount.findUniqueOrThrow({
          where: { id: studentFeeAccountId },
          select: { studentId: true },
        })).studentId,
        schoolId: (await tx.studentFeeAccount.findUniqueOrThrow({
          where: { id: studentFeeAccountId },
          select: { schoolId: true },
        })).schoolId,
        amountPaid: amount,
        paymentMethod: paymentMethod as any,
      },
    });

    return { transactionId: transaction.id, receiptNumber };
  });
}