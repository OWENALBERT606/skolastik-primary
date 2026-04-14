"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";

// ─── CORE STOCK MUTATION ─────────────────────────────────────────────────────
// The ONLY function that may update StockItem.quantity.
// Always call inside a db.$transaction().

interface CreateMovementInput {
  stockItemId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  reason: string;
  quantity: number;     // Always positive for IN/OUT. Signed for ADJUSTMENT.
  unitCost?: number;
  referenceId?: string;
  referenceType?: string;
  performedById: string;
  notes?: string;
}

export async function applyStockMovement(
  tx: Prisma.TransactionClient,
  input: CreateMovementInput
) {
  const item = await tx.stockItem.findUniqueOrThrow({
    where: { id: input.stockItemId },
    select: { quantity: true, name: true },
  });

  let delta: number;
  if (input.type === "IN") {
    delta = Math.abs(input.quantity);
  } else if (input.type === "OUT") {
    delta = -Math.abs(input.quantity);
  } else {
    delta = input.quantity;
  }

  const quantityAfter = item.quantity + delta;

  if (quantityAfter < 0) {
    throw new Error(
      `Insufficient stock for "${item.name}". ` +
        `Available: ${item.quantity}, Requested: ${Math.abs(delta)}`
    );
  }

  const movement = await tx.stockMovement.create({
    data: {
      stockItemId: input.stockItemId,
      type: input.type as any,
      reason: input.reason as any,
      quantity: Math.abs(input.quantity),
      unitCost: input.unitCost,
      totalCost: input.unitCost
        ? input.unitCost * Math.abs(input.quantity)
        : undefined,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      performedById: input.performedById,
      notes: input.notes,
      quantityBefore: item.quantity,
      quantityAfter,
    },
  });

  await tx.stockItem.update({
    where: { id: input.stockItemId },
    data: {
      quantity: quantityAfter,
      ...(input.type === "IN" && input.unitCost
        ? { lastPurchasePrice: input.unitCost }
        : {}),
    },
  });

  return movement;
}

// ─── STORE ACTIONS ───────────────────────────────────────────────────────────

export async function getStores(schoolId: string) {
  return db.store.findMany({
    where: { schoolId, isActive: true },
    include: {
      manager: { select: { name: true } },
      _count: { select: { stockItems: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createStore(data: {
  schoolId: string;
  name: string;
  description?: string;
  location?: string;
  managerId?: string;
}) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const store = await db.store.create({ data });
  revalidatePath(`/inventory`);
  return { success: true, store };
}

export async function updateStore(
  id: string,
  data: {
    name?: string;
    description?: string;
    location?: string;
    managerId?: string;
    isActive?: boolean;
  }
) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const store = await db.store.update({ where: { id }, data });
  revalidatePath(`/inventory`);
  return { success: true, store };
}

// ─── STOCK ITEM ACTIONS ──────────────────────────────────────────────────────

export async function getStockItems(
  storeId: string,
  filters?: { search?: string; category?: string; lowStock?: boolean }
) {
  return db.stockItem.findMany({
    where: {
      storeId,
      isActive: true,
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { code: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
      ...(filters?.category && { category: filters.category }),
    },
    orderBy: { name: "asc" },
  });
}

export async function getAllStockItems(schoolId: string) {
  return db.stockItem.findMany({
    where: { store: { schoolId }, isActive: true },
    include: { store: { select: { name: true } } },
    orderBy: [{ store: { name: "asc" } }, { name: "asc" }],
  });
}

export async function getLowStockItems(schoolId: string) {
  return db.$queryRaw<
    Array<{
      id: string;
      name: string;
      unit: string;
      quantity: number;
      minQuantity: number;
      storeName: string;
      category: string | null;
    }>
  >`
    SELECT
      si.id,
      si.name,
      si.unit,
      si.quantity,
      si."minQuantity",
      s.name AS "storeName",
      si.category
    FROM "StockItem" si
    JOIN "Store" s ON s.id = si."storeId"
    WHERE s."schoolId" = ${schoolId}
      AND si."isActive" = true
      AND si."minQuantity" IS NOT NULL
      AND si.quantity <= si."minQuantity"
    ORDER BY si.quantity ASC
  `;
}

export async function createStockItem(data: {
  storeId: string;
  name: string;
  code?: string;
  description?: string;
  unit: string;
  category?: string;
  minQuantity?: number;
  openingBalance?: number;
  openingCost?: number;
}) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { openingBalance, openingCost, ...itemData } = data;

  return db.$transaction(async (tx) => {
    const item = await tx.stockItem.create({
      data: { ...itemData, quantity: 0 },
    });

    if (openingBalance && openingBalance > 0) {
      await applyStockMovement(tx, {
        stockItemId: item.id,
        type: "IN",
        reason: "OPENING_BALANCE",
        quantity: openingBalance,
        unitCost: openingCost,
        performedById: session.user!.id,
        notes: "Opening balance on item creation",
      });
    }

    revalidatePath(`/inventory`);
    return { success: true, item };
  });
}

export async function updateStockItem(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    unit?: string;
    category?: string;
    minQuantity?: number;
    isActive?: boolean;
  }
) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user) throw new Error("Unauthorized");

  const item = await db.stockItem.update({ where: { id }, data });
  revalidatePath(`/inventory`);
  return { success: true, item };
}

// ─── STOCK MOVEMENT ACTIONS ──────────────────────────────────────────────────

export async function getStockMovements(stockItemId: string, limit = 50) {
  return db.stockMovement.findMany({
    where: { stockItemId },
    include: {
      performedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAllMovements(
  schoolId: string,
  filters?: {
    type?: string;
    storeId?: string;
    from?: Date;
    to?: Date;
  }
) {
  return db.stockMovement.findMany({
    where: {
      stockItem: {
        store: { schoolId },
        ...(filters?.storeId && { storeId: filters.storeId }),
      },
      ...(filters?.type && { type: filters.type as any }),
      ...(filters?.from || filters?.to
        ? {
            createdAt: {
              ...(filters.from && { gte: filters.from }),
              ...(filters.to && { lte: filters.to }),
            },
          }
        : {}),
    },
    include: {
      stockItem: {
        select: { name: true, unit: true, store: { select: { name: true } } },
      },
      performedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function recordStockIn(data: {
  stockItemId: string;
  quantity: number;
  unitCost?: number;
  reason?: string;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
}) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.$transaction(async (tx) => {
    const movement = await applyStockMovement(tx, {
      stockItemId: data.stockItemId,
      type: "IN",
      reason: data.reason ?? "PURCHASE",
      quantity: data.quantity,
      unitCost: data.unitCost,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      performedById: session.user!.id,
      notes: data.notes,
    });

    revalidatePath(`/inventory`);
    return { success: true, movement };
  });
}

export async function recordStockOut(data: {
  stockItemId: string;
  quantity: number;
  reason: string;
  notes?: string;
}) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.$transaction(async (tx) => {
    const movement = await applyStockMovement(tx, {
      stockItemId: data.stockItemId,
      type: "OUT",
      reason: data.reason as any,
      quantity: data.quantity,
      performedById: session.user!.id,
      notes: data.notes,
    });

    revalidatePath(`/inventory`);
    return { success: true, movement };
  });
}

export async function recordAdjustment(data: {
  stockItemId: string;
  quantity: number;
  reason: string;
  notes: string;
}) {
  const session = await getServerSession(authOptions as any) as Session | null;
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.$transaction(async (tx) => {
    const movement = await applyStockMovement(tx, {
      stockItemId: data.stockItemId,
      type: "ADJUSTMENT",
      reason: data.reason as any,
      quantity: data.quantity,
      performedById: session.user!.id,
      notes: data.notes,
    });

    revalidatePath(`/inventory`);
    return { success: true, movement };
  });
}

// ─── INVENTORY DASHBOARD STATS ───────────────────────────────────────────────

export async function getInventoryStats(schoolId: string) {
  const [totalItems, lowStockItems, recentMovements, storeCount] =
    await Promise.all([
      db.stockItem.count({
        where: { store: { schoolId }, isActive: true },
      }),
      getLowStockItems(schoolId),
      db.stockMovement.findMany({
        where: { stockItem: { store: { schoolId } } },
        include: {
          stockItem: { select: { name: true, unit: true } },
          performedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.store.count({ where: { schoolId, isActive: true } }),
    ]);

  return {
    totalItems,
    lowStockCount: lowStockItems.length,
    recentMovements,
    storeCount,
    lowStockItems,
  };
}

export async function getStockUsageReport(
  schoolId: string,
  from: Date,
  to: Date
) {
  return db.$queryRaw<
    Array<{
      itemName: string;
      unit: string;
      storeName: string;
      totalOut: number;
      totalIn: number;
      movementCount: number;
    }>
  >`
    SELECT
      si.name AS "itemName",
      si.unit,
      s.name AS "storeName",
      COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) AS "totalOut",
      COALESCE(SUM(CASE WHEN sm.type = 'IN'  THEN sm.quantity ELSE 0 END), 0) AS "totalIn",
      COUNT(sm.id) AS "movementCount"
    FROM "StockItem" si
    JOIN "Store" s ON s.id = si."storeId"
    LEFT JOIN "StockMovement" sm ON sm."stockItemId" = si.id
      AND sm."createdAt" BETWEEN ${from} AND ${to}
    WHERE s."schoolId" = ${schoolId}
      AND si."isActive" = true
    GROUP BY si.id, si.name, si.unit, s.name
    ORDER BY "totalOut" DESC
  `;
}