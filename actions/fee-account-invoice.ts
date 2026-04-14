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
  FeeTransaction,
} from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Narrow invoice shape — used in list/history queries where we don't need all fields
type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: number;
  balance: number;
};

// Base account relations shared by all queries
type StudentFeeAccountBase = StudentFeeAccount & {
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
  term: { id: string; name: string; termNumber: number };
  academicYear: { id: string; year: string };
};

// Full account — single-record queries (getStudentFeeAccount, getStudentFeeAccountById)
type StudentFeeAccountWithRelations = StudentFeeAccountBase & {
  invoices?: Invoice[];
  bursaryAllocations?: any[];
};

// History shape — multi-record with narrow invoice select
type StudentFeeAccountHistory = StudentFeeAccountBase & {
  invoices: InvoiceSummary[];
};

// Term list shape — no invoices (just the account row + student + term)
type StudentFeeAccountListItem = StudentFeeAccountBase;

type InvoiceWithItems = Invoice & {
  items: {
    id: string;
    amount: number;
    quantity: number;
    unitPrice: number;
    description: string | null;
    feeCategory: { id: string; name: string; code: string };
  }[];
  studentFeeAccount: {
    student: { id: string; firstName: string; lastName: string; admissionNo: string };
  };
  receipts: { id: string; receiptNumber: string; amountPaid: number; issuedAt: Date }[];
};

interface CreateManualInvoiceInput {
  studentFeeAccountId: string;
  dueDate?: Date;
  notes?: string;
  items: Array<{
    feeCategoryId: string;
    description?: string;
    amount: number;
    quantity?: number;
  }>;
  createdById: string;
}

// ════════════════════════════════════════════════════════════════════════════
// BALANCE RECALCULATION (core — called after every transaction)
// Never manually edit StudentFeeAccount totals. Always call this.
// ════════════════════════════════════════════════════════════════════════════

export async function recalculateAccountBalance(
  studentFeeAccountId: string,
  tx?: any
): Promise<ActionResult<StudentFeeAccount>> {
  try {
    const client = tx ?? db;

    const transactions = await client.feeTransaction.findMany({
      where: { studentFeeAccountId, isReversal: false },
      select: { transactionType: true, amount: true },
    });

    const account = await client.studentFeeAccount.findUniqueOrThrow({
      where: { id: studentFeeAccountId },
      select: { carryForward: true },
    });

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalDiscount = 0;
    let totalPenalty = 0;
    let totalWaived = 0;
    let totalRefunded = 0;

    for (const t of transactions) {
      switch (t.transactionType as TransactionType) {
        case "INVOICE":      totalInvoiced  += t.amount; break;
        case "PAYMENT":      totalPaid      += t.amount; break;
        case "DISCOUNT":     totalDiscount  += t.amount; break;
        case "PENALTY":      totalPenalty   += t.amount; break;
        case "WAIVER":       totalWaived    += t.amount; break;
        case "REFUND":       totalRefunded  += t.amount; break;
        // CARRY_FORWARD and ADJUSTMENT are handled via carryForward field
      }
    }

    const carryForward = account.carryForward;
    const positiveCarry = carryForward > 0 ? carryForward : 0;
    const creditCarry   = carryForward < 0 ? Math.abs(carryForward) : 0;

    const balance = parseFloat(
      (
        totalInvoiced +
        totalPenalty +
        positiveCarry -
        totalDiscount -
        totalWaived -
        totalPaid -
        creditCarry +
        totalRefunded
      ).toFixed(2)
    );

    const status: AccountStatus =
      balance < 0 ? "OVERPAID" : balance === 0 ? "CLEARED" : "ACTIVE";

    const updated = await client.studentFeeAccount.update({
      where: { id: studentFeeAccountId },
      data: {
        totalInvoiced,
        totalPaid,
        totalDiscount,
        totalPenalty,
        totalWaived,
        totalRefunded,
        balance,
        status,
      },
    });

    return { ok: true, data: updated };
  } catch (error) {
    console.error("Error recalculating account balance:", error);
    return { ok: false, error: "Failed to recalculate balance" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STUDENT FEE ACCOUNT — READ SINGLE (by student + year + term)
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentFeeAccount(
  studentId: string,
  academicYearId: string,
  termId: string
): Promise<ActionResult<StudentFeeAccountWithRelations>> {
  try {
    const account = await db.studentFeeAccount.findUnique({
      where: { studentId_academicYearId_termId: { studentId, academicYearId, termId } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        term: { select: { id: true, name: true, termNumber: true } },
        academicYear: { select: { id: true, year: true } },
        invoices: {
          orderBy: { createdAt: "desc" },
          include: { items: { include: { feeCategory: { select: { id: true, name: true, code: true } } } } },
        },
        bursaryAllocations: {
          include: { bursary: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    if (!account) return { ok: false, error: "Student fee account not found" };
    return { ok: true, data: account };
  } catch (error) {
    console.error("Error fetching student fee account:", error);
    return { ok: false, error: "Failed to fetch student fee account" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STUDENT FEE ACCOUNT — READ SINGLE (by id — full detail page)
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentFeeAccountById(
  id: string
): Promise<ActionResult<StudentFeeAccountWithRelations>> {
  try {
    if (!id) return { ok: false, error: "Account ID is required" };

    const account = await db.studentFeeAccount.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        term: { select: { id: true, name: true, termNumber: true } },
        academicYear: { select: { id: true, year: true } },
        invoices: {
          orderBy: { createdAt: "desc" },
          include: {
            items: { include: { feeCategory: { select: { id: true, name: true, code: true } } } },
            receipts: { select: { id: true, receiptNumber: true, amountPaid: true, issuedAt: true } },
          },
        },
        bursaryAllocations: {
          include: {
            bursary: { select: { id: true, name: true, code: true } },
            studentBursary: { select: { id: true, validFrom: true, validUntil: true } },
          },
        },
        installmentPlans: {
          include: { installments: { orderBy: { installmentNumber: "asc" } } },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          include: { receipt: { select: { id: true, receiptNumber: true } } },
        },
      },
    });

    if (!account) return { ok: false, error: "Student fee account not found" };
    return { ok: true, data: account };
  } catch (error) {
    console.error("Error fetching student fee account:", error);
    return { ok: false, error: "Failed to fetch student fee account" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STUDENT FEE ACCOUNT — ALL ACCOUNTS FOR A TERM (school finance list view)
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentFeeAccountsByTerm(
  schoolId: string,
  termId: string,
  filters?: {
    status?: AccountStatus;
    hasArrears?: boolean;
    autoInvoiceGenerated?: boolean;
  }
): Promise<ActionResult<StudentFeeAccountListItem[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };
    if (!termId) return { ok: false, error: "Term ID is required" };

    const accounts = await db.studentFeeAccount.findMany({
      where: {
        schoolId,
        termId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.hasArrears && { balance: { gt: 0 } }),
        ...(filters?.autoInvoiceGenerated !== undefined && {
          autoInvoiceGenerated: filters.autoInvoiceGenerated,
        }),
      },
      orderBy: [{ balance: "desc" }, { student: { lastName: "asc" } }],
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        term: { select: { id: true, name: true, termNumber: true } },
        academicYear: { select: { id: true, year: true } },
      },
    });

    return { ok: true, data: accounts };
  } catch (error) {
    console.error("Error fetching student fee accounts by term:", error);
    return { ok: false, error: "Failed to fetch student fee accounts" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STUDENT FEE ACCOUNT — ALL TERMS FOR ONE STUDENT (history view)
// Uses InvoiceSummary — not the full Invoice model — to match the select shape
// ════════════════════════════════════════════════════════════════════════════

export async function getStudentFeeHistory(
  studentId: string
): Promise<ActionResult<StudentFeeAccountHistory[]>> {
  try {
    if (!studentId) return { ok: false, error: "Student ID is required" };

    const accounts = await db.studentFeeAccount.findMany({
      where: { studentId },
      orderBy: [{ academicYear: { year: "desc" } }, { term: { termNumber: "asc" } }],
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        term: { select: { id: true, name: true, termNumber: true } },
        academicYear: { select: { id: true, year: true } },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
            balance: true,
          },
        },
      },
    });

    return { ok: true, data: accounts };
  } catch (error) {
    console.error("Error fetching student fee history:", error);
    return { ok: false, error: "Failed to fetch student fee history" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// INVOICE — READ SINGLE
// ════════════════════════════════════════════════════════════════════════════

export async function getInvoiceById(
  id: string
): Promise<ActionResult<InvoiceWithItems>> {
  try {
    if (!id) return { ok: false, error: "Invoice ID is required" };

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: { feeCategory: { select: { id: true, name: true, code: true } } },
        },
        studentFeeAccount: {
          select: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          },
        },
        receipts: { select: { id: true, receiptNumber: true, amountPaid: true, issuedAt: true } },
        transactions: { orderBy: { createdAt: "desc" } },
        feeStructure: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!invoice) return { ok: false, error: "Invoice not found" };
    return { ok: true, data: invoice };
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return { ok: false, error: "Failed to fetch invoice" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// INVOICE — READ ALL FOR STUDENT ACCOUNT
// ════════════════════════════════════════════════════════════════════════════

export async function getInvoicesByStudent(
  studentFeeAccountId: string
): Promise<ActionResult<InvoiceWithItems[]>> {
  try {
    if (!studentFeeAccountId) return { ok: false, error: "Account ID is required" };

    const invoices = await db.invoice.findMany({
      where: { studentFeeAccountId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { feeCategory: { select: { id: true, name: true, code: true } } },
        },
        studentFeeAccount: {
          select: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          },
        },
        receipts: { select: { id: true, receiptNumber: true, amountPaid: true, issuedAt: true } },
      },
    });

    return { ok: true, data: invoices };
  } catch (error) {
    console.error("Error fetching student invoices:", error);
    return { ok: false, error: "Failed to fetch invoices" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// INVOICE — CREATE MANUAL
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

export async function createManualInvoice(
  input: CreateManualInvoiceInput
): Promise<ActionResult<InvoiceWithItems>> {
  try {
    if (!input.studentFeeAccountId) return { ok: false, error: "Account ID is required" };
    if (!input.items || input.items.length === 0) return { ok: false, error: "At least one item is required" };
    if (!input.createdById) return { ok: false, error: "Created by user ID is required" };

    for (const item of input.items) {
      if (item.amount <= 0) return { ok: false, error: "Each item amount must be greater than zero" };
    }

    const account = await db.studentFeeAccount.findUnique({
      where: { id: input.studentFeeAccountId },
      select: { id: true, schoolId: true, termId: true },
    });
    if (!account) return { ok: false, error: "Student fee account not found" };

    const totalAmount = input.items.reduce(
      (sum, item) => sum + item.amount * (item.quantity ?? 1),
      0
    );
    const invoiceNumber = await generateInvoiceNumber(account.schoolId, account.termId);

    const invoice = await db.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          studentFeeAccountId: input.studentFeeAccountId,
          invoiceNumber,
          status: "ISSUED" as InvoiceStatus,
          trigger: "MANUAL" as InvoiceTrigger,
          dueDate: input.dueDate,
          totalAmount,
          balance: totalAmount,
          notes: input.notes?.trim(),
          createdById: input.createdById,
          items: {
            create: input.items.map((item) => ({
              feeCategoryId: item.feeCategoryId,
              description: item.description?.trim(),
              amount: item.amount * (item.quantity ?? 1),
              quantity: item.quantity ?? 1,
              unitPrice: item.amount,
            })),
          },
        },
        include: {
          items: { include: { feeCategory: { select: { id: true, name: true, code: true } } } },
          studentFeeAccount: {
            select: {
              student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
            },
          },
          receipts: { select: { id: true, receiptNumber: true, amountPaid: true, issuedAt: true } },
        },
      });

      // Record INVOICE transaction in ledger
      await tx.feeTransaction.create({
        data: {
          studentFeeAccountId: input.studentFeeAccountId,
          invoiceId: created.id,
          transactionType: "INVOICE" as TransactionType,
          amount: totalAmount,
          description: `Manual invoice ${invoiceNumber}`,
          createdById: input.createdById,
        },
      });

      // Recalculate balance
      await recalculateAccountBalance(input.studentFeeAccountId, tx);

      return created;
    });

    revalidatePath(`/dashboard/fees/accounts/${input.studentFeeAccountId}`);
    return { ok: true, data: invoice };
  } catch (error) {
    console.error("Error creating manual invoice:", error);
    return { ok: false, error: "Failed to create invoice. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// INVOICE — VOID
// ════════════════════════════════════════════════════════════════════════════

export async function voidInvoice(
  invoiceId: string,
  voidReason: string,
  voidedById: string
): Promise<ActionResult<Invoice>> {
  try {
    if (!invoiceId) return { ok: false, error: "Invoice ID is required" };
    if (!voidReason || voidReason.trim().length === 0) return { ok: false, error: "Void reason is required" };
    if (!voidedById) return { ok: false, error: "User ID is required" };

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        status: true,
        paidAmount: true,
        totalAmount: true,
        studentFeeAccountId: true,
      },
    });
    if (!invoice) return { ok: false, error: "Invoice not found" };

    if (invoice.status === "VOID" || invoice.status === "CANCELLED") {
      return { ok: false, error: "Invoice is already voided or cancelled" };
    }
    if (invoice.paidAmount > 0) {
      return {
        ok: false,
        error: "Cannot void an invoice that has payments. Process a refund first.",
      };
    }

    const voided = await db.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "VOID" as InvoiceStatus,
          voidReason: voidReason.trim(),
          voidedAt: new Date(),
          voidedById,
        },
      });

      // Create reversal transaction in ledger
      await tx.feeTransaction.create({
        data: {
          studentFeeAccountId: invoice.studentFeeAccountId,
          invoiceId,
          transactionType: "ADJUSTMENT" as TransactionType,
          amount: invoice.totalAmount,
          description: `Invoice voided: ${voidReason.trim()}`,
          isReversal: true,
          createdById: voidedById,
        },
      });

      await recalculateAccountBalance(invoice.studentFeeAccountId, tx);
      return updated;
    });

    revalidatePath(`/dashboard/fees/accounts/${invoice.studentFeeAccountId}`);
    return { ok: true, data: voided };
  } catch (error) {
    console.error("Error voiding invoice:", error);
    return { ok: false, error: "Failed to void invoice. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// INVOICE — APPLY DISCOUNT / WAIVER
// ════════════════════════════════════════════════════════════════════════════

export async function applyInvoiceDiscount(input: {
  invoiceId: string;
  amount: number;
  type: "DISCOUNT" | "WAIVER";
  description: string;
  approvedById: string;
}): Promise<ActionResult<Invoice>> {
  try {
    if (!input.invoiceId) return { ok: false, error: "Invoice ID is required" };
    if (input.amount <= 0) return { ok: false, error: "Discount amount must be greater than zero" };
    if (!input.description) return { ok: false, error: "Description is required" };

    const invoice = await db.invoice.findUnique({
      where: { id: input.invoiceId },
      select: {
        id: true,
        status: true,
        balance: true,
        discountAmount: true,
        waivedAmount: true,
        studentFeeAccountId: true,
      },
    });
    if (!invoice) return { ok: false, error: "Invoice not found" };

    if (invoice.status === "VOID" || invoice.status === "CANCELLED") {
      return { ok: false, error: "Cannot apply discount to a void/cancelled invoice" };
    }
    if (input.amount > invoice.balance) {
      return {
        ok: false,
        error: `Discount (${input.amount}) exceeds invoice balance (${invoice.balance})`,
      };
    }

    const updated = await db.$transaction(async (tx) => {
      const discountField = input.type === "DISCOUNT" ? "discountAmount" : "waivedAmount";
      const currentDiscount =
        input.type === "DISCOUNT" ? invoice.discountAmount : invoice.waivedAmount;
      const newBalance = invoice.balance - input.amount;
      const newStatus: InvoiceStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

      const inv = await tx.invoice.update({
        where: { id: input.invoiceId },
        data: {
          [discountField]: currentDiscount + input.amount,
          balance: Math.max(0, newBalance),
          status: newStatus,
        },
      });

      await tx.feeTransaction.create({
        data: {
          studentFeeAccountId: invoice.studentFeeAccountId,
          invoiceId: input.invoiceId,
          transactionType: input.type as TransactionType,
          amount: input.amount,
          description: input.description.trim(),
          createdById: input.approvedById,
        },
      });

      await recalculateAccountBalance(invoice.studentFeeAccountId, tx);
      return inv;
    });

    revalidatePath(`/dashboard/fees/accounts/${invoice.studentFeeAccountId}`);
    return { ok: true, data: updated };
  } catch (error) {
    console.error("Error applying discount:", error);
    return { ok: false, error: "Failed to apply discount. Please try again." };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE TWO FUNCTIONS to:
//   actions/fees/fee-account-invoice.actions.ts
//
// Place them after the existing exported functions.
// They are called by StudentAccountsClient via the AccountDetailSheet.
// ─────────────────────────────────────────────────────────────────────────────

// ── Invoices for a single account ─────────────────────────────────────────────
export async function getInvoicesByAccount(
  studentFeeAccountId: string
): Promise<ActionResult<Invoice[]>> {
  try {
    if (!studentFeeAccountId)
      return { ok: false, error: "Account ID is required" };

    const invoices = await db.invoice.findMany({
      where:   { studentFeeAccountId },
      orderBy: { issueDate: "desc" },
    });

    return { ok: true, data: invoices };
  } catch (error) {
    console.error("getInvoicesByAccount error:", error);
    return { ok: false, error: "Failed to fetch invoices" };
  }
}

// ── Full ledger (all transactions) for a single account ───────────────────────
export async function getLedgerByAccount(
  studentFeeAccountId: string
): Promise<ActionResult<FeeTransaction[]>> {
  try {
    if (!studentFeeAccountId)
      return { ok: false, error: "Account ID is required" };

    const transactions = await db.feeTransaction.findMany({
      where:   { studentFeeAccountId },
      orderBy: { processedAt: "desc" },
    });

    return { ok: true, data: transactions };
  } catch (error) {
    console.error("getLedgerByAccount error:", error);
    return { ok: false, error: "Failed to fetch ledger" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE MANUAL INVOICE FOR STUDENT (auto-creates fee account if missing)
// Used by bursar when student has no fee account yet for the active term.
// ════════════════════════════════════════════════════════════════════════════

export async function createManualInvoiceForStudent(input: {
  studentId:      string;
  schoolId:       string;
  academicYearId: string;
  termId:         string;
  feeStructureId: string;
  dueDate?:       Date;
  notes?:         string;
  createdById:    string;
}): Promise<ActionResult<{ invoiceId: string; invoiceNumber: string; studentFeeAccountId: string }>> {
  try {
    const { studentId, schoolId, academicYearId, termId, feeStructureId, dueDate, notes, createdById } = input;

    // Get fee structure items
    const feeStructure = await db.feeStructure.findUnique({
      where:   { id: feeStructureId },
      include: {
        items: {
          include: { feeCategory: { select: { id: true, name: true } } },
          where:   { feeCategory: { isActive: true } },
        },
      },
    });
    if (!feeStructure || !feeStructure.isPublished) {
      return { ok: false, error: "Fee structure not found or not published." };
    }
    if (feeStructure.items.length === 0) {
      return { ok: false, error: "Fee structure has no active items." };
    }

    const totalAmount = feeStructure.items.reduce((s, i) => s + i.amount, 0);

    const result = await db.$transaction(async (tx) => {
      // Upsert fee account
      const feeAccount = await tx.studentFeeAccount.upsert({
        where:  { studentId_academicYearId_termId: { studentId, academicYearId, termId } },
        create: { studentId, academicYearId, termId, schoolId, balance: 0, status: "ACTIVE" },
        update: {},
      });

      const invoiceNumber = await generateInvoiceNumber(schoolId, termId);

      const invoice = await tx.invoice.create({
        data: {
          studentFeeAccountId: feeAccount.id,
          feeStructureId,
          invoiceNumber,
          status:      "ISSUED",
          trigger:     "MANUAL",
          issueDate:   new Date(),
          dueDate:     dueDate ?? null,
          totalAmount,
          balance:     totalAmount,
          notes:       notes?.trim(),
          createdById,
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
          transactionType:     "INVOICE",
          amount:              totalAmount,
          description:         `Manual invoice: ${feeStructure.name ?? "Term fees"}`,
          createdById,
        },
      });

      await recalculateAccountBalance(feeAccount.id, tx);

      return { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, studentFeeAccountId: feeAccount.id };
    });

    revalidatePath(`/school/${schoolId}/bursar/fees/invoices`);
    revalidatePath(`/school/${schoolId}/finance/fees/invoices`);

    return { ok: true, data: result };
  } catch (error: any) {
    console.error("createManualInvoiceForStudent error:", error);
    return { ok: false, error: error?.message ?? "Failed to create invoice." };
  }
}