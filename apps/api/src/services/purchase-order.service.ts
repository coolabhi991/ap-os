import prisma from "../config/prisma.js";
import { Prisma, ProcurementStatus } from "@prisma/client";

export interface POItem {
  itemCode: string;
  itemName: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  gstPercent: number;
  discountPercent: number;
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  amount: number;
}

export interface POFormInput {
  poNumber?: string;
  requisitionId: string;           // required — business rule
  projectId?: string;
  vendorId?: string;
  orderDate?: string;
  expectedDate?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  items?: POItem[];
  discount?: number;
  gstAmount?: number;
  amount?: number;
  status?: string;
  notes?: string;
}

export interface POListQuery {
  search?: string;
  status?: string;
  projectId?: string;
  vendorId?: string;
  requisitionId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** PO status labels (reusing ProcurementStatus enum values). */
export const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  ORDERED: "Issued",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Completed",
  CLOSED: "Cancelled",
  REJECTED: "Rejected",
};

function parseStatus(s: string | undefined): ProcurementStatus {
  const valid: Record<string, ProcurementStatus> = {
    DRAFT: "DRAFT",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    ORDERED: "ORDERED",
    PARTIALLY_RECEIVED: "PARTIALLY_RECEIVED",
    RECEIVED: "RECEIVED",
    CLOSED: "CLOSED",
    REJECTED: "REJECTED",
  };
  return valid[s ?? ""] ?? "DRAFT";
}

function autoNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PO-${y}${m}-${rand}`;
}

/** Compute totals from items. */
function computeTotals(items: POItem[]) {
  const discount = items.reduce((s, i) => s + (i.discountAmount || 0), 0);
  const gstAmount = items.reduce((s, i) => s + (i.gstAmount || 0), 0);
  const amount = items.reduce((s, i) => s + (i.amount || 0), 0);
  return { discount, gstAmount, amount };
}

type PORow = {
  id: string;
  companyId: string;
  projectId: string | null;
  vendorId: string | null;
  requisitionId: string | null;
  poNumber: string;
  orderDate: Date;
  expectedDate: Date | null;
  deliveryAddress: string | null;
  paymentTerms: string | null;
  items: Prisma.JsonValue;
  discount: Prisma.Decimal;
  gstAmount: Prisma.Decimal;
  amount: Prisma.Decimal;
  status: ProcurementStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: { id: string; name: string } | null;
  vendor?: { id: string; name: string } | null;
  requisition?: { id: string; requisitionNumber: string; title: string } | null;
};

function toDTO(po: PORow) {
  return {
    id: po.id,
    companyId: po.companyId,
    projectId: po.projectId ?? "",
    vendorId: po.vendorId ?? "",
    requisitionId: po.requisitionId ?? "",
    poNumber: po.poNumber,
    orderDate: po.orderDate.toISOString().slice(0, 10),
    expectedDate: po.expectedDate?.toISOString().slice(0, 10) ?? "",
    deliveryAddress: po.deliveryAddress ?? "",
    paymentTerms: po.paymentTerms ?? "",
    items: (po.items as POItem[] | null) ?? [],
    discount: po.discount.toString(),
    gstAmount: po.gstAmount.toString(),
    amount: po.amount.toString(),
    status: po.status,
    notes: po.notes ?? "",
    project: po.project ?? null,
    vendor: po.vendor ?? null,
    requisition: po.requisition ?? null,
    createdAt: po.createdAt.toISOString(),
    updatedAt: po.updatedAt.toISOString(),
  };
}

const include = {
  project: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  requisition: { select: { id: true, requisitionNumber: true, title: true } },
};

export async function listPOs(companyId: string, query: POListQuery) {
  const {
    search = "",
    status,
    projectId,
    vendorId,
    requisitionId,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.PurchaseOrderWhereInput = {
    companyId,
    ...(status && { status: parseStatus(status) }),
    ...(projectId && { projectId }),
    ...(vendorId && { vendorId }),
    ...(requisitionId && { requisitionId }),
    ...(fromDate || toDate
      ? { createdAt: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { poNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { deliveryAddress: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowed = ["poNumber", "orderDate", "expectedDate", "status", "amount", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "createdAt";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, pos] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: pos.map(toDTO) };
}

export async function getPOById(id: string, companyId: string) {
  const po = await prisma.purchaseOrder.findFirst({ where: { id, companyId }, include });
  if (!po) throw new Error("Purchase Order not found");
  return toDTO(po);
}

export async function createPO(companyId: string, input: POFormInput) {
  if (!input.requisitionId?.trim()) {
    throw new Error("A Purchase Requisition is required to create a Purchase Order");
  }

  // Verify the PR exists, belongs to this company, and is APPROVED
  const pr = await prisma.purchaseRequisition.findFirst({
    where: { id: input.requisitionId, companyId },
  });

  if (!pr) throw new Error("Purchase Requisition not found");
  if (pr.status !== "APPROVED") {
    throw new Error(`Purchase Requisition must be Approved before creating a PO (current status: ${pr.status})`);
  }

  const items = input.items ?? [];
  const { discount, gstAmount, amount } = computeTotals(items);

  const po = await prisma.$transaction(async (tx) => {
    const created = await tx.purchaseOrder.create({
      data: {
        companyId,
        requisitionId: input.requisitionId,
        projectId: input.projectId || pr.projectId || null,
        vendorId: input.vendorId || pr.vendorId || null,
        poNumber: input.poNumber?.trim() || autoNumber(),
        orderDate: input.orderDate ? new Date(input.orderDate) : new Date(),
        expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
        deliveryAddress: input.deliveryAddress || null,
        paymentTerms: input.paymentTerms || null,
        items: items as unknown as Prisma.InputJsonValue,
        discount: input.discount ?? discount,
        gstAmount: input.gstAmount ?? gstAmount,
        amount: input.amount ?? amount,
        status: parseStatus(input.status),
        notes: input.notes || null,
      },
      include,
    });

    // Business rule: update PR status to ORDERED after PO creation
    await tx.purchaseRequisition.update({
      where: { id: input.requisitionId },
      data: { status: "ORDERED" },
    });

    return created;
  });

  return toDTO(po);
}

export async function updatePO(id: string, companyId: string, input: POFormInput) {
  await getPOById(id, companyId); // verify ownership

  const items = input.items ?? [];
  const { discount, gstAmount, amount } = computeTotals(items);

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      projectId: input.projectId || null,
      vendorId: input.vendorId || null,
      orderDate: input.orderDate ? new Date(input.orderDate) : undefined,
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      deliveryAddress: input.deliveryAddress || null,
      paymentTerms: input.paymentTerms || null,
      items: items as unknown as Prisma.InputJsonValue,
      discount: input.discount ?? discount,
      gstAmount: input.gstAmount ?? gstAmount,
      amount: input.amount ?? amount,
      status: parseStatus(input.status),
      notes: input.notes || null,
    },
    include,
  });

  return toDTO(po);
}

export async function deletePO(id: string, companyId: string) {
  await getPOById(id, companyId); // verify ownership
  return prisma.purchaseOrder.delete({ where: { id } });
}

/** Fetch approved PRs for the PO creation form dropdown. */
export async function getApprovedPRs(companyId: string) {
  const prs = await prisma.purchaseRequisition.findMany({
    where: { companyId, status: "APPROVED" },
    select: {
      id: true,
      requisitionNumber: true,
      title: true,
      projectId: true,
      vendorId: true,
      items: true,
      totalAmount: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return prs.map((pr) => ({
    id: pr.id,
    requisitionNumber: pr.requisitionNumber,
    title: pr.title,
    projectId: pr.projectId ?? "",
    vendorId: pr.vendorId ?? "",
    items: pr.items,
    totalAmount: pr.totalAmount.toString(),
  }));
}
