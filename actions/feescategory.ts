"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { FeeCategory } from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type FeeCategoryWithStats = FeeCategory & {
  stats: {
    totalStructureItems: number;
    totalInvoiceItems: number;
    isInUse: boolean;
  };
};

interface CreateFeeCategoryInput {
  schoolId: string;
  name: string;
  code: string;
  description?: string;
  isOptional?: boolean;
  isMandatory?: boolean;
}

interface UpdateFeeCategoryInput {
  name?: string;
  code?: string;
  description?: string;
  isOptional?: boolean;
  isMandatory?: boolean;
  isActive?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════════════════════

function validateFeeCategoryInput(input: CreateFeeCategoryInput): string | null {
  if (!input.name || input.name.trim().length === 0) return "Fee category name is required";
  if (!input.code || input.code.trim().length === 0) return "Fee category code is required";
  if (!input.schoolId || input.schoolId.trim().length === 0) return "School ID is required";

  const codePattern = /^[A-Z0-9_]{2,10}$/;
  if (!codePattern.test(input.code.trim().toUpperCase())) {
    return "Code must be 2–10 uppercase letters, numbers, or underscores (e.g. TUI, ICT_LEVY)";
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE
// ════════════════════════════════════════════════════════════════════════════

export async function createFeeCategory(
  input: CreateFeeCategoryInput
): Promise<ActionResult<FeeCategory>> {
  try {
    const validationError = validateFeeCategoryInput(input);
    if (validationError) return { ok: false, error: validationError };

    const code = input.code.trim().toUpperCase();

    const existing = await db.feeCategory.findUnique({
      where: { schoolId_code: { schoolId: input.schoolId, code } },
    });
    if (existing) {
      return { ok: false, error: `A fee category with code '${code}' already exists` };
    }

    const category = await db.feeCategory.create({
      data: {
        schoolId: input.schoolId,
        name: input.name.trim(),
        code,
        description: input.description?.trim(),
        isOptional: input.isOptional ?? false,
        isMandatory: input.isMandatory ?? true,
      },
    });

    revalidatePath("/dashboard/fees/categories");
    return { ok: true, data: category };
  } catch (error) {
    console.error("Error creating fee category:", error);
    return { ok: false, error: "Failed to create fee category. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — ALL FOR SCHOOL
// ════════════════════════════════════════════════════════════════════════════

export async function getFeeCategories(
  schoolId: string,
  activeOnly = false
): Promise<ActionResult<FeeCategory[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const categories = await db.feeCategory.findMany({
      where: { schoolId, ...(activeOnly && { isActive: true }) },
      orderBy: [{ isMandatory: "desc" }, { name: "asc" }],
    });

    return { ok: true, data: categories };
  } catch (error) {
    console.error("Error fetching fee categories:", error);
    return { ok: false, error: "Failed to fetch fee categories" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — WITH STATS
// ════════════════════════════════════════════════════════════════════════════

export async function getFeeCategoriesWithStats(
  schoolId: string
): Promise<ActionResult<FeeCategoryWithStats[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const categories = await db.feeCategory.findMany({
      where: { schoolId },
      orderBy: [{ isMandatory: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { structureItems: true, invoiceItems: true } },
      },
    });

    const withStats: FeeCategoryWithStats[] = categories.map((cat) => ({
      ...cat,
      stats: {
        totalStructureItems: cat._count.structureItems,
        totalInvoiceItems: cat._count.invoiceItems,
        isInUse: cat._count.structureItems > 0 || cat._count.invoiceItems > 0,
      },
    }));

    return { ok: true, data: withStats };
  } catch (error) {
    console.error("Error fetching fee categories with stats:", error);
    return { ok: false, error: "Failed to fetch fee categories" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — SINGLE
// ════════════════════════════════════════════════════════════════════════════

export async function getFeeCategoryById(
  id: string
): Promise<ActionResult<FeeCategoryWithStats>> {
  try {
    if (!id) return { ok: false, error: "Fee category ID is required" };

    const category = await db.feeCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { structureItems: true, invoiceItems: true } },
      },
    });

    if (!category) return { ok: false, error: "Fee category not found" };

    return {
      ok: true,
      data: {
        ...category,
        stats: {
          totalStructureItems: category._count.structureItems,
          totalInvoiceItems: category._count.invoiceItems,
          isInUse: category._count.structureItems > 0 || category._count.invoiceItems > 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching fee category:", error);
    return { ok: false, error: "Failed to fetch fee category" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE
// ════════════════════════════════════════════════════════════════════════════

export async function updateFeeCategory(
  id: string,
  data: UpdateFeeCategoryInput
): Promise<ActionResult<FeeCategory>> {
  try {
    if (!id) return { ok: false, error: "Fee category ID is required" };

    const existing = await db.feeCategory.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Fee category not found" };

    if (data.code) {
      const code = data.code.trim().toUpperCase();
      const codePattern = /^[A-Z0-9_]{2,10}$/;
      if (!codePattern.test(code)) {
        return { ok: false, error: "Code must be 2–10 uppercase letters, numbers, or underscores" };
      }

      const duplicate = await db.feeCategory.findFirst({
        where: { schoolId: existing.schoolId, code, id: { not: id } },
      });
      if (duplicate) {
        return { ok: false, error: `Code '${code}' is already used by another category` };
      }
      data.code = code;
    }

    const updated = await db.feeCategory.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.code && { code: data.code }),
        ...(data.description !== undefined && { description: data.description?.trim() }),
        ...(data.isOptional !== undefined && { isOptional: data.isOptional }),
        ...(data.isMandatory !== undefined && { isMandatory: data.isMandatory }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath("/dashboard/fees/categories");
    return { ok: true, data: updated };
  } catch (error) {
    console.error("Error updating fee category:", error);
    return { ok: false, error: "Failed to update fee category. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════════════════════════════════════

export async function deleteFeeCategory(
  id: string
): Promise<ActionResult<FeeCategory>> {
  try {
    if (!id) return { ok: false, error: "Fee category ID is required" };

    const existing = await db.feeCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { structureItems: true, invoiceItems: true } },
      },
    });
    if (!existing) return { ok: false, error: "Fee category not found" };

    if (existing._count.invoiceItems > 0) {
      return {
        ok: false,
        error: `Cannot delete: this category is used in ${existing._count.invoiceItems} invoice(s). Deactivate it instead.`,
      };
    }

    if (existing._count.structureItems > 0) {
      return {
        ok: false,
        error: `Cannot delete: this category is used in ${existing._count.structureItems} fee structure(s). Remove it from those structures first.`,
      };
    }

    const deleted = await db.feeCategory.delete({ where: { id } });
    revalidatePath("/dashboard/fees/categories");
    return { ok: true, data: deleted };
  } catch (error) {
    console.error("Error deleting fee category:", error);
    return { ok: false, error: "Failed to delete fee category. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TOGGLE ACTIVE
// ════════════════════════════════════════════════════════════════════════════

export async function toggleFeeCategoryStatus(
  id: string
): Promise<ActionResult<FeeCategory>> {
  try {
    if (!id) return { ok: false, error: "Fee category ID is required" };

    const category = await db.feeCategory.findUnique({ where: { id } });
    if (!category) return { ok: false, error: "Fee category not found" };

    return updateFeeCategory(id, { isActive: !category.isActive });
  } catch (error) {
    console.error("Error toggling fee category status:", error);
    return { ok: false, error: "Failed to toggle fee category status" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BULK CREATE (seed common categories)
// ════════════════════════════════════════════════════════════════════════════

export async function bulkCreateFeeCategories(
  schoolId: string,
  categories: Array<{
    name: string;
    code: string;
    description?: string;
    isOptional?: boolean;
    isMandatory?: boolean;
  }>
): Promise<ActionResult<FeeCategory[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };
    if (!categories || categories.length === 0) {
      return { ok: false, error: "At least one category is required" };
    }

    const codes = categories.map((c) => c.code.trim().toUpperCase());

    const existing = await db.feeCategory.findMany({
      where: { schoolId, code: { in: codes } },
      select: { code: true },
    });

    if (existing.length > 0) {
      return {
        ok: false,
        error: `The following codes already exist: ${existing.map((e) => e.code).join(", ")}`,
      };
    }

    const created = await db.$transaction(
      categories.map((cat) =>
        db.feeCategory.create({
          data: {
            schoolId,
            name: cat.name.trim(),
            code: cat.code.trim().toUpperCase(),
            description: cat.description?.trim(),
            isOptional: cat.isOptional ?? false,
            isMandatory: cat.isMandatory ?? true,
          },
        })
      )
    );

    revalidatePath("/dashboard/fees/categories");
    return { ok: true, data: created };
  } catch (error) {
    console.error("Error bulk creating fee categories:", error);
    return { ok: false, error: "Failed to create fee categories" };
  }
}