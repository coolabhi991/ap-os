import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { applyIssueToInventory, getStockLedger } from "./inventory.service.js";

export interface MaterialIssueFormInput {
  projectId: string;
  inventoryId: string;
  quantity: number;
  issuedDate?: string;
  purpose?: string;
  issuedTo?: string;
  approvedBy?: string;
  remarks?: string;
  attachmentFileName?: string;
  attachmentFileUrl?: string;
}

/** Administrative fields only — quantity/project/material/date are immutable after creation (they drove the already-applied stock movement). */
export interface MaterialIssueUpdateInput {
  purpose?: string;
  issuedTo?: string;
  approvedBy?: string;
  remarks?: string;
  attachmentFileName?: string;
  attachmentFileUrl?: string;
}

export interface MaterialIssueListQuery {
  search?: string;
  projectId?: string;
  inventoryId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function autoNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `MI-${y}${m}-${rand}`;
}

const include = {
  project: { select: { id: true, name: true } },
  inventory: { select: { id: true, itemCode: true, itemName: true, unit: true, warehouse: true, currentStock: true, reservedStock: true } },
  createdBy: { select: { id: true, name: true } },
};

type MaterialIssueRow = Prisma.MaterialIssueGetPayload<{ include: typeof include }>;

function toDTO(m: MaterialIssueRow) {
  return {
    id: m.id,
    companyId: m.companyId,
    projectId: m.projectId,
    project: m.project,
    inventoryId: m.inventoryId,
    inventory: m.inventory
      ? {
          id: m.inventory.id,
          itemCode: m.inventory.itemCode,
          itemName: m.inventory.itemName,
          unit: m.inventory.unit,
          warehouse: m.inventory.warehouse,
          currentStock: m.inventory.currentStock.toString(),
          reservedStock: m.inventory.reservedStock.toString(),
          availableStock: m.inventory.currentStock.minus(m.inventory.reservedStock).toString(),
        }
      : null,
    issueNumber: m.issueNumber,
    issuedDate: m.issuedDate.toISOString().slice(0, 10),
    itemName: m.itemName,
    warehouse: m.warehouse ?? "",
    quantity: m.quantity.toString(),
    unit: m.unit ?? "",
    purpose: m.purpose ?? "",
    issuedTo: m.issuedTo ?? "",
    approvedBy: m.approvedBy ?? "",
    remarks: m.remarks ?? "",
    attachmentFileName: m.attachmentFileName ?? "",
    attachmentFileUrl: m.attachmentFileUrl ?? "",
    createdById: m.createdById,
    createdBy: m.createdBy,
    isDeleted: m.isDeleted,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

export async function listMaterialIssues(companyId: string, query: MaterialIssueListQuery) {
  const {
    search = "",
    projectId,
    inventoryId,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    sortBy = "issuedDate",
    sortOrder = "desc",
  } = query;

  const where: Prisma.MaterialIssueWhereInput = {
    companyId,
    isDeleted: false,
    ...(projectId && { projectId }),
    ...(inventoryId && { inventoryId }),
    ...(fromDate || toDate
      ? { issuedDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { issueNumber: { contains: search, mode: "insensitive" } },
        { itemName: { contains: search, mode: "insensitive" } },
        { issuedTo: { contains: search, mode: "insensitive" } },
        { purpose: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const allowed = ["issueNumber", "issuedDate", "quantity", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "issuedDate";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, issues] = await Promise.all([
    prisma.materialIssue.count({ where }),
    prisma.materialIssue.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: issues.map(toDTO) };
}

export async function getMaterialIssueById(id: string, companyId: string) {
  const issue = await prisma.materialIssue.findFirst({ where: { id, companyId, isDeleted: false }, include });
  if (!issue) throw new Error("Material issue not found");
  return toDTO(issue);
}

export async function createMaterialIssue(companyId: string, createdById: string, input: MaterialIssueFormInput) {
  if (!input.projectId?.trim()) throw new Error("Project is required");
  const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
  if (!project) throw new Error("Project not found");

  if (!input.inventoryId?.trim()) throw new Error("Material is required");
  const inventory = await prisma.inventory.findFirst({ where: { id: input.inventoryId, companyId } });
  if (!inventory) throw new Error("Inventory item not found");

  if (!input.quantity || input.quantity <= 0) throw new Error("Issue quantity must be greater than zero");

  const issueNumber = autoNumber();
  const issuedDate = input.issuedDate ? new Date(input.issuedDate) : new Date();

  const issue = await prisma.$transaction(async (tx) => {
    const created = await tx.materialIssue.create({
      data: {
        companyId,
        projectId: input.projectId,
        inventoryId: input.inventoryId,
        issueNumber,
        issuedDate,
        itemName: inventory.itemName,
        warehouse: inventory.warehouse,
        quantity: input.quantity,
        unit: inventory.unit,
        purpose: input.purpose || null,
        issuedTo: input.issuedTo || null,
        approvedBy: input.approvedBy || null,
        remarks: input.remarks || null,
        attachmentFileName: input.attachmentFileName || null,
        attachmentFileUrl: input.attachmentFileUrl || null,
        createdById,
      },
      include,
    });

    // Validates available stock, decrements Inventory, and writes an ISSUE ledger entry.
    // Rolls back the whole transaction (including this row) if stock is insufficient.
    await applyIssueToInventory(tx, companyId, {
      inventoryId: input.inventoryId,
      quantity: input.quantity,
      referenceId: created.id,
      referenceNumber: issueNumber,
      movementDate: issuedDate,
    });

    return created;
  });

  return toDTO(issue);
}

export async function updateMaterialIssue(id: string, companyId: string, input: MaterialIssueUpdateInput) {
  const existing = await prisma.materialIssue.findFirst({ where: { id, companyId, isDeleted: false } });
  if (!existing) throw new Error("Material issue not found");

  const issue = await prisma.materialIssue.update({
    where: { id },
    data: {
      purpose: input.purpose || null,
      issuedTo: input.issuedTo || null,
      approvedBy: input.approvedBy || null,
      remarks: input.remarks || null,
      attachmentFileName: input.attachmentFileName || null,
      attachmentFileUrl: input.attachmentFileUrl || null,
    },
    include,
  });

  return toDTO(issue);
}

/**
 * Soft delete only. Per business rule, deleting an issue must NOT restore stock —
 * the materials already physically left the store, so reversing the ledger here
 * would let a real issue be silently hidden instead of corrected via an adjustment.
 */
export async function deleteMaterialIssue(id: string, companyId: string) {
  const existing = await prisma.materialIssue.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Material issue not found");
  if (existing.isDeleted) throw new Error("Material issue already deleted");

  await prisma.materialIssue.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
}

export async function getMaterialIssueDashboard(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const baseWhere: Prisma.MaterialIssueWhereInput = { companyId, isDeleted: false };

  const [todayAgg, monthAgg, byProjectRaw, byMaterialRaw, recentIssues] = await Promise.all([
    prisma.materialIssue.aggregate({ where: { ...baseWhere, issuedDate: { gte: startOfDay } }, _sum: { quantity: true }, _count: { _all: true } }),
    prisma.materialIssue.aggregate({ where: { ...baseWhere, issuedDate: { gte: startOfMonth } }, _sum: { quantity: true }, _count: { _all: true } }),
    prisma.materialIssue.groupBy({ by: ["projectId"], where: baseWhere, _sum: { quantity: true }, _count: { _all: true }, orderBy: { _sum: { quantity: "desc" } }, take: 10 }),
    prisma.materialIssue.groupBy({ by: ["inventoryId"], where: baseWhere, _sum: { quantity: true }, _count: { _all: true }, orderBy: { _sum: { quantity: "desc" } }, take: 10 }),
    prisma.materialIssue.findMany({ where: baseWhere, include, orderBy: { issuedDate: "desc" }, take: 10 }),
  ]);

  const projects = await prisma.project.findMany({ where: { id: { in: byProjectRaw.map((p) => p.projectId) } }, select: { id: true, name: true } });
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  const inventories = await prisma.inventory.findMany({ where: { id: { in: byMaterialRaw.map((m) => m.inventoryId) } }, select: { id: true, itemName: true, unit: true } });
  const inventoryById = new Map(inventories.map((i) => [i.id, i]));

  return {
    today: { quantity: (todayAgg._sum.quantity ?? new Prisma.Decimal(0)).toString(), count: todayAgg._count._all },
    thisMonth: { quantity: (monthAgg._sum.quantity ?? new Prisma.Decimal(0)).toString(), count: monthAgg._count._all },
    byProject: byProjectRaw.map((p) => ({
      projectId: p.projectId,
      projectName: projectNameById.get(p.projectId) ?? "Unknown",
      quantity: (p._sum.quantity ?? new Prisma.Decimal(0)).toString(),
      count: p._count._all,
    })),
    byMaterial: byMaterialRaw.map((mIssue) => ({
      inventoryId: mIssue.inventoryId,
      itemName: inventoryById.get(mIssue.inventoryId)?.itemName ?? "Unknown",
      unit: inventoryById.get(mIssue.inventoryId)?.unit ?? "",
      quantity: (mIssue._sum.quantity ?? new Prisma.Decimal(0)).toString(),
      count: mIssue._count._all,
    })),
    recentIssues: recentIssues.map(toDTO),
  };
}

interface ReportDateQuery {
  fromDate?: string;
  toDate?: string;
}

function dateRangeWhere(query: ReportDateQuery) {
  const { fromDate, toDate } = query;
  if (!fromDate && !toDate) return undefined;
  return { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) };
}

export async function getProjectConsumptionReport(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.MaterialIssueWhereInput = { companyId, isDeleted: false, ...(dateRange && { issuedDate: dateRange }) };

  const rows = await prisma.materialIssue.groupBy({
    by: ["projectId"],
    where,
    _sum: { quantity: true },
    _count: { _all: true },
    orderBy: { _sum: { quantity: "desc" } },
  });

  const projects = await prisma.project.findMany({ where: { id: { in: rows.map((r) => r.projectId) } }, select: { id: true, name: true } });
  const nameById = new Map(projects.map((p) => [p.id, p.name]));

  return rows.map((r) => ({
    projectId: r.projectId,
    projectName: nameById.get(r.projectId) ?? "Unknown",
    totalQuantity: (r._sum.quantity ?? new Prisma.Decimal(0)).toString(),
    count: r._count._all,
  }));
}

export async function getMaterialConsumptionReport(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.MaterialIssueWhereInput = { companyId, isDeleted: false, ...(dateRange && { issuedDate: dateRange }) };

  const rows = await prisma.materialIssue.groupBy({
    by: ["inventoryId"],
    where,
    _sum: { quantity: true },
    _count: { _all: true },
    orderBy: { _sum: { quantity: "desc" } },
  });

  const inventories = await prisma.inventory.findMany({ where: { id: { in: rows.map((r) => r.inventoryId) } }, select: { id: true, itemName: true, unit: true } });
  const invById = new Map(inventories.map((i) => [i.id, i]));

  return rows.map((r) => ({
    inventoryId: r.inventoryId,
    itemName: invById.get(r.inventoryId)?.itemName ?? "Unknown",
    unit: invById.get(r.inventoryId)?.unit ?? "",
    totalQuantity: (r._sum.quantity ?? new Prisma.Decimal(0)).toString(),
    count: r._count._all,
  }));
}

export async function getMonthlyConsumptionReport(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.MaterialIssueWhereInput = { companyId, isDeleted: false, ...(dateRange && { issuedDate: dateRange }) };

  const issues = await prisma.materialIssue.findMany({ where, select: { issuedDate: true, quantity: true } });

  const buckets = new Map<string, { quantity: number; count: number }>();
  for (const i of issues) {
    const key = i.issuedDate.toISOString().slice(0, 7);
    const bucket = buckets.get(key) ?? { quantity: 0, count: 0 };
    bucket.quantity += Number(i.quantity);
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, totalQuantity: v.quantity.toString(), count: v.count }));
}

/** Reuses Inventory's stock ledger query, scoped to ISSUE movements by default. */
export async function getStockMovementReport(
  companyId: string,
  query: { inventoryId?: string; movementType?: string; fromDate?: string; toDate?: string; page?: number; limit?: number }
) {
  return getStockLedger(companyId, {
    inventoryId: query.inventoryId,
    movementType: query.movementType || "ISSUE",
    fromDate: query.fromDate,
    toDate: query.toDate,
    page: query.page,
    limit: query.limit,
  });
}

export async function exportMaterialIssuesToCSV(companyId: string, query: MaterialIssueListQuery) {
  const { data } = await listMaterialIssues(companyId, { ...query, page: 1, limit: 5000 });

  const headers = [
    "Issue Number",
    "Date",
    "Project",
    "Material",
    "Warehouse",
    "Quantity",
    "Unit",
    "Purpose",
    "Issued To",
    "Approved By",
    "Remarks",
    "Created By",
  ];

  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = data.map((e) =>
    [
      e.issueNumber,
      e.issuedDate,
      e.project?.name ?? "",
      e.itemName,
      e.warehouse,
      e.quantity,
      e.unit,
      e.purpose,
      e.issuedTo,
      e.approvedBy,
      e.remarks,
      e.createdBy?.name ?? "",
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
