"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { FeeTransaction, FeeReceipt, PaymentMethod, TransactionType } from "@prisma/client";
import { recalculateAccountBalance } from "./fee-account-invoice";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type PaymentResult = {
  transaction: FeeTransaction;
  receipt: FeeReceipt;
  updatedBalance: number;
};

type TransactionWithRelations = FeeTransaction & {
  invoice: { id: string; invoiceNumber: string } | null;
  receipt: { id: string; receiptNumber: string } | null;
  createdBy: { id: string; name: string } | null;
};

interface RecordPaymentInput {
  studentFeeAccountId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  description?: string;
  // Mobile money
  mobileMoneyNetwork?: string;
  mobileMoneyPhone?: string;
  mobileMoneyTxId?: string;
  recordedById: string;
}

interface RecordAdjustmentInput {
  studentFeeAccountId: string;
  amount: number;
  type: "PENALTY" | "REFUND" | "ADJUSTMENT";
  description: string;
  invoiceId?: string;
  createdById: string;
}

// ════════════════════════════════════════════════════════════════════════════
// RECEIPT NUMBER GENERATOR
// ════════════════════════════════════════════════════════════════════════════

async function generateReceiptNumber(): Promise<string> {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const count = await db.feeReceipt.count({ where: { issuedAt: { gte: startOfDay } } });
  return `RCT-${datePart}-${String(count + 1).padStart(5, "0")}`;
}

// ════════════════════════════════════════════════════════════════════════════
// RECORD PAYMENT
// ════════════════════════════════════════════════════════════════════════════

export async function recordPayment(
  input: RecordPaymentInput
): Promise<ActionResult<PaymentResult>> {
  try {
    if (!input.studentFeeAccountId) return { ok: false, error: "Account ID is required" };
    if (input.amount <= 0) return { ok: false, error: "Payment amount must be greater than zero" };
    if (!input.paymentMethod) return { ok: false, error: "Payment method is required" };
    if (!input.recordedById) return { ok: false, error: "Recorded by user ID is required" };

    if (input.paymentMethod === "MOBILE_MONEY") {
      if (!input.mobileMoneyPhone) return { ok: false, error: "Mobile money phone number is required" };
      if (!input.mobileMoneyNetwork) return { ok: false, error: "Mobile money network is required" };
    }

    const account = await db.studentFeeAccount.findUnique({
      where: { id: input.studentFeeAccountId },
      select: { id: true, studentId: true, schoolId: true },
    });
    if (!account) return { ok: false, error: "Student fee account not found" };

    // Validate invoice if provided
    if (input.invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: { id: input.invoiceId },
        select: { id: true, status: true, balance: true, studentFeeAccountId: true },
      });
      if (!invoice) return { ok: false, error: "Invoice not found" };
      if (invoice.studentFeeAccountId !== input.studentFeeAccountId) {
        return { ok: false, error: "Invoice does not belong to this fee account" };
      }
      if (invoice.status === "VOID" || invoice.status === "CANCELLED") {
        return { ok: false, error: "Cannot pay a void or cancelled invoice" };
      }
      if (invoice.status === "PAID") {
        return { ok: false, error: "Invoice is already fully paid" };
      }
    }

    const receiptNumber = await generateReceiptNumber();

    const result = await db.$transaction(async (tx) => {
      // 1. Create the transaction (immutable ledger entry)
      const transaction = await tx.feeTransaction.create({
        data: {
          studentFeeAccountId: input.studentFeeAccountId,
          invoiceId: input.invoiceId,
          transactionType: "PAYMENT" as TransactionType,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber?.trim(),
          description: input.description?.trim() ?? `Payment via ${input.paymentMethod}`,
          mobileMoneyNetwork: input.mobileMoneyNetwork,
          mobileMoneyPhone: input.mobileMoneyPhone,
          mobileMoneyTxId: input.mobileMoneyTxId,
          createdById: input.recordedById,
        },
      });

      // 2. Create the receipt
      const receipt = await tx.feeReceipt.create({
        data: {
          receiptNumber,
          transactionId: transaction.id,
          studentId: account.studentId,
          schoolId: account.schoolId,
          invoiceId: input.invoiceId,
          amountPaid: input.amount,
          paymentMethod: input.paymentMethod,
        },
      });

      // 3. Update invoice paid amount and status if linked
      if (input.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: input.invoiceId },
          select: { paidAmount: true, totalAmount: true, discountAmount: true, waivedAmount: true },
        });

        if (invoice) {
          const newPaidAmount = invoice.paidAmount + input.amount;
          const remaining = invoice.totalAmount - invoice.discountAmount - invoice.waivedAmount - newPaidAmount;
          const newStatus = remaining <= 0 ? "PAID" : "PARTIAL";

          await tx.invoice.update({
            where: { id: input.invoiceId },
            data: {
              paidAmount: newPaidAmount,
              balance: Math.max(0, remaining),
              status: newStatus,
            },
          });
        }
      }

      // 4. Recalculate account balance
      const balanceResult = await recalculateAccountBalance(input.studentFeeAccountId, tx);

      return {
        transaction,
        receipt,
        updatedBalance: balanceResult.ok ? balanceResult.data.balance : 0,
      };
    });

    revalidatePath(`/dashboard/fees/accounts/${input.studentFeeAccountId}`);
    return { ok: true, data: result };
  } catch (error) {
    console.error("Error recording payment:", error);
    return { ok: false, error: "Failed to record payment. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// REVERSE TRANSACTION (creates a reversal — never deletes)
// ════════════════════════════════════════════════════════════════════════════

export async function reverseTransaction(
  transactionId: string,
  reason: string,
  reversedById: string
): Promise<ActionResult<FeeTransaction>> {
  try {
    if (!transactionId) return { ok: false, error: "Transaction ID is required" };
    if (!reason || reason.trim().length === 0) return { ok: false, error: "Reversal reason is required" };
    if (!reversedById) return { ok: false, error: "User ID is required" };

    const original = await db.feeTransaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        transactionType: true,
        amount: true,
        studentFeeAccountId: true,
        invoiceId: true,
        isReversal: true,
        reversals: { select: { id: true } },
      },
    });
    if (!original) return { ok: false, error: "Transaction not found" };
    if (original.isReversal) {
      return { ok: false, error: "Cannot reverse a reversal transaction" };
    }
    if (original.reversals.length > 0) {
      return { ok: false, error: "This transaction has already been reversed" };
    }
    if (original.transactionType === "INVOICE") {
      return { ok: false, error: "To reverse an invoice, use void invoice instead" };
    }

    const reversal = await db.$transaction(async (tx) => {
      const rev = await tx.feeTransaction.create({
        data: {
          studentFeeAccountId: original.studentFeeAccountId,
          invoiceId: original.invoiceId,
          transactionType: original.transactionType,
          amount: original.amount,
          description: `Reversal: ${reason.trim()}`,
          isReversal: true,
          reversalOfId: original.id,
          reversedAt: new Date(),
          reversedById,
          createdById: reversedById,
        },
      });

      // If reversing a PAYMENT, update invoice balance back
      if (original.transactionType === "PAYMENT" && original.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: original.invoiceId },
          select: { paidAmount: true, totalAmount: true, discountAmount: true, waivedAmount: true },
        });
        if (invoice) {
          const newPaidAmount = Math.max(0, invoice.paidAmount - original.amount);
          const remaining = invoice.totalAmount - invoice.discountAmount - invoice.waivedAmount - newPaidAmount;
          await tx.invoice.update({
            where: { id: original.invoiceId },
            data: {
              paidAmount: newPaidAmount,
              balance: Math.max(0, remaining),
              status: newPaidAmount === 0 ? "ISSUED" : "PARTIAL",
            },
          });
        }
      }

      await recalculateAccountBalance(original.studentFeeAccountId, tx);
      return rev;
    });

    revalidatePath(`/dashboard/fees/accounts/${original.studentFeeAccountId}`);
    return { ok: true, data: reversal };
  } catch (error) {
    console.error("Error reversing transaction:", error);
    return { ok: false, error: "Failed to reverse transaction. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// RECORD ADJUSTMENT / PENALTY / REFUND
// ════════════════════════════════════════════════════════════════════════════

export async function recordAdjustment(
  input: RecordAdjustmentInput
): Promise<ActionResult<FeeTransaction>> {
  try {
    if (!input.studentFeeAccountId) return { ok: false, error: "Account ID is required" };
    if (input.amount <= 0) return { ok: false, error: "Amount must be greater than zero" };
    if (!input.description || input.description.trim().length === 0) {
      return { ok: false, error: "Description is required for adjustments" };
    }
    if (!input.createdById) return { ok: false, error: "User ID is required" };

    const account = await db.studentFeeAccount.findUnique({
      where: { id: input.studentFeeAccountId },
      select: { id: true },
    });
    if (!account) return { ok: false, error: "Student fee account not found" };

    const transaction = await db.$transaction(async (tx) => {
      const t = await tx.feeTransaction.create({
        data: {
          studentFeeAccountId: input.studentFeeAccountId,
          invoiceId: input.invoiceId,
          transactionType: input.type as TransactionType,
          amount: input.amount,
          description: input.description.trim(),
          createdById: input.createdById,
        },
      });

      // If REFUND — create a receipt too
      if (input.type === "REFUND") {
        const acct = await tx.studentFeeAccount.findUnique({
          where: { id: input.studentFeeAccountId },
          select: { studentId: true, schoolId: true },
        });
        if (acct) {
          const receiptNumber = await generateReceiptNumber();
          await tx.feeReceipt.create({
            data: {
              receiptNumber,
              transactionId: t.id,
              studentId: acct.studentId,
              schoolId: acct.schoolId,
              invoiceId: input.invoiceId,
              amountPaid: input.amount,
              paymentMethod: "CASH", // Refunds default to CASH — adjust if needed
            },
          });
        }
      }

      await recalculateAccountBalance(input.studentFeeAccountId, tx);
      return t;
    });

    revalidatePath(`/dashboard/fees/accounts/${input.studentFeeAccountId}`);
    return { ok: true, data: transaction };
  } catch (error) {
    console.error("Error recording adjustment:", error);
    return { ok: false, error: "Failed to record adjustment. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET TRANSACTIONS — for a fee account (full ledger)
// ════════════════════════════════════════════════════════════════════════════

export async function getFeeTransactions(
  studentFeeAccountId: string,
  filters?: { transactionType?: TransactionType; dateFrom?: Date; dateTo?: Date }
): Promise<ActionResult<TransactionWithRelations[]>> {
  try {
    if (!studentFeeAccountId) return { ok: false, error: "Account ID is required" };

    const transactions = await db.feeTransaction.findMany({
      where: {
        studentFeeAccountId,
        ...(filters?.transactionType && { transactionType: filters.transactionType }),
        ...(filters?.dateFrom || filters?.dateTo
          ? {
              createdAt: {
                ...(filters.dateFrom && { gte: filters.dateFrom }),
                ...(filters.dateTo && { lte: filters.dateTo }),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        invoice: { select: { id: true, invoiceNumber: true } },
        receipt: { select: { id: true, receiptNumber: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return { ok: true, data: transactions };
  } catch (error) {
    console.error("Error fetching fee transactions:", error);
    return { ok: false, error: "Failed to fetch transactions" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET RECEIPT BY ID
// ════════════════════════════════════════════════════════════════════════════

export async function getFeeReceiptById(
  id: string
): Promise<ActionResult<FeeReceipt & { transaction: FeeTransaction }>> {
  try {
    if (!id) return { ok: false, error: "Receipt ID is required" };

    const receipt = await db.feeReceipt.findUnique({
      where: { id },
      include: { transaction: true, invoice: { select: { id: true, invoiceNumber: true } } },
    });

    if (!receipt) return { ok: false, error: "Receipt not found" };
    return { ok: true, data: receipt };
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return { ok: false, error: "Failed to fetch receipt" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT SUMMARY — school-wide for a term (finance dashboard)
// ════════════════════════════════════════════════════════════════════════════

export async function getPaymentSummaryByTerm(
  schoolId: string,
  termId: string
): Promise<
  ActionResult<{
    totalCollected: number;
    totalPending: number;
    totalRefunded: number;
    byPaymentMethod: { method: string; total: number; count: number }[];
    recentTransactions: TransactionWithRelations[];
  }>
> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };
    if (!termId) return { ok: false, error: "Term ID is required" };

    const [paymentAgg, refundAgg, byMethod, recentTransactions] = await Promise.all([
      // Total payments
      db.feeTransaction.aggregate({
        where: {
          studentFeeAccount: { schoolId, termId },
          transactionType: "PAYMENT",
          isReversal: false,
        },
        _sum: { amount: true },
      }),

      // Total refunds
      db.feeTransaction.aggregate({
        where: {
          studentFeeAccount: { schoolId, termId },
          transactionType: "REFUND",
          isReversal: false,
        },
        _sum: { amount: true },
      }),

      // Breakdown by payment method
      db.feeTransaction.groupBy({
        by: ["paymentMethod"],
        where: {
          studentFeeAccount: { schoolId, termId },
          transactionType: "PAYMENT",
          isReversal: false,
          paymentMethod: { not: null },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Recent transactions
      db.feeTransaction.findMany({
        where: {
          studentFeeAccount: { schoolId, termId },
          transactionType: { in: ["PAYMENT", "REFUND"] },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          invoice: { select: { id: true, invoiceNumber: true } },
          receipt: { select: { id: true, receiptNumber: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Outstanding = sum of all positive balances
    const outstandingAgg = await db.studentFeeAccount.aggregate({
      where: { schoolId, termId, balance: { gt: 0 } },
      _sum: { balance: true },
    });

    return {
      ok: true,
      data: {
        totalCollected: paymentAgg._sum.amount ?? 0,
        totalPending: outstandingAgg._sum.balance ?? 0,
        totalRefunded: refundAgg._sum.amount ?? 0,
        byPaymentMethod: byMethod.map((m) => ({
          method: m.paymentMethod ?? "UNKNOWN",
          total: m._sum.amount ?? 0,
          count: m._count.id,
        })),
        recentTransactions,
      },
    };
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    return { ok: false, error: "Failed to fetch payment summary" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE PAYMENT NOTES / REFERENCE (non-financial fields only)
// ════════════════════════════════════════════════════════════════════════════

export async function updatePaymentNotes(
  transactionId: string,
  data: { description?: string; referenceNumber?: string }
): Promise<ActionResult<FeeTransaction>> {
  try {
    if (!transactionId) return { ok: false, error: "Transaction ID is required" };

    const tx = await db.feeTransaction.findUnique({ where: { id: transactionId } });
    if (!tx) return { ok: false, error: "Transaction not found" };
    if (tx.isReversal) return { ok: false, error: "Cannot edit a reversal entry" };

    const updated = await db.feeTransaction.update({
      where: { id: transactionId },
      data: {
        ...(data.description   !== undefined && { description:     data.description }),
        ...(data.referenceNumber !== undefined && { referenceNumber: data.referenceNumber }),
      },
    });

    revalidatePath("/finance/fees/payments");
    return { ok: true, data: updated };
  } catch (error) {
    console.error("Error updating payment notes:", error);
    return { ok: false, error: "Failed to update payment" };
  }
}
