"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { FeeStructure, FeeStructureItem } from "@prisma/client";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type FeeStructureWithItems = FeeStructure & {
  items: (FeeStructureItem & {
    feeCategory: { id: string; name: string; code: string };
  })[];
  term: { id: string; name: string; termNumber: number };
  classYear: {
    id: string;
    classTemplate: { id: string; name: string; code: string | null };
  };
  _count?: { invoices: number };
};

interface CreateFeeStructureInput {
  schoolId: string;
  academicYearId: string;
  termId: string;
  classYearId: string;
  name?: string;
  items: Array<{
    feeCategoryId: string;
    amount: number;
    dueDate?: Date;
    notes?: string;
  }>;
}

interface UpdateFeeStructureInput {
  name?: string;
  items?: Array<{
    feeCategoryId: string;
    amount: number;
    dueDate?: Date;
    notes?: string;
  }>;
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════════════════════

function validateFeeStructureInput(input: CreateFeeStructureInput): string | null {
  if (!input.schoolId) return "School ID is required";
  if (!input.academicYearId) return "Academic year is required";
  if (!input.termId) return "Term is required";
  if (!input.classYearId) return "Class year is required";
  if (!input.items || input.items.length === 0) return "At least one fee item is required";

  for (const item of input.items) {
    if (!item.feeCategoryId) return "Each item must have a fee category";
    if (item.amount <= 0) return "Each item amount must be greater than zero";
  }

  // Check for duplicate categories in items
  const categoryIds = input.items.map((i) => i.feeCategoryId);
  const uniqueIds = new Set(categoryIds);
  if (uniqueIds.size !== categoryIds.length) {
    return "Duplicate fee categories are not allowed in the same structure";
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE — with items in one transaction
// ════════════════════════════════════════════════════════════════════════════

export async function createFeeStructure(
  input: CreateFeeStructureInput
): Promise<ActionResult<FeeStructureWithItems>> {
  try {
    const validationError = validateFeeStructureInput(input);
    if (validationError) return { ok: false, error: validationError };

    // Only one fee structure per classYear+term
    const existing = await db.feeStructure.findUnique({
      where: {
        academicYearId_termId_classYearId: {
          academicYearId: input.academicYearId,
          termId: input.termId,
          classYearId: input.classYearId,
        },
      },
    });
    if (existing) {
      return {
        ok: false,
        error: "A fee structure already exists for this class and term. Edit it instead.",
      };
    }

    // Verify all fee categories belong to the school and are active
    const categories = await db.feeCategory.findMany({
      where: {
        id: { in: input.items.map((i) => i.feeCategoryId) },
        schoolId: input.schoolId,
        isActive: true,
      },
      select: { id: true, name: true },
    });

    if (categories.length !== input.items.length) {
      return {
        ok: false,
        error: "One or more fee categories are invalid, inactive, or do not belong to this school",
      };
    }

    const totalAmount = input.items.reduce((sum, item) => sum + item.amount, 0);

    const structure = await db.$transaction(async (tx) => {
      const created = await tx.feeStructure.create({
        data: {
          schoolId: input.schoolId,
          academicYearId: input.academicYearId,
          termId: input.termId,
          classYearId: input.classYearId,
          name: input.name?.trim(),
          totalAmount,
          isPublished: false,
          items: {
            create: input.items.map((item) => ({
              feeCategoryId: item.feeCategoryId,
              amount: item.amount,
              dueDate: item.dueDate,
              notes: item.notes?.trim(),
            })),
          },
        },
        include: {
          items: { include: { feeCategory: { select: { id: true, name: true, code: true } } } },
          term: { select: { id: true, name: true, termNumber: true } },
          classYear: {
            select: {
              id: true,
              classTemplate: { select: { id: true, name: true, code: true } },
            },
          },
          _count: { select: { invoices: true } },
        },
      });
      return created;
    });

    revalidatePath("/dashboard/fees/structures");
    return { ok: true, data: structure };
  } catch (error) {
    console.error("Error creating fee structure:", error);
    return { ok: false, error: "Failed to create fee structure. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — ALL FOR SCHOOL
// ════════════════════════════════════════════════════════════════════════════

export async function getFeeStructuresBySchool(
  schoolId: string
): Promise<ActionResult<FeeStructureWithItems[]>> {
  try {
    if (!schoolId) return { ok: false, error: "School ID is required" };

    const structures = await db.feeStructure.findMany({
      where: { schoolId },
      orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }],
      include: {
        items: { include: { feeCategory: { select: { id: true, name: true, code: true } } } },
        term: { select: { id: true, name: true, termNumber: true } },
        classYear: {
          select: {
            id: true,
            classTemplate: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { invoices: true } },
      },
    });

    return { ok: true, data: structures };
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return { ok: false, error: "Failed to fetch fee structures" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — BY TERM
// ════════════════════════════════════════════════════════════════════════════

export async function getFeeStructuresByTerm(
  termId: string
): Promise<ActionResult<FeeStructureWithItems[]>> {
  try {
    if (!termId) return { ok: false, error: "Term ID is required" };

    const structures = await db.feeStructure.findMany({
      where: { termId },
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { feeCategory: { select: { id: true, name: true, code: true } } } },
        term: { select: { id: true, name: true, termNumber: true } },
        classYear: {
          select: {
            id: true,
            classTemplate: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { invoices: true } },
      },
    });

    return { ok: true, data: structures };
  } catch (error) {
    console.error("Error fetching fee structures by term:", error);
    return { ok: false, error: "Failed to fetch fee structures" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — SINGLE
// ════════════════════════════════════════════════════════════════════════════

export async function getFeeStructureById(
  id: string
): Promise<ActionResult<FeeStructureWithItems>> {
  try {
    if (!id) return { ok: false, error: "Fee structure ID is required" };

    const structure = await db.feeStructure.findUnique({
      where: { id },
      include: {
        items: {
          include: { feeCategory: { select: { id: true, name: true, code: true } } },
          orderBy: { feeCategory: { name: "asc" } },
        },
        term: { select: { id: true, name: true, termNumber: true } },
        classYear: {
          select: {
            id: true,
            classTemplate: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { invoices: true } },
      },
    });

    if (!structure) return { ok: false, error: "Fee structure not found" };
    return { ok: true, data: structure };
  } catch (error) {
    console.error("Error fetching fee structure:", error);
    return { ok: false, error: "Failed to fetch fee structure" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — FOR A SPECIFIC CLASS+TERM (used by auto-invoice)
// ════════════════════════════════════════════════════════════════════════════

export async function getFeeStructureForClassTerm(
  academicYearId: string,
  termId: string,
  classYearId: string
): Promise<ActionResult<FeeStructureWithItems>> {
  try {
    const structure = await db.feeStructure.findUnique({
      where: {
        academicYearId_termId_classYearId: { academicYearId, termId, classYearId },
      },
      include: {
        items: {
          include: { feeCategory: { select: { id: true, name: true, code: true } } },
          where: { feeCategory: { isActive: true } },
        },
        term: { select: { id: true, name: true, termNumber: true } },
        classYear: {
          select: {
            id: true,
            classTemplate: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { invoices: true } },
      },
    });

    if (!structure) return { ok: false, error: "No fee structure found for this class and term" };
    if (!structure.isPublished) {
      return {
        ok: false,
        error: "Fee structure exists but is not yet published. Publish it before enrolling students.",
      };
    }

    return { ok: true, data: structure };
  } catch (error) {
    console.error("Error fetching fee structure for class/term:", error);
    return { ok: false, error: "Failed to fetch fee structure" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE ITEMS — replaces all items atomically (draft only)
// ════════════════════════════════════════════════════════════════════════════

export async function updateFeeStructure(
  id: string,
  data: UpdateFeeStructureInput
): Promise<ActionResult<FeeStructureWithItems>> {
  try {
    if (!id) return { ok: false, error: "Fee structure ID is required" };

    const existing = await db.feeStructure.findUnique({
      where: { id },
      include: { _count: { select: { invoices: true } } },
    });
    if (!existing) return { ok: false, error: "Fee structure not found" };

    if (existing.isPublished) {
      return {
        ok: false,
        error: "Cannot edit a published fee structure. Unpublish it first.",
      };
    }

    if (data.items) {
      if (data.items.length === 0) return { ok: false, error: "At least one fee item is required" };

      for (const item of data.items) {
        if (item.amount <= 0) return { ok: false, error: "Each item amount must be greater than zero" };
      }

      const categoryIds = data.items.map((i) => i.feeCategoryId);
      if (new Set(categoryIds).size !== categoryIds.length) {
        return { ok: false, error: "Duplicate fee categories are not allowed" };
      }
    }

    const updated = await db.$transaction(async (tx) => {
      if (data.items) {
        // Delete all existing items and replace
        await tx.feeStructureItem.deleteMany({ where: { feeStructureId: id } });

        const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

        return tx.feeStructure.update({
          where: { id },
          data: {
            ...(data.name !== undefined && { name: data.name?.trim() }),
            totalAmount,
            items: {
              create: data.items.map((item) => ({
                feeCategoryId: item.feeCategoryId,
                amount: item.amount,
                dueDate: item.dueDate,
                notes: item.notes?.trim(),
              })),
            },
          },
          include: {
            items: { include: { feeCategory: { select: { id: true, name: true, code: true } } } },
            term: { select: { id: true, name: true, termNumber: true } },
            classYear: {
              select: {
                id: true,
                classTemplate: { select: { id: true, name: true, code: true } },
              },
            },
            _count: { select: { invoices: true } },
          },
        });
      }

      return tx.feeStructure.update({
        where: { id },
        data: { ...(data.name !== undefined && { name: data.name?.trim() }) },
        include: {
          items: { include: { feeCategory: { select: { id: true, name: true, code: true } } } },
          term: { select: { id: true, name: true, termNumber: true } },
          classYear: {
            select: {
              id: true,
              classTemplate: { select: { id: true, name: true, code: true } },
            },
          },
          _count: { select: { invoices: true } },
        },
      });
    });

    revalidatePath("/dashboard/fees/structures");
    revalidatePath(`/dashboard/fees/structures/${id}`);
    return { ok: true, data: updated };
  } catch (error) {
    console.error("Error updating fee structure:", error);
    return { ok: false, error: "Failed to update fee structure. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PUBLISH — makes structure available for auto-invoice
// ════════════════════════════════════════════════════════════════════════════

export async function publishFeeStructure(
  id: string
): Promise<ActionResult<FeeStructure>> {
  try {
    if (!id) return { ok: false, error: "Fee structure ID is required" };

    const structure = await db.feeStructure.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });
    if (!structure) return { ok: false, error: "Fee structure not found" };
    if (structure.isPublished) return { ok: false, error: "Fee structure is already published" };
    if (structure._count.items === 0) {
      return { ok: false, error: "Cannot publish a fee structure with no items" };
    }
    if (structure.totalAmount <= 0) {
      return { ok: false, error: "Cannot publish a fee structure with zero total amount" };
    }

    const published = await db.feeStructure.update({
      where: { id },
      data: { isPublished: true },
    });

    revalidatePath("/dashboard/fees/structures");
    revalidatePath(`/dashboard/fees/structures/${id}`);
    return { ok: true, data: published };
  } catch (error) {
    console.error("Error publishing fee structure:", error);
    return { ok: false, error: "Failed to publish fee structure" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UNPUBLISH
// ════════════════════════════════════════════════════════════════════════════

export async function unpublishFeeStructure(
  id: string
): Promise<ActionResult<FeeStructure>> {
  try {
    if (!id) return { ok: false, error: "Fee structure ID is required" };

    const structure = await db.feeStructure.findUnique({
      where: { id },
      include: { _count: { select: { invoices: true } } },
    });
    if (!structure) return { ok: false, error: "Fee structure not found" };
    if (!structure.isPublished) return { ok: false, error: "Fee structure is not published" };

    if (structure._count.invoices > 0) {
      return {
        ok: false,
        error: `Cannot unpublish: ${structure._count.invoices} invoice(s) have already been generated from this structure`,
      };
    }

    const unpublished = await db.feeStructure.update({
      where: { id },
      data: { isPublished: false },
    });

    revalidatePath("/dashboard/fees/structures");
    return { ok: true, data: unpublished };
  } catch (error) {
    console.error("Error unpublishing fee structure:", error);
    return { ok: false, error: "Failed to unpublish fee structure" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════════════════════════════════════

export async function deleteFeeStructure(
  id: string
): Promise<ActionResult<FeeStructure>> {
  try {
    if (!id) return { ok: false, error: "Fee structure ID is required" };

    const structure = await db.feeStructure.findUnique({
      where: { id },
      include: { _count: { select: { invoices: true } } },
    });
    if (!structure) return { ok: false, error: "Fee structure not found" };

    if (structure.isPublished) {
      return { ok: false, error: "Cannot delete a published fee structure. Unpublish it first." };
    }
    if (structure._count.invoices > 0) {
      return {
        ok: false,
        error: `Cannot delete: ${structure._count.invoices} invoice(s) exist for this structure`,
      };
    }

    const deleted = await db.feeStructure.delete({ where: { id } });
    revalidatePath("/dashboard/fees/structures");
    return { ok: true, data: deleted };
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return { ok: false, error: "Failed to delete fee structure. Please try again." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COPY — duplicate a structure to another term/class
// ════════════════════════════════════════════════════════════════════════════

export async function copyFeeStructure(
  sourceId: string,
  target: { academicYearId: string; termId: string; classYearId: string; name?: string }
): Promise<ActionResult<FeeStructureWithItems>> {
  try {
    if (!sourceId) return { ok: false, error: "Source fee structure ID is required" };

    const source = await db.feeStructure.findUnique({
      where: { id: sourceId },
      include: { items: true },
    });
    if (!source) return { ok: false, error: "Source fee structure not found" };

    const alreadyExists = await db.feeStructure.findUnique({
      where: {
        academicYearId_termId_classYearId: {
          academicYearId: target.academicYearId,
          termId: target.termId,
          classYearId: target.classYearId,
        },
      },
    });
    if (alreadyExists) {
      return {
        ok: false,
        error: "A fee structure already exists for the target class and term",
      };
    }

    return createFeeStructure({
      schoolId: source.schoolId,
      academicYearId: target.academicYearId,
      termId: target.termId,
      classYearId: target.classYearId,
      name: target.name ?? `Copy of ${source.name ?? "Fee Structure"}`,
      items: source.items.map((item) => ({
        feeCategoryId: item.feeCategoryId,
        amount: item.amount,
        dueDate: item.dueDate ?? undefined,
        notes: item.notes ?? undefined,
      })),
    });
  } catch (error) {
    console.error("Error copying fee structure:", error);
    return { ok: false, error: "Failed to copy fee structure" };
  }
}