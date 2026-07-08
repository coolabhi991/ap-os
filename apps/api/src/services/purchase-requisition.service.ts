import prisma from "../config/prisma.js";
import { Prisma, ProcurementStatus } from "@prisma/client";

export interface PRItem {
  description: string;
  quantity: number;
  unit: string;
  estimatedRate: number;
  amount: number;
}

export interface PRFormInput {
  requisitionNumber?: string;
  title: string;
  description?: string;
  projectId?: string;
  vendorId?: string;
  requiredDate?: string;
  status?: string;
  items?: PRItem[];
  totalAmount?: number;
  notes?: string;
}

export interface PRListQuery {
  search?: string;
  status?: string;
  projectId?: string;
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function parseStatus(s: string | undefined): ProcurementStatus {
  const valid: Record<string, ProcurementStatus> = {
    DRAFT: "DRAFT",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    ORDERED: "ORDERED",
    PARTIALLY_RECEIVED: "PARTIALLY_RECEIVED",
    RECEIVED: "RECEIVED",
    CLOSED: "CLOSED",
  };
  return valid[s ?? ""] ?? "DRAFT";
}

function autoNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PR-${y}${m}-${rand}`;
}

function toDTO(pr: {
  id: string;
  companyId: string;
  requisitionNumber: string;
  title: string;
  description: string | null;
  items: Prisma.JsonValue;
  requiredDate: Date | null;
  status: ProcurementStatus;
  totalAmount: Prisma.Decimal;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  vendorId: string | null;
  project?: { id: string; name: string } | null;
  vendor?: { id: string; name: string } | null;
}) {
  return {
    id: pr.id,
    companyId: pr.companyId,
    requisitionNumber: pr.requisitionNumber,
    title: pr.title,
    description: pr.description ?? "",
    items: (pr.items as PRItem[] | null) ?? [],
    requiredDate: pr.requiredDate?.toISOString().slice(0, 10) ?? "",
    status: pr.status,
    totalAmount: pr.totalAmount.toString(),
    notes: pr.notes ?? "",
    projectId: pr.projectId ?? "",
    vendorId: pr.vendorId ?? "",
    project: pr.project ?? null,
    vendor: pr.vendor ?? null,
    createdAt: pr.createdAt.toISOString(),
    updatedAt: pr.updatedAt.toISOString(),
  };
}

export async function listPRs(companyId: string, query: PRListQuery) {
  const {
    search = "",
    status,
    projectId,
    vendorId,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.PurchaseRequisitionWhereInput = {
    companyId,
    ...(status && { status: parseStatus(status) }),
    ...(projectId && { projectId }),
    ...(vendorId && { vendorId }),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(toDate) } : {}),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { requisitionNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowed = ["requisitionNumber", "title", "status", "requiredDate", "totalAmount", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "createdAt";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, prs] = await Promise.all([
    prisma.purchaseRequisition.count({ where }),
    prisma.purchaseRequisition.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { [orderByField]: sortOrder },
      skip,
      take,
    }),
  ]);

  return { total, page, limit: take, data: prs.map(toDTO) };
}

export async function getPRById(id: string, companyId: string) {
  const pr = await prisma.purchaseRequisition.findFirst({
    where: { id, companyId },
    include: {
      project: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
    },
  });

  if (!pr) throw new Error("Purchase Requisition not found");
  return toDTO(pr);
}

export async function createPR(companyId: string, input: PRFormInput) {
  if (!input.title?.trim()) throw new Error("Title is required");

  const totalAmount =
    input.items?.reduce((sum, i) => sum + (i.amount || 0), 0) ??
    input.totalAmount ??
    0;

  const pr = await prisma.purchaseRequisition.create({
    data: {
      companyId,
      requisitionNumber: input.requisitionNumber?.trim() || autoNumber(),
      title: input.title.trim(),
      description: input.description || null,
      items: (input.items ?? []) as unknown as Prisma.InputJsonValue,
      projectId: input.projectId || null,
      vendorId: input.vendorId || null,
      requiredDate: input.requiredDate ? new Date(input.requiredDate) : null,
      status: parseStatus(input.status),
      totalAmount,
      notes: input.notes || null,
    },
    include: {
      project: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
    },
  });

  return toDTO(pr);
}

export async function updatePR(
  id: string,
  companyId: string,
  input: PRFormInput
) {
  await getPRById(id, companyId);

  if (!input.title?.trim()) throw new Error("Title is required");

  const totalAmount =
    input.items?.reduce((sum, i) => sum + (i.amount || 0), 0) ??
    input.totalAmount ??
    0;

  const pr = await prisma.purchaseRequisition.update({
    where: { id },
    data: {
      title: input.title.trim(),
      description: input.description || null,
      items: (input.items ?? []) as unknown as Prisma.InputJsonValue,
      projectId: input.projectId || null,
      vendorId: input.vendorId || null,
      requiredDate: input.requiredDate ? new Date(input.requiredDate) : null,
      status: parseStatus(input.status),
      totalAmount,
      notes: input.notes || null,
    },
    include: {
      project: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
    },
  });

  return toDTO(pr);
}

export async function deletePR(id: string, companyId: string) {
  await getPRById(id, companyId);
  return prisma.purchaseRequisition.delete({ where: { id } });
}
