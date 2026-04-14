// "use server";

// import { revalidatePath } from "next/cache";
// import { db } from "@/prisma/db";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/config/auth";
// import type { Session } from "next-auth";


// // ─── AUTO-NUMBER ─────────────────────────────────────────────────────────────

// async function generateExpenseNumber(schoolId: string): Promise<string> {
//   const year = new Date().getFullYear();
//   const count = await db.expense.count({
//     where: {
//       schoolId,
//       createdAt: { gte: new Date(`${year}-01-01`) },
//     },
//   });
//   return `EXP-${year}-${String(count + 1).padStart(4, "0")}`;
// }

// // ─── EXPENSE CATEGORY ACTIONS ────────────────────────────────────────────────

// export async function getExpenseCategories(schoolId: string) {
//   return db.expenseCategory.findMany({
//     where: { schoolId, isActive: true },
//     orderBy: { name: "asc" },
//   });
// }

// export async function createExpenseCategory(data: {
//   schoolId: string;
//   name: string;
//   code: string;
//   description?: string;
// }) {
//   const session = await getServerSession(authOptions as any) as Session | null;
//   if (!session?.user) throw new Error("Unauthorized");

//   const category = await db.expenseCategory.create({
//     data: {
//       schoolId: data.schoolId,
//       name: data.name,
//       code: data.code.toUpperCase(),
//       description: data.description,
//     },
//   });

//   revalidatePath(`/finance/expenses`);
//   return { success: true, category };
// }

// export async function updateExpenseCategory(
//   id: string,
//   data: { name?: string; description?: string; isActive?: boolean }
// ) {
//     const session = await getServerSession(authOptions as any) as Session | null;
//   if (!session?.user) throw new Error("Unauthorized");

//   const category = await db.expenseCategory.update({
//     where: { id },
//     data,
//   });

//   revalidatePath(`/finance/expenses`);
//   return { success: true, category };
// }

// // ─── VENDOR ACTIONS ──────────────────────────────────────────────────────────

// export async function getVendors(schoolId: string) {
//   return db.vendor.findMany({
//     where: { schoolId, isActive: true },
//     orderBy: { name: "asc" },
//   });
// }

// export async function createVendor(data: {
//   schoolId: string;
//   name: string;
//   phone?: string;
//   email?: string;
//   address?: string;
//   tinNo?: string;
// }) {
//     const session = await getServerSession(authOptions as any) as Session | null;
//   if (!session?.user) throw new Error("Unauthorized");

//   const vendor = await db.vendor.create({ data });
//   revalidatePath(`/finance/expenses`);
//   return { success: true, vendor };
// }

// // ─── EXPENSE ACTIONS ─────────────────────────────────────────────────────────

// export async function getExpenses(
//   schoolId: string,
//   filters?: {
//     status?: string;
//     categoryId?: string;
//     from?: Date;
//     to?: Date;
//     search?: string;
//   }
// ) {
//   return db.expense.findMany({
//     where: {
//       schoolId,
//       ...(filters?.status && { status: filters.status as any }),
//       ...(filters?.categoryId && { categoryId: filters.categoryId }),
//       ...(filters?.from || filters?.to
//         ? {
//             expenseDate: {
//               ...(filters.from && { gte: filters.from }),
//               ...(filters.to && { lte: filters.to }),
//             },
//           }
//         : {}),
//       ...(filters?.search && {
//         OR: [
//           { description: { contains: filters.search, mode: "insensitive" } },
//           { expenseNumber: { contains: filters.search, mode: "insensitive" } },
//           { referenceNo: { contains: filters.search, mode: "insensitive" } },
//         ],
//       }),
//     },
//     include: {
//       category: true,
//       vendor: true,
//       createdBy: { select: { name: true } },
//       approvedBy: { select: { name: true } },
//       academicTerm: { select: { name: true } },
//     },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function getExpenseById(id: string) {
//   return db.expense.findUnique({
//     where: { id },
//     include: {
//       category: true,
//       vendor: true,
//       createdBy: { select: { name: true, email: true } },
//       approvedBy: { select: { name: true } },
//       academicTerm: true,
//     },
//   });
// }

// export async function createExpense(data: {
//   schoolId: string;
//   categoryId: string;
//   vendorId?: string;
//   academicTermId?: string;
//   description: string;
//   amount: number;
//   expenseDate: Date;
//   paymentMethod?: string;
//   referenceNo?: string;
//   notes?: string;
// }) {
//     const session = await getServerSession(authOptions as any) as Session | null;
//   if (!session?.user?.id) throw new Error("Unauthorized");

//   const expenseNumber = await generateExpenseNumber(data.schoolId);

//   const expense = await db.expense.create({
//     data: {
//       ...data,
//       expenseNumber,
//       status: "DRAFT",
//       paymentMethod: data.paymentMethod as any,
//       createdById: session.user.id,
//     },
//     include: { category: true, vendor: true },
//   });

//   revalidatePath(`/finance/expenses`);
//   return { success: true, expense };
// }

// export async function updateExpense(
//   id: string,
//   data: {
//     categoryId?: string;
//     vendorId?: string;
//     description?: string;
//     amount?: number;
//     expenseDate?: Date;
//     paymentMethod?: string;
//     referenceNo?: string;
//     notes?: string;
//   }
// ) {
//     const session = await getServerSession(authOptions as any) as Session | null;
//   if (!session?.user) throw new Error("Unauthorized");

//   // Only DRAFT expenses can be edited
//   const existing = await db.expense.findUniqueOrThrow({ where: { id } });
//   if (existing.status !== "DRAFT") {
//     throw new Error("Only draft expenses can be edited.");
//   }

//   const expense = await db.expense.update({
//     where: { id },
//     data: { ...data, paymentMethod: data.paymentMethod as any },
//   });

//   revalidatePath(`/finance/expenses`);
//   return { success: true, expense };
// }

// export async function submitExpenseForApproval(id: string) {
//     const session = await getServerSession(authOptions as any) as Session | null;
//   if (!session?.user) throw new Error("Unauthorized");

//   const expense = await db.expense.update({
//     where: { id, status: "DRAFT" },
//     data: { status: "PENDING" },
//   });

//   revalidatePath(`/finance/expenses`);
//   return { success: true, expense };
// }

// export async function approveExpense(id: string) {
//     const session = await getServerSession(authOptions as any) as Session | null;
//   if (!session?.user?.id) throw new Error("Unauthorized");

//   const expense = await db.expense.update({
//     where: { id, status: "PENDING" },
//     data: {
//       status: "APPROVED",
//       approvedById: session.user.id,
//       approvedAt: new Date(),
//     },
//   });

//   revalidatePath(`/finance/expenses`);
//   return { success: true, expense };
// }

// export async function rejectExpense(id: string, reason: string) {
//     const session = await getServerSession(authOptions as any) as Session | null;
//   if (!session?.user?.id) throw new Error("Unauthorized");

//   const expense = await db.expense.update({
//     where: { id, status: "PENDING" },
//     data: {
//       status: "REJECTED",
//       rejectionReason: reason,
//       approvedById: session.user.id,
//     },
//   });

//   revalidatePath(`/finance/expenses`);
//   return { success: true, expense };
// }

// export async function markExpenseAsPaid(
//   id: string,
//   data: { paymentMethod: string; referenceNo?: string }
// ) {
//     const session = await getServerSession(authOptions as any) as Session | null;
//   if (!session?.user) throw new Error("Unauthorized");

//   const expense = await db.expense.update({
//     where: { id, status: "APPROVED" },
//     data: {
//       status: "PAID",
//       paymentMethod: data.paymentMethod as any,
//       referenceNo: data.referenceNo,
//       paidAt: new Date(),
//     },
//   });

//   revalidatePath(`/finance/expenses`);
//   return { success: true, expense };
// }

// export async function cancelExpense(id: string) {
//     const session = await getServerSession(authOptions as any) as Session | null;
//   if (!session?.user) throw new Error("Unauthorized");

//   const expense = await db.expense.update({
//     where: { id },
//     data: { status: "CANCELLED" },
//   });

//   revalidatePath(`/finance/expenses`);
//   return { success: true, expense };
// }

// // ─── EXPENSE REPORTS ─────────────────────────────────────────────────────────

// export async function getExpenseSummary(
//   schoolId: string,
//   from: Date,
//   to: Date
// ) {
//   const [byCategory, total, pending] = await Promise.all([
//     // Group by category
//     db.expense.groupBy({
//       by: ["categoryId"],
//       where: {
//         schoolId,
//         status: { in: ["APPROVED", "PAID"] },
//         expenseDate: { gte: from, lte: to },
//       },
//       _sum: { amount: true },
//       _count: { id: true },
//     }),
//     // Total approved/paid
//     db.expense.aggregate({
//       where: {
//         schoolId,
//         status: { in: ["APPROVED", "PAID"] },
//         expenseDate: { gte: from, lte: to },
//       },
//       _sum: { amount: true },
//       _count: { id: true },
//     }),
//     // Pending approval count
//     db.expense.count({
//       where: { schoolId, status: "PENDING" },
//     }),
//   ]);

//   // Resolve category names
//   const categoryIds = byCategory.map((b) => b.categoryId);
//   const categories = await db.expenseCategory.findMany({
//     where: { id: { in: categoryIds } },
//     select: { id: true, name: true, code: true },
//   });
//   const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

//   return {
//     totalAmount: total._sum.amount ?? 0,
//     totalCount: total._count.id,
//     pendingCount: pending,
//     byCategory: byCategory.map((b) => ({
//       category: catMap[b.categoryId],
//       amount: b._sum.amount ?? 0,
//       count: b._count.id,
//     })),
//   };
// }



"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import type { Session } from "next-auth";


// ─── AUTO-NUMBER ─────────────────────────────────────────────────────────────

async function generateExpenseNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.expense.count({
    where: {
      schoolId,
      createdAt: { gte: new Date(`${year}-01-01`) },
    },
  });
  return `EXP-${year}-${String(count + 1).padStart(4, "0")}`;
}

// ─── EXPENSE CATEGORY ACTIONS ─────────────────────────────────────────────────

export async function getExpenseCategories(schoolId: string) {
  return db.expenseCategory.findMany({
    where: { schoolId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createExpenseCategory(data: {
  schoolId: string;
  name: string;
  code: string;
  description?: string;
}) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const category = await db.expenseCategory.create({
    data: {
      schoolId: data.schoolId,
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
    },
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, category };
}

export async function updateExpenseCategory(
  id: string,
  data: { name?: string; description?: string; isActive?: boolean }
) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const category = await db.expenseCategory.update({
    where: { id },
    data,
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, category };
}

// ─── VENDOR ACTIONS ───────────────────────────────────────────────────────────

/**
 * Get vendors for a school.
 * Pass includeInactive = true to also return disabled vendors
 * (needed for the vendor management page).
 */
export async function getVendors(
  schoolId: string,
  includeInactive = false
) {
  return db.vendor.findMany({
    where: {
      schoolId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: { name: "asc" },
  });
}

export async function createVendor(data: {
  schoolId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tinNo?: string;
}) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const { schoolId, ...rest } = data;

  if (!schoolId) throw new Error("schoolId is required to create a vendor.");

  const vendor = await db.vendor.create({
    data: {
      ...rest,
      school: { connect: { id: schoolId } },
    },
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, vendor };
}

export async function updateVendor(
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    tinNo?: string;
    isActive?: boolean;
  }
) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const vendor = await db.vendor.update({
    where: { id },
    data,
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, vendor };
}

// ─── EXPENSE ACTIONS ──────────────────────────────────────────────────────────

export async function getExpenses(
  schoolId: string,
  filters?: {
    status?: string;
    categoryId?: string;
    from?: Date;
    to?: Date;
    search?: string;
  }
) {
  return db.expense.findMany({
    where: {
      schoolId,
      ...(filters?.status && { status: filters.status as any }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
      ...(filters?.from || filters?.to
        ? {
            expenseDate: {
              ...(filters.from && { gte: filters.from }),
              ...(filters.to && { lte: filters.to }),
            },
          }
        : {}),
      ...(filters?.search && {
        OR: [
          { description: { contains: filters.search, mode: "insensitive" } },
          { expenseNumber: { contains: filters.search, mode: "insensitive" } },
          { referenceNo: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      category: true,
      vendor: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      academicTerm: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getExpenseById(id: string) {
  return db.expense.findUnique({
    where: { id },
    include: {
      category: true,
      vendor: true,
      createdBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true } },
      academicTerm: true,
    },
  });
}

export async function createExpense(data: {
  schoolId: string;
  categoryId: string;
  vendorId?: string;
  academicTermId?: string;
  description: string;
  amount: number;
  expenseDate: Date;
  paymentMethod?: string;
  referenceNo?: string;
  notes?: string;
}) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user?.id) throw new Error("Unauthorized");

  const expenseNumber = await generateExpenseNumber(data.schoolId);

  const expense = await db.expense.create({
    data: {
      ...data,
      expenseNumber,
      status: "DRAFT",
      paymentMethod: data.paymentMethod as any,
      createdById: session.user.id,
    },
    include: { category: true, vendor: true },
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, expense };
}

export async function updateExpense(
  id: string,
  data: {
    categoryId?: string;
    vendorId?: string;
    description?: string;
    amount?: number;
    expenseDate?: Date;
    paymentMethod?: string;
    referenceNo?: string;
    notes?: string;
  }
) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  // Only DRAFT expenses can be edited
  const existing = await db.expense.findUniqueOrThrow({ where: { id } });
  if (existing.status !== "DRAFT") {
    throw new Error("Only draft expenses can be edited.");
  }

  const expense = await db.expense.update({
    where: { id },
    data: { ...data, paymentMethod: data.paymentMethod as any },
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, expense };
}

export async function submitExpenseForApproval(id: string) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const expense = await db.expense.update({
    where: { id, status: "DRAFT" },
    data: { status: "PENDING" },
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, expense };
}

export async function approveExpense(id: string) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user?.id) throw new Error("Unauthorized");

  const expense = await db.expense.update({
    where: { id, status: "PENDING" },
    data: {
      status: "APPROVED",
      approvedById: session.user.id,
      approvedAt: new Date(),
    },
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, expense };
}

export async function rejectExpense(id: string, reason: string) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user?.id) throw new Error("Unauthorized");

  const expense = await db.expense.update({
    where: { id, status: "PENDING" },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      approvedById: session.user.id,
    },
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, expense };
}

export async function markExpenseAsPaid(
  id: string,
  data: { paymentMethod: string; referenceNo?: string }
) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const expense = await db.expense.update({
    where: { id, status: "APPROVED" },
    data: {
      status: "PAID",
      paymentMethod: data.paymentMethod as any,
      referenceNo: data.referenceNo,
      paidAt: new Date(),
    },
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, expense };
}

export async function cancelExpense(id: string) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const expense = await db.expense.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/finance/expenses`);
  return { success: true, expense };
}

export async function deleteExpense(id: string) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await db.expense.findUniqueOrThrow({ where: { id } });
  if (!["DRAFT", "CANCELLED", "REJECTED"].includes(existing.status)) {
    throw new Error("Only draft, cancelled, or rejected expenses can be deleted.");
  }

  await db.expense.delete({ where: { id } });
  revalidatePath(`/finance/expenses`);
  return { success: true };
}

// ─── EXPENSE REPORTS ──────────────────────────────────────────────────────────

export async function getExpenseSummary(
  schoolId: string,
  from: Date,
  to: Date
) {
  const [byCategory, total, pending] = await Promise.all([
    // Group by category
    db.expense.groupBy({
      by: ["categoryId"],
      where: {
        schoolId,
        status: { in: ["APPROVED", "PAID"] },
        expenseDate: { gte: from, lte: to },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Total approved/paid
    db.expense.aggregate({
      where: {
        schoolId,
        status: { in: ["APPROVED", "PAID"] },
        expenseDate: { gte: from, lte: to },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Pending approval count
    db.expense.count({
      where: { schoolId, status: "PENDING" },
    }),
  ]);

  // Resolve category names
  const categoryIds = byCategory.map((b) => b.categoryId);
  const categories = await db.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, code: true },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return {
    totalAmount: total._sum.amount ?? 0,
    totalCount: total._count.id,
    pendingCount: pending,
    byCategory: byCategory.map((b) => ({
      category: catMap[b.categoryId],
      amount: b._sum.amount ?? 0,
      count: b._count.id,
    })),
  };
}

