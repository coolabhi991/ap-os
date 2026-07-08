import prisma from "../config/prisma.js";
import { Prisma, ReceiptStatus } from "@prisma/client";
import { applyReceiptToInventory } from "./inventory.service.js";

export interface ReceiptItem {
  poItemIndex: number;
  itemCode: string;
  itemName: string;
  description: string;
  unit: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  receivingQty: number;
  acceptedQty: number;
  rejectedQty: number;
  balanceQty: number;
}

export interface MRFormInput {
  purchaseOrderId: string;
  projectId?: string;
  vendorId?: string;
  receivedDate?: string;
  challanNumber?: string;
  supplierInvoiceNumber?: string;
  vehicleNumber?: string;
  receivedBy?: string;
  supplierRepresentative?: string;
  qualityStatus?: string;
  items: ReceiptItem[];
  status?: string;
  remarks?: string;
  notes?: string;
}

export interface MRListQuery {
  search?: string;
  status?: string;
  projectId?: string;
  vendorId?: string;
  purchaseOrderId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function parseStatus(s: string | undefined): ReceiptStatus {
  const valid: Record<string, ReceiptStatus> = {
    PENDING: "PENDING",
    IN_TRANSIT: "IN_TRANSIT",
    RECEIVED: "RECEIVED",
    PARTIALLY_RECEIVED: "PARTIALLY_RECEIVED",
    REJECTED: "REJECTED",
  };
  return valid[s ?? ""] ?? "PENDING";
}

function autoGRN(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `GRN-${y}${m}-${rand}`;
}

const mrInclude = {
  project: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  purchaseOrder: { select: { id: true, poNumber: true } },
};

type MRRow = {
  id: string;
  companyId: string;
  projectId: string | null;
  vendorId: string | null;
  purchaseOrderId: string | null;
  receiptNumber: string;
  receivedDate: Date;
  challanNumber: string | null;
  supplierInvoiceNumber: string | null;
  vehicleNumber: string | null;
  receivedBy: string | null;
  supplierRepresentative: string | null;
  items: Prisma.JsonValue;
  itemName: string;
  quantity: Prisma.Decimal;
  unit: string | null;
  qualityStatus: string | null;
  status: ReceiptStatus;
  remarks: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: { id: string; name: string } | null;
  vendor?: { id: string; name: string } | null;
  purchaseOrder?: { id: string; poNumber: string } | null;
};

function toDTO(mr: MRRow) {
  return {
    id: mr.id,
    companyId: mr.companyId,
    projectId: mr.projectId ?? "",
    vendorId: mr.vendorId ?? "",
    purchaseOrderId: mr.purchaseOrderId ?? "",
    receiptNumber: mr.receiptNumber,
    receivedDate: mr.receivedDate.toISOString().slice(0, 10),
    challanNumber: mr.challanNumber ?? "",
    supplierInvoiceNumber: mr.supplierInvoiceNumber ?? "",
    vehicleNumber: mr.vehicleNumber ?? "",
    receivedBy: mr.receivedBy ?? "",
    supplierRepresentative: mr.supplierRepresentative ?? "",
    items: (mr.items as ReceiptItem[] | null) ?? [],
    itemName: mr.itemName,
    totalQty: mr.quantity.toString(),
    qualityStatus: mr.qualityStatus ?? "",
    status: mr.status,
    remarks: mr.remarks ?? "",
    notes: mr.notes ?? "",
    project: mr.project ?? null,
    vendor: mr.vendor ?? null,
    purchaseOrder: mr.purchaseOrder ?? null,
    createdAt: mr.createdAt.toISOString(),
    updatedAt: mr.updatedAt.toISOString(),
  };
}

export async function listMRs(companyId: string, query: MRListQuery) {
  const {
    search = "",
    status,
    projectId,
    vendorId,
    purchaseOrderId,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.MaterialReceiptWhereInput = {
    companyId,
    ...(status && { status: parseStatus(status) }),
    ...(projectId && { projectId }),
    ...(vendorId && { vendorId }),
    ...(purchaseOrderId && { purchaseOrderId }),
    ...(fromDate || toDate
      ? { receivedDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { receiptNumber: { contains: search, mode: "insensitive" } },
        { challanNumber: { contains: search, mode: "insensitive" } },
        { supplierInvoiceNumber: { contains: search, mode: "insensitive" } },
        { receivedBy: { contains: search, mode: "insensitive" } },
        { itemName: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowed = ["receiptNumber", "receivedDate", "status", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "createdAt";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, mrs] = await Promise.all([
    prisma.materialReceipt.count({ where }),
    prisma.materialReceipt.findMany({ where, include: mrInclude, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: mrs.map(toDTO) };
}

export async function getMRById(id: string, companyId: string) {
  const mr = await prisma.materialReceipt.findFirst({ where: { id, companyId }, include: mrInclude });
  if (!mr) throw new Error("Material Receipt not found");
  return toDTO(mr);
}

/** Returns issued/partial POs for the receipt form dropdown. */
export async function getReceivablePOs(companyId: string) {
  const pos = await prisma.purchaseOrder.findMany({
    where: {
      companyId,
      status: { in: ["ORDERED", "PARTIALLY_RECEIVED"] },
    },
    select: {
      id: true,
      poNumber: true,
      projectId: true,
      vendorId: true,
      items: true,
      materialReceipts: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return pos.map((po) => {
    // Calculate previously received quantities per item index
    const receivedByIndex: Record<number, number> = {};
    for (const receipt of po.materialReceipts) {
      const receiptItems = (receipt.items as ReceiptItem[] | null) ?? [];
      for (const ri of receiptItems) {
        receivedByIndex[ri.poItemIndex] = (receivedByIndex[ri.poItemIndex] ?? 0) + ri.receivingQty;
      }
    }

    return {
      id: po.id,
      poNumber: po.poNumber,
      projectId: po.projectId ?? "",
      vendorId: po.vendorId ?? "",
      items: po.items,
      receivedByIndex,
    };
  });
}

/**
 * Update Inventory for each accepted item on a receipt — finds/creates the matching
 * Inventory row (scoped by company + project + item name), increments stock, and
 * writes a RECEIPT stock ledger entry. Only called once, from createMR, so editing an
 * existing receipt never double-applies the stock movement.
 */
async function applyReceiptItemsToInventory(
  tx: Prisma.TransactionClient,
  companyId: string,
  projectId: string | null,
  vendorId: string | null,
  receiptItems: ReceiptItem[],
  receiptId: string,
  receiptNumber: string,
  receivedDate: Date
) {
  for (const ri of receiptItems) {
    if (ri.acceptedQty <= 0) continue;

    await applyReceiptToInventory(tx, companyId, {
      projectId,
      vendorId,
      itemCode: ri.itemCode || null,
      itemName: ri.itemName,
      unit: ri.unit || null,
      quantity: ri.acceptedQty,
      referenceId: receiptId,
      referenceNumber: receiptNumber,
      movementDate: receivedDate,
    });
  }
}

/** Recompute PO status from all receipts recorded against it (idempotent — safe to re-run on every save). */
async function syncPurchaseOrderStatus(
  tx: Prisma.TransactionClient,
  poId: string
) {
  // Calculate total received across ALL receipts for this PO
  const allReceipts = await tx.materialReceipt.findMany({
    where: { purchaseOrderId: poId },
    select: { items: true },
  });

  const totalByIndex: Record<number, number> = {};
  for (const r of allReceipts) {
    const items = (r.items as ReceiptItem[] | null) ?? [];
    for (const ri of items) {
      totalByIndex[ri.poItemIndex] = (totalByIndex[ri.poItemIndex] ?? 0) + ri.receivingQty;
    }
  }

  // Compare with PO ordered quantities
  const po = await tx.purchaseOrder.findUnique({ where: { id: poId }, select: { items: true } });
  if (!po) return;

  const poItems = (po.items as Array<{ quantity: number }> | null) ?? [];
  let allFullyReceived = poItems.length > 0;

  for (let i = 0; i < poItems.length; i++) {
    const ordered = poItems[i].quantity ?? 0;
    const received = totalByIndex[i] ?? 0;
    if (received < ordered) {
      allFullyReceived = false;
      break;
    }
  }

  const hasAnyReceived = Object.values(totalByIndex).some((qty) => qty > 0);
  const newStatus = allFullyReceived ? "RECEIVED" : hasAnyReceived ? "PARTIALLY_RECEIVED" : "ORDERED";

  await tx.purchaseOrder.update({
    where: { id: poId },
    data: { status: newStatus as Parameters<typeof tx.purchaseOrder.update>[0]["data"]["status"] },
  });
}

export async function createMR(companyId: string, input: MRFormInput) {
  if (!input.purchaseOrderId?.trim()) throw new Error("Purchase Order is required");
  if (!input.items?.length) throw new Error("At least one item is required");

  // Validate quantities
  for (const item of input.items) {
    const prevBalance = item.orderedQty - item.previouslyReceivedQty;
    if (item.receivingQty > prevBalance) {
      throw new Error(`Cannot receive more than remaining balance (${prevBalance}) for item: ${item.itemName}`);
    }
    if (item.acceptedQty + item.rejectedQty > item.receivingQty) {
      throw new Error(`Accepted + Rejected cannot exceed Receiving Quantity for item: ${item.itemName}`);
    }
  }

  const totalQty = input.items.reduce((s, i) => s + i.receivingQty, 0);
  const primaryItem = input.items[0];
  const receiptNumber = autoGRN();
  const receivedDate = input.receivedDate ? new Date(input.receivedDate) : new Date();

  return prisma.$transaction(async (tx) => {
    const mr = await tx.materialReceipt.create({
      data: {
        companyId,
        purchaseOrderId: input.purchaseOrderId,
        projectId: input.projectId || null,
        vendorId: input.vendorId || null,
        receiptNumber,
        receivedDate,
        challanNumber: input.challanNumber || null,
        supplierInvoiceNumber: input.supplierInvoiceNumber || null,
        vehicleNumber: input.vehicleNumber || null,
        receivedBy: input.receivedBy || null,
        supplierRepresentative: input.supplierRepresentative || null,
        items: input.items as unknown as Prisma.InputJsonValue,
        itemName: primaryItem.itemName,
        quantity: totalQty,
        unit: primaryItem.unit || null,
        qualityStatus: input.qualityStatus || null,
        status: parseStatus(input.status),
        remarks: input.remarks || null,
        notes: input.notes || null,
      },
      include: mrInclude,
    });

    // Stock update: applied exactly once, at creation time, so re-saving/editing a
    // receipt later never double-counts the same accepted quantity into Inventory.
    await applyReceiptItemsToInventory(
      tx,
      companyId,
      input.projectId ?? null,
      input.vendorId ?? null,
      input.items,
      mr.id,
      receiptNumber,
      receivedDate
    );

    await syncPurchaseOrderStatus(tx, input.purchaseOrderId);

    return toDTO(mr);
  });
}

export async function updateMR(id: string, companyId: string, input: MRFormInput) {
  await getMRById(id, companyId);

  const totalQty = input.items?.reduce((s, i) => s + i.receivingQty, 0) ?? 0;
  const primaryItem = input.items?.[0];

  return prisma.$transaction(async (tx) => {
    const mr = await tx.materialReceipt.update({
      where: { id },
      data: {
        receivedDate: input.receivedDate ? new Date(input.receivedDate) : undefined,
        challanNumber: input.challanNumber || null,
        supplierInvoiceNumber: input.supplierInvoiceNumber || null,
        vehicleNumber: input.vehicleNumber || null,
        receivedBy: input.receivedBy || null,
        supplierRepresentative: input.supplierRepresentative || null,
        items: (input.items ?? []) as unknown as Prisma.InputJsonValue,
        itemName: primaryItem?.itemName ?? "Multiple Items",
        quantity: totalQty,
        qualityStatus: input.qualityStatus || null,
        status: parseStatus(input.status),
        remarks: input.remarks || null,
        notes: input.notes || null,
      },
      include: mrInclude,
    });

    // Note: inventory stock is intentionally NOT re-applied here — it was already
    // credited once at creation time (see createMR). Editing a receipt only
    // re-syncs the PO's fulfillment status, which is safe to recompute idempotently.
    if (input.purchaseOrderId) {
      await syncPurchaseOrderStatus(tx, input.purchaseOrderId);
    }

    return toDTO(mr);
  });
}

export async function deleteMR(id: string, companyId: string) {
  await getMRById(id, companyId);
  return prisma.materialReceipt.delete({ where: { id } });
}
