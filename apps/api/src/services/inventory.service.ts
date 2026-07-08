import prisma from "../config/prisma.js";
import { Prisma, InventoryStatus, StockMovementType } from "@prisma/client";

export interface InventoryFormInput {
  itemCode?: string;
  itemName: string;
  category?: string;
  unit?: string;
  projectId?: string;
  openingBalance?: number;
  reservedStock?: number;
  reorderLevel?: number;
  minStock?: number;
  maxStock?: number;
  warehouse?: string;
  rackLocation?: string;
  batchNumber?: string;
  supplierId?: string;
  location?: string;
}

export interface InventoryListQuery {
  search?: string;
  status?: string;
  category?: string;
  warehouse?: string;
  projectId?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface StockAdjustmentInput {
  quantity: number;
  direction: "IN" | "OUT";
  remarks?: string;
}

export interface StockLedgerQuery {
  inventoryId?: string;
  movementType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

/** Compute the workflow status of an inventory item from its current stock and thresholds. */
export function computeInventoryStatus(
  currentStock: number,
  reorderLevel: number,
  minStock: number
): InventoryStatus {
  if (currentStock <= 0) return "OUT_OF_STOCK";
  if (minStock > 0 && currentStock <= minStock) return "CRITICAL";
  if (reorderLevel > 0 && currentStock <= reorderLevel) return "LOW";
  return "HEALTHY";
}

function parseStatus(s: string | undefined): InventoryStatus | undefined {
  const valid: Record<string, InventoryStatus> = {
    HEALTHY: "HEALTHY",
    LOW: "LOW",
    CRITICAL: "CRITICAL",
    OUT_OF_STOCK: "OUT_OF_STOCK",
  };
  return s ? valid[s] : undefined;
}

const include = {
  project: { select: { id: true, name: true } },
  supplier: { select: { id: true, name: true } },
};

type InventoryRow = {
  id: string;
  companyId: string;
  projectId: string | null;
  itemCode: string | null;
  itemName: string;
  category: string | null;
  unit: string | null;
  openingBalance: Prisma.Decimal;
  receiptsQuantity: Prisma.Decimal;
  issuesQuantity: Prisma.Decimal;
  currentStock: Prisma.Decimal;
  reservedStock: Prisma.Decimal;
  reorderLevel: Prisma.Decimal;
  minStock: Prisma.Decimal;
  maxStock: Prisma.Decimal;
  warehouse: string | null;
  rackLocation: string | null;
  batchNumber: string | null;
  supplierId: string | null;
  lastReceiptDate: Date | null;
  lastIssueDate: Date | null;
  location: string | null;
  status: InventoryStatus;
  createdAt: Date;
  updatedAt: Date;
  project?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
};

function toDTO(item: InventoryRow) {
  return {
    id: item.id,
    companyId: item.companyId,
    projectId: item.projectId ?? "",
    itemCode: item.itemCode ?? "",
    itemName: item.itemName,
    category: item.category ?? "",
    unit: item.unit ?? "",
    openingBalance: item.openingBalance.toString(),
    receiptsQuantity: item.receiptsQuantity.toString(),
    issuesQuantity: item.issuesQuantity.toString(),
    currentStock: item.currentStock.toString(),
    reservedStock: item.reservedStock.toString(),
    availableStock: item.currentStock.minus(item.reservedStock).toString(),
    reorderLevel: item.reorderLevel.toString(),
    minStock: item.minStock.toString(),
    maxStock: item.maxStock.toString(),
    warehouse: item.warehouse ?? "",
    rackLocation: item.rackLocation ?? "",
    batchNumber: item.batchNumber ?? "",
    supplierId: item.supplierId ?? "",
    supplier: item.supplier ?? null,
    lastReceiptDate: item.lastReceiptDate?.toISOString().slice(0, 10) ?? "",
    lastIssueDate: item.lastIssueDate?.toISOString().slice(0, 10) ?? "",
    location: item.location ?? "",
    status: item.status,
    project: item.project ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function listInventory(companyId: string, query: InventoryListQuery) {
  const {
    search = "",
    status,
    category,
    warehouse,
    projectId,
    supplierId,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.InventoryWhereInput = {
    companyId,
    ...(parseStatus(status) && { status: parseStatus(status) }),
    ...(category && { category }),
    ...(warehouse && { warehouse }),
    ...(projectId && { projectId }),
    ...(supplierId && { supplierId }),
    ...(search && {
      OR: [
        { itemName: { contains: search, mode: "insensitive" } },
        { itemCode: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { warehouse: { contains: search, mode: "insensitive" } },
        { rackLocation: { contains: search, mode: "insensitive" } },
        { batchNumber: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowed = ["itemName", "itemCode", "category", "currentStock", "status", "warehouse", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "createdAt";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, items] = await Promise.all([
    prisma.inventory.count({ where }),
    prisma.inventory.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: items.map(toDTO) };
}

export async function getInventoryById(id: string, companyId: string) {
  const item = await prisma.inventory.findFirst({ where: { id, companyId }, include });
  if (!item) throw new Error("Inventory item not found");
  return toDTO(item);
}

export async function createInventoryItem(companyId: string, input: InventoryFormInput) {
  if (!input.itemName?.trim()) throw new Error("Item name is required");

  const openingBalance = input.openingBalance ?? 0;
  const reorderLevel = input.reorderLevel ?? 0;
  const minStock = input.minStock ?? 0;
  const status = computeInventoryStatus(openingBalance, reorderLevel, minStock);

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.inventory.create({
      data: {
        companyId,
        projectId: input.projectId || null,
        itemCode: input.itemCode || null,
        itemName: input.itemName.trim(),
        category: input.category || null,
        unit: input.unit || null,
        openingBalance,
        receiptsQuantity: 0,
        issuesQuantity: 0,
        currentStock: openingBalance,
        reservedStock: input.reservedStock ?? 0,
        reorderLevel,
        minStock,
        maxStock: input.maxStock ?? 0,
        warehouse: input.warehouse || null,
        rackLocation: input.rackLocation || null,
        batchNumber: input.batchNumber || null,
        supplierId: input.supplierId || null,
        location: input.location || null,
        status,
      },
      include,
    });

    if (openingBalance > 0) {
      await tx.stockLedgerEntry.create({
        data: {
          companyId,
          inventoryId: created.id,
          projectId: input.projectId || null,
          movementType: "OPENING" as StockMovementType,
          quantity: openingBalance,
          balanceAfter: openingBalance,
          referenceType: "Manual",
          remarks: "Opening stock",
        },
      });
    }

    return created;
  });

  return toDTO(item);
}

export async function updateInventoryItem(id: string, companyId: string, input: InventoryFormInput) {
  const existing = await prisma.inventory.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Inventory item not found");

  if (!input.itemName?.trim()) throw new Error("Item name is required");

  const reorderLevel = input.reorderLevel ?? Number(existing.reorderLevel);
  const minStock = input.minStock ?? Number(existing.minStock);
  const status = computeInventoryStatus(Number(existing.currentStock), reorderLevel, minStock);

  const item = await prisma.inventory.update({
    where: { id },
    data: {
      projectId: input.projectId || null,
      itemCode: input.itemCode || null,
      itemName: input.itemName.trim(),
      category: input.category || null,
      unit: input.unit || null,
      reservedStock: input.reservedStock ?? existing.reservedStock,
      reorderLevel,
      minStock,
      maxStock: input.maxStock ?? existing.maxStock,
      warehouse: input.warehouse || null,
      rackLocation: input.rackLocation || null,
      batchNumber: input.batchNumber || null,
      supplierId: input.supplierId || null,
      location: input.location || null,
      status,
    },
    include,
  });

  return toDTO(item);
}

export async function deleteInventoryItem(id: string, companyId: string) {
  const existing = await prisma.inventory.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Inventory item not found");

  const [ledgerCount, receiptCount] = await Promise.all([
    prisma.stockLedgerEntry.count({ where: { inventoryId: id } }),
    prisma.materialReceipt.count({ where: { inventoryId: id } }),
  ]);

  if (ledgerCount > 0 || receiptCount > 0) {
    throw new Error("Cannot delete an inventory item that already has stock movements. Consider deactivating it instead.");
  }

  return prisma.inventory.delete({ where: { id } });
}

/** Manual stock correction (not tied to a Material Receipt/Issue). Logs an ADJUSTMENT ledger entry. */
export async function adjustInventoryStock(id: string, companyId: string, input: StockAdjustmentInput) {
  const existing = await prisma.inventory.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Inventory item not found");

  if (!input.quantity || input.quantity <= 0) {
    throw new Error("Adjustment quantity must be greater than zero");
  }

  const delta = input.direction === "OUT" ? -input.quantity : input.quantity;
  const newBalance = Number(existing.currentStock) + delta;

  if (newBalance < 0) {
    throw new Error("Adjustment would result in negative stock");
  }

  const status = computeInventoryStatus(newBalance, Number(existing.reorderLevel), Number(existing.minStock));

  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventory.update({
      where: { id },
      data: {
        currentStock: newBalance,
        status,
        ...(input.direction === "OUT" ? { lastIssueDate: new Date() } : {}),
      },
      include,
    });

    await tx.stockLedgerEntry.create({
      data: {
        companyId,
        inventoryId: id,
        projectId: existing.projectId,
        movementType: "ADJUSTMENT",
        quantity: input.quantity,
        balanceAfter: newBalance,
        referenceType: "Manual",
        remarks: input.remarks || (input.direction === "OUT" ? "Manual stock reduction" : "Manual stock addition"),
      },
    });

    return updated;
  });

  return toDTO(item);
}

export async function getStockLedger(companyId: string, query: StockLedgerQuery) {
  const { inventoryId, movementType, fromDate, toDate, page = 1, limit = 50 } = query;

  const validMovementTypes: Record<string, StockMovementType> = {
    OPENING: "OPENING",
    RECEIPT: "RECEIPT",
    ISSUE: "ISSUE",
    ADJUSTMENT: "ADJUSTMENT",
  };

  const where: Prisma.StockLedgerEntryWhereInput = {
    companyId,
    ...(inventoryId && { inventoryId }),
    ...(movementType && validMovementTypes[movementType] && { movementType: validMovementTypes[movementType] }),
    ...(fromDate || toDate
      ? { movementDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
  };

  const skip = (Math.max(1, page) - 1) * Math.min(200, limit);
  const take = Math.min(200, limit);

  const [total, entries] = await Promise.all([
    prisma.stockLedgerEntry.count({ where }),
    prisma.stockLedgerEntry.findMany({
      where,
      include: { inventory: { select: { id: true, itemCode: true, itemName: true, unit: true } } },
      orderBy: { movementDate: "desc" },
      skip,
      take,
    }),
  ]);

  return {
    total,
    page,
    limit: take,
    data: entries.map((e) => ({
      id: e.id,
      inventoryId: e.inventoryId,
      item: e.inventory,
      movementType: e.movementType,
      quantity: e.quantity.toString(),
      balanceAfter: e.balanceAfter.toString(),
      referenceType: e.referenceType ?? "",
      referenceId: e.referenceId ?? "",
      referenceNumber: e.referenceNumber ?? "",
      remarks: e.remarks ?? "",
      movementDate: e.movementDate.toISOString(),
    })),
  };
}

export async function getLowStockAlerts(companyId: string) {
  const items = await prisma.inventory.findMany({
    where: { companyId, status: { in: ["LOW", "CRITICAL", "OUT_OF_STOCK"] } },
    include,
    orderBy: [{ status: "asc" }, { currentStock: "asc" }],
  });

  const severityOrder: Record<InventoryStatus, number> = {
    OUT_OF_STOCK: 0,
    CRITICAL: 1,
    LOW: 2,
    HEALTHY: 3,
  };

  return items
    .map(toDTO)
    .sort((a, b) => severityOrder[a.status] - severityOrder[b.status]);
}

export async function getInventoryDashboard(companyId: string) {
  const [total, healthy, low, critical, outOfStock, recentMovements] = await Promise.all([
    prisma.inventory.count({ where: { companyId } }),
    prisma.inventory.count({ where: { companyId, status: "HEALTHY" } }),
    prisma.inventory.count({ where: { companyId, status: "LOW" } }),
    prisma.inventory.count({ where: { companyId, status: "CRITICAL" } }),
    prisma.inventory.count({ where: { companyId, status: "OUT_OF_STOCK" } }),
    prisma.stockLedgerEntry.findMany({
      where: { companyId },
      include: { inventory: { select: { id: true, itemCode: true, itemName: true, unit: true } } },
      orderBy: { movementDate: "desc" },
      take: 10,
    }),
  ]);

  const stockAgg = await prisma.inventory.aggregate({
    where: { companyId },
    _sum: { currentStock: true, reservedStock: true },
  });

  return {
    totalItems: total,
    healthyCount: healthy,
    lowCount: low,
    criticalCount: critical,
    outOfStockCount: outOfStock,
    totalCurrentStock: (stockAgg._sum.currentStock ?? new Prisma.Decimal(0)).toString(),
    totalReservedStock: (stockAgg._sum.reservedStock ?? new Prisma.Decimal(0)).toString(),
    recentMovements: recentMovements.map((e) => ({
      id: e.id,
      item: e.inventory,
      movementType: e.movementType,
      quantity: e.quantity.toString(),
      balanceAfter: e.balanceAfter.toString(),
      referenceNumber: e.referenceNumber ?? "",
      movementDate: e.movementDate.toISOString(),
    })),
  };
}

export async function exportInventoryToCSV(companyId: string, query: InventoryListQuery) {
  const { data } = await listInventory(companyId, { ...query, page: 1, limit: 5000 });

  const headers = [
    "Item Code",
    "Item Name",
    "Category",
    "Unit",
    "Opening Stock",
    "Received Qty",
    "Issued Qty",
    "Current Stock",
    "Reserved Stock",
    "Available Stock",
    "Reorder Level",
    "Min Stock",
    "Max Stock",
    "Warehouse",
    "Rack Location",
    "Batch Number",
    "Supplier",
    "Last Receipt Date",
    "Last Issue Date",
    "Status",
  ];

  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = data.map((item) =>
    [
      item.itemCode,
      item.itemName,
      item.category,
      item.unit,
      item.openingBalance,
      item.receiptsQuantity,
      item.issuesQuantity,
      item.currentStock,
      item.reservedStock,
      item.availableStock,
      item.reorderLevel,
      item.minStock,
      item.maxStock,
      item.warehouse,
      item.rackLocation,
      item.batchNumber,
      item.supplier?.name ?? "",
      item.lastReceiptDate,
      item.lastIssueDate,
      item.status,
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Applies a Material Receipt's accepted quantity to Inventory: finds or creates the
 * matching Inventory item (scoped by companyId + projectId + itemName), increments
 * receiptsQuantity/currentStock, backfills blank master fields (itemCode/warehouse/
 * batchNumber/supplier), recomputes status, and writes a RECEIPT stock ledger entry.
 *
 * Must be called from within an existing Prisma transaction.
 */
export async function applyReceiptToInventory(
  tx: Prisma.TransactionClient,
  companyId: string,
  params: {
    projectId: string | null;
    vendorId: string | null;
    itemCode?: string | null;
    itemName: string;
    unit?: string | null;
    quantity: number;
    warehouse?: string | null;
    batchNumber?: string | null;
    referenceId: string;
    referenceNumber: string;
    movementDate: Date;
  }
) {
  if (params.quantity <= 0) return;

  const existing = await tx.inventory.findFirst({
    where: { companyId, projectId: params.projectId ?? undefined, itemName: params.itemName },
  });

  let inventoryId: string;
  let newBalance: number;

  if (existing) {
    newBalance = Number(existing.currentStock) + params.quantity;
    const status = computeInventoryStatus(newBalance, Number(existing.reorderLevel), Number(existing.minStock));

    const updated = await tx.inventory.update({
      where: { id: existing.id },
      data: {
        receiptsQuantity: { increment: params.quantity },
        currentStock: newBalance,
        lastReceiptDate: params.movementDate,
        status,
        itemCode: existing.itemCode ?? params.itemCode ?? null,
        warehouse: existing.warehouse ?? params.warehouse ?? null,
        batchNumber: existing.batchNumber ?? params.batchNumber ?? null,
        supplierId: existing.supplierId ?? params.vendorId ?? null,
        unit: existing.unit ?? params.unit ?? null,
      },
    });
    inventoryId = updated.id;
  } else {
    newBalance = params.quantity;
    const status = computeInventoryStatus(newBalance, 0, 0);

    const created = await tx.inventory.create({
      data: {
        companyId,
        projectId: params.projectId ?? null,
        itemCode: params.itemCode || null,
        itemName: params.itemName,
        unit: params.unit || null,
        openingBalance: 0,
        receiptsQuantity: params.quantity,
        issuesQuantity: 0,
        currentStock: newBalance,
        warehouse: params.warehouse || null,
        batchNumber: params.batchNumber || null,
        supplierId: params.vendorId || null,
        lastReceiptDate: params.movementDate,
        status,
      },
    });
    inventoryId = created.id;
  }

  await tx.stockLedgerEntry.create({
    data: {
      companyId,
      inventoryId,
      projectId: params.projectId ?? null,
      movementType: "RECEIPT",
      quantity: params.quantity,
      balanceAfter: newBalance,
      referenceType: "MaterialReceipt",
      referenceId: params.referenceId,
      referenceNumber: params.referenceNumber,
      movementDate: params.movementDate,
    },
  });
}

/**
 * Applies a Material Issue's quantity to Inventory: validates sufficient available
 * stock (current minus reserved), decrements currentStock, increments
 * issuesQuantity, recomputes status, and writes an ISSUE stock ledger entry.
 * Must be called from within an existing Prisma transaction. Throws if the issue
 * would exceed available stock or result in negative stock.
 */
export async function applyIssueToInventory(
  tx: Prisma.TransactionClient,
  companyId: string,
  params: {
    inventoryId: string;
    quantity: number;
    referenceId: string;
    referenceNumber: string;
    movementDate: Date;
  }
) {
  const inventory = await tx.inventory.findFirst({ where: { id: params.inventoryId, companyId } });
  if (!inventory) throw new Error("Inventory item not found");

  const availableStock = Number(inventory.currentStock) - Number(inventory.reservedStock);
  if (params.quantity > availableStock) {
    throw new Error(
      `Cannot issue ${params.quantity} ${inventory.unit ?? "units"} of ${inventory.itemName} — only ${availableStock} available`
    );
  }

  const newBalance = Number(inventory.currentStock) - params.quantity;
  if (newBalance < 0) {
    throw new Error("Issue would result in negative stock");
  }

  const status = computeInventoryStatus(newBalance, Number(inventory.reorderLevel), Number(inventory.minStock));

  await tx.inventory.update({
    where: { id: inventory.id },
    data: {
      issuesQuantity: { increment: params.quantity },
      currentStock: newBalance,
      lastIssueDate: params.movementDate,
      status,
    },
  });

  await tx.stockLedgerEntry.create({
    data: {
      companyId,
      inventoryId: inventory.id,
      projectId: inventory.projectId,
      movementType: "ISSUE",
      quantity: params.quantity,
      balanceAfter: newBalance,
      referenceType: "MaterialIssue",
      referenceId: params.referenceId,
      referenceNumber: params.referenceNumber,
      movementDate: params.movementDate,
    },
  });
}
