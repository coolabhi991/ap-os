import prisma from "../config/prisma.js";
import { Prisma, MeasurementBookStatus } from "@prisma/client";

export const MB_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED"];

export const MB_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
};

export interface MBItemInput {
  boqItemNo: string;
  boqDescription: string;
  unit: string;
  length?: number;
  breadth?: number;
  height?: number;
  boqRate: number;
  paymentPercent?: number;
  remarks?: string;
}

export interface MBFormInput {
  projectId: string;
  siteId: string;
  subWorkId?: string;
  mbNumber: string;
  mbDate?: string;
  site?: string;
  engineerId?: string;
  contractorId?: string;
  status?: string;
  remarks?: string;
  items?: MBItemInput[];
}

export interface MBListQuery {
  search?: string;
  projectId?: string;
  siteId?: string;
  subWorkId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface ReportDateQuery {
  projectId?: string;
  subWorkId?: string;
  fromDate?: string;
  toDate?: string;
}

function parseStatus(s: string | undefined): MeasurementBookStatus {
  return MB_STATUSES.includes(s ?? "") ? (s as MeasurementBookStatus) : "DRAFT";
}

/**
 * The one place quantity/effective rate/amount are ever computed. Never trust a client-sent
 * value for these three — always recompute server-side from the row's own measurement inputs.
 *   Length only              -> Quantity = Length
 *   Length + Breadth         -> Quantity = Length x Breadth
 *   Length + Breadth + Height -> Quantity = Length x Breadth x Height
 *   Effective Rate = BOQ Rate x Payment % / 100
 *   Amount = Quantity x Effective Rate
 */
function computeItemCalc(input: { length?: number; breadth?: number; height?: number; boqRate: number; paymentPercent: number }) {
  const { length, breadth, height, boqRate, paymentPercent } = input;

  let quantity = 0;
  if (length !== undefined && length !== null) {
    if (breadth !== undefined && breadth !== null && height !== undefined && height !== null) {
      quantity = length * breadth * height;
    } else if (breadth !== undefined && breadth !== null) {
      quantity = length * breadth;
    } else {
      quantity = length;
    }
  }

  const effectiveRate = Math.round(boqRate * (paymentPercent / 100) * 100) / 100;
  const amount = Math.round(quantity * effectiveRate * 100) / 100;

  return { quantity: Math.round(quantity * 10000) / 10000, effectiveRate, amount };
}

function validateItemInput(item: MBItemInput) {
  if (!item.boqItemNo?.trim()) throw new Error("BOQ Item No. is required for every abstract row");
  if (!item.boqDescription?.trim()) throw new Error("BOQ Description is required for every abstract row");
  if (!item.unit?.trim()) throw new Error("Unit is required for every abstract row");
  if (!Number.isFinite(item.boqRate) || item.boqRate < 0) throw new Error(`BOQ Rate must be a number greater than or equal to zero (item ${item.boqItemNo})`);

  const paymentPercent = item.paymentPercent ?? 100;
  if (!Number.isFinite(paymentPercent) || paymentPercent < 0) throw new Error(`Payment % must be a number greater than or equal to zero (item ${item.boqItemNo})`);

  for (const [label, v] of [["Length", item.length], ["Breadth", item.breadth], ["Height", item.height]] as const) {
    if (v !== undefined && v !== null && (!Number.isFinite(v) || v < 0)) {
      throw new Error(`${label} must be a number greater than or equal to zero (item ${item.boqItemNo})`);
    }
  }

  return { ...item, paymentPercent };
}

const include = {
  project: { select: { id: true, name: true, location: true } },
  subWork: { select: { id: true, name: true } },
  engineer: { select: { id: true, name: true, email: true } },
  contractor: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  items: { orderBy: { sortOrder: "asc" as const } },
};

type MBRow = Prisma.MeasurementBookGetPayload<{ include: typeof include }>;

function itemToDTO(item: MBRow["items"][number]) {
  return {
    id: item.id,
    sortOrder: item.sortOrder,
    boqItemNo: item.boqItemNo,
    boqDescription: item.boqDescription,
    unit: item.unit,
    length: item.length?.toString() ?? "",
    breadth: item.breadth?.toString() ?? "",
    height: item.height?.toString() ?? "",
    quantity: item.quantity.toString(),
    boqRate: item.boqRate.toString(),
    paymentPercent: item.paymentPercent.toString(),
    effectiveRate: item.effectiveRate.toString(),
    amount: item.amount.toString(),
    remarks: item.remarks ?? "",
  };
}

function toDTO(mb: MBRow) {
  const totalQuantity = mb.items.reduce((sum, i) => sum + Number(i.quantity), 0);
  const totalAmount = mb.items.reduce((sum, i) => sum + Number(i.amount), 0);

  return {
    id: mb.id,
    companyId: mb.companyId,
    projectId: mb.projectId,
    project: mb.project,
    siteId: mb.siteId,
    subWorkId: mb.subWorkId ?? "",
    subWork: mb.subWork,
    mbNumber: mb.mbNumber,
    mbDate: mb.mbDate.toISOString().slice(0, 10),
    site: mb.site ?? mb.project.location ?? "",
    engineerId: mb.engineerId ?? "",
    engineer: mb.engineer,
    contractorId: mb.contractorId ?? "",
    contractor: mb.contractor,
    status: mb.status,
    remarks: mb.remarks ?? "",
    items: mb.items.map(itemToDTO),
    totalQuantity: totalQuantity.toFixed(4),
    totalAmount: totalAmount.toFixed(2),
    createdById: mb.createdById,
    createdBy: mb.createdBy,
    createdAt: mb.createdAt.toISOString(),
    updatedAt: mb.updatedAt.toISOString(),
  };
}

async function validateReferences(
  companyId: string,
  input: { projectId: string; siteId: string; subWorkId?: string; engineerId?: string; contractorId?: string }
) {
  const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
  if (!project) throw new Error("Project not found");

  const site = await prisma.site.findFirst({ where: { id: input.siteId, companyId, projectId: input.projectId } });
  if (!site) throw new Error("Site not found");

  if (input.subWorkId) {
    const subWork = await prisma.subWork.findFirst({ where: { id: input.subWorkId, companyId, projectId: input.projectId } });
    if (!subWork) throw new Error("Sub Work not found");
  }
  if (input.engineerId) {
    const engineer = await prisma.user.findFirst({ where: { id: input.engineerId, companyId } });
    if (!engineer) throw new Error("Engineer not found");
  }
  if (input.contractorId) {
    const contractor = await prisma.vendor.findFirst({ where: { id: input.contractorId, companyId } });
    if (!contractor) throw new Error("Contractor not found");
  }
}

export async function listMBs(companyId: string, query: MBListQuery) {
  const { search = "", projectId, siteId, subWorkId, status, fromDate, toDate, page = 1, limit = 20, sortBy = "mbDate", sortOrder = "desc" } = query;

  const where: Prisma.MeasurementBookWhereInput = {
    companyId,
    ...(projectId && { projectId }),
    ...(siteId && { siteId }),
    ...(subWorkId && { subWorkId }),
    ...(status && MB_STATUSES.includes(status.toUpperCase()) && { status: status.toUpperCase() as MeasurementBookStatus }),
    ...(fromDate || toDate ? { mbDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } } : {}),
    ...(search && {
      OR: [
        { mbNumber: { contains: search, mode: "insensitive" } },
        { remarks: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const allowed = ["mbDate", "mbNumber", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "mbDate";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, mbs] = await Promise.all([
    prisma.measurementBook.count({ where }),
    prisma.measurementBook.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: mbs.map(toDTO) };
}

export async function getMBById(id: string, companyId: string) {
  const mb = await prisma.measurementBook.findFirst({ where: { id, companyId }, include });
  if (!mb) throw new Error("Measurement Book not found");
  return toDTO(mb);
}

export async function createMB(companyId: string, createdById: string, input: MBFormInput) {
  if (!input.projectId?.trim()) throw new Error("Project is required");
  if (!input.siteId?.trim()) throw new Error("Site is required");
  if (!input.mbNumber?.trim()) throw new Error("MB Number is required");
  await validateReferences(companyId, input);

  const existingNumber = await prisma.measurementBook.findFirst({ where: { companyId, mbNumber: input.mbNumber.trim() } });
  if (existingNumber) throw new Error(`MB Number "${input.mbNumber}" already exists`);

  const items = (input.items ?? []).map(validateItemInput);

  const mb = await prisma.$transaction(async (tx) => {
    const created = await tx.measurementBook.create({
      data: {
        companyId,
        projectId: input.projectId,
        siteId: input.siteId,
        subWorkId: input.subWorkId || null,
        mbNumber: input.mbNumber.trim(),
        mbDate: input.mbDate ? new Date(input.mbDate) : new Date(),
        site: input.site || null,
        engineerId: input.engineerId || null,
        contractorId: input.contractorId || null,
        status: parseStatus(input.status),
        remarks: input.remarks || null,
        createdById,
      },
    });

    if (items.length) {
      await tx.measurementBookItem.createMany({
        data: items.map((item, index) => {
          const calc = computeItemCalc(item);
          return {
            companyId,
            measurementBookId: created.id,
            sortOrder: index,
            boqItemNo: item.boqItemNo.trim(),
            boqDescription: item.boqDescription.trim(),
            unit: item.unit.trim(),
            length: item.length ?? null,
            breadth: item.breadth ?? null,
            height: item.height ?? null,
            quantity: calc.quantity,
            boqRate: item.boqRate,
            paymentPercent: item.paymentPercent,
            effectiveRate: calc.effectiveRate,
            amount: calc.amount,
            remarks: item.remarks || null,
          };
        }),
      });
    }

    return tx.measurementBook.findFirstOrThrow({ where: { id: created.id }, include });
  });

  return toDTO(mb);
}

export async function updateMB(id: string, companyId: string, input: Partial<MBFormInput>) {
  const existing = await prisma.measurementBook.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Measurement Book not found");
  if (existing.status === "APPROVED") throw new Error("Cannot edit an Approved Measurement Book");

  const effectiveProjectId = input.projectId || existing.projectId;
  const effectiveSiteId = input.siteId || existing.siteId;
  await validateReferences(companyId, {
    projectId: effectiveProjectId,
    siteId: effectiveSiteId,
    subWorkId: input.subWorkId !== undefined ? input.subWorkId || undefined : existing.subWorkId ?? undefined,
    engineerId: input.engineerId !== undefined ? input.engineerId || undefined : existing.engineerId ?? undefined,
    contractorId: input.contractorId !== undefined ? input.contractorId || undefined : existing.contractorId ?? undefined,
  });

  if (input.mbNumber && input.mbNumber.trim() !== existing.mbNumber) {
    const clash = await prisma.measurementBook.findFirst({ where: { companyId, mbNumber: input.mbNumber.trim(), id: { not: id } } });
    if (clash) throw new Error(`MB Number "${input.mbNumber}" already exists`);
  }

  const items = input.items !== undefined ? input.items.map(validateItemInput) : undefined;

  const mb = await prisma.$transaction(async (tx) => {
    const updated = await tx.measurementBook.update({
      where: { id },
      data: {
        projectId: input.projectId || existing.projectId,
        siteId: input.siteId || existing.siteId,
        subWorkId: input.subWorkId !== undefined ? input.subWorkId || null : existing.subWorkId,
        mbNumber: input.mbNumber?.trim() || existing.mbNumber,
        mbDate: input.mbDate ? new Date(input.mbDate) : existing.mbDate,
        site: input.site !== undefined ? input.site || null : existing.site,
        engineerId: input.engineerId !== undefined ? input.engineerId || null : existing.engineerId,
        contractorId: input.contractorId !== undefined ? input.contractorId || null : existing.contractorId,
        status: input.status !== undefined ? parseStatus(input.status) : existing.status,
        remarks: input.remarks !== undefined ? input.remarks || null : existing.remarks,
      },
    });

    if (items !== undefined) {
      await tx.measurementBookItem.deleteMany({ where: { measurementBookId: id } });
      if (items.length) {
        await tx.measurementBookItem.createMany({
          data: items.map((item, index) => {
            const calc = computeItemCalc(item);
            return {
              companyId,
              measurementBookId: id,
              sortOrder: index,
              boqItemNo: item.boqItemNo.trim(),
              boqDescription: item.boqDescription.trim(),
              unit: item.unit.trim(),
              length: item.length ?? null,
              breadth: item.breadth ?? null,
              height: item.height ?? null,
              quantity: calc.quantity,
              boqRate: item.boqRate,
              paymentPercent: item.paymentPercent,
              effectiveRate: calc.effectiveRate,
              amount: calc.amount,
              remarks: item.remarks || null,
            };
          }),
        });
      }
    }

    return tx.measurementBook.findFirstOrThrow({ where: { id: updated.id }, include });
  });

  return toDTO(mb);
}

/** Hard delete only allowed pre-Approval — an Approved MB is the official record and is never removable. */
export async function deleteMB(id: string, companyId: string) {
  const existing = await prisma.measurementBook.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Measurement Book not found");
  if (existing.status === "APPROVED") throw new Error("Cannot delete an Approved Measurement Book");

  await prisma.measurementBook.delete({ where: { id } });
}

function dateRangeWhere(query: ReportDateQuery) {
  const { fromDate, toDate } = query;
  if (!fromDate && !toDate) return undefined;
  return { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) };
}

/** Report: MB Register — one row per Measurement Book with computed totals. */
export async function getMBRegisterReport(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.MeasurementBookWhereInput = {
    companyId,
    ...(query.projectId && { projectId: query.projectId }),
    ...(query.subWorkId && { subWorkId: query.subWorkId }),
    ...(dateRange && { mbDate: dateRange }),
  };

  const mbs = await prisma.measurementBook.findMany({ where, include, orderBy: { mbDate: "desc" } });
  return mbs.map((mb) => {
    const dto = toDTO(mb);
    return {
      id: dto.id,
      mbNumber: dto.mbNumber,
      mbDate: dto.mbDate,
      project: dto.project,
      subWork: dto.subWork,
      engineer: dto.engineer,
      contractor: dto.contractor,
      status: dto.status,
      totalQuantity: dto.totalQuantity,
      totalAmount: dto.totalAmount,
      itemCount: dto.items.length,
    };
  });
}

/** Report: Abstract Register — every BOQ row across the matching Measurement Books, flattened. */
export async function getAbstractRegisterReport(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.MeasurementBookWhereInput = {
    companyId,
    ...(query.projectId && { projectId: query.projectId }),
    ...(query.subWorkId && { subWorkId: query.subWorkId }),
    ...(dateRange && { mbDate: dateRange }),
  };

  const mbs = await prisma.measurementBook.findMany({ where, include, orderBy: { mbDate: "desc" } });

  return mbs.flatMap((mb) =>
    mb.items.map((item) => ({
      mbId: mb.id,
      mbNumber: mb.mbNumber,
      mbDate: mb.mbDate.toISOString().slice(0, 10),
      project: mb.project.name,
      subWork: mb.subWork?.name ?? "",
      status: mb.status,
      ...itemToDTO(item),
    }))
  );
}

/** Report: Item-wise Quantity — BOQ item totals across all matching Measurement Books. */
export async function getItemWiseQuantityReport(companyId: string, query: ReportDateQuery) {
  const rows = await getAbstractRegisterReport(companyId, query);
  const map = new Map<string, { boqItemNo: string; boqDescription: string; unit: string; totalQuantity: number; totalAmount: number; count: number }>();

  for (const r of rows) {
    const key = `${r.boqItemNo}::${r.unit}`;
    const bucket = map.get(key) ?? { boqItemNo: r.boqItemNo, boqDescription: r.boqDescription, unit: r.unit, totalQuantity: 0, totalAmount: 0, count: 0 };
    bucket.totalQuantity += Number(r.quantity);
    bucket.totalAmount += Number(r.amount);
    bucket.count += 1;
    map.set(key, bucket);
  }

  return Array.from(map.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map((b) => ({ ...b, totalQuantity: b.totalQuantity.toFixed(4), totalAmount: b.totalAmount.toFixed(2) }));
}

/** Report: Sub Work Quantity — total quantity/amount grouped by Sub Work. */
export async function getSubWorkQuantityReport(companyId: string, query: ReportDateQuery) {
  const rows = await getAbstractRegisterReport(companyId, query);
  const map = new Map<string, { subWork: string; totalQuantity: number; totalAmount: number; count: number }>();

  for (const r of rows) {
    const key = r.subWork || "Unassigned";
    const bucket = map.get(key) ?? { subWork: key, totalQuantity: 0, totalAmount: 0, count: 0 };
    bucket.totalQuantity += Number(r.quantity);
    bucket.totalAmount += Number(r.amount);
    bucket.count += 1;
    map.set(key, bucket);
  }

  return Array.from(map.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map((b) => ({ ...b, totalQuantity: b.totalQuantity.toFixed(4), totalAmount: b.totalAmount.toFixed(2) }));
}

/** Report: Pending MB — Measurement Books not yet Approved. */
export async function getPendingMBReport(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.MeasurementBookWhereInput = {
    companyId,
    status: { in: ["DRAFT", "SUBMITTED"] },
    ...(query.projectId && { projectId: query.projectId }),
    ...(query.subWorkId && { subWorkId: query.subWorkId }),
    ...(dateRange && { mbDate: dateRange }),
  };

  const mbs = await prisma.measurementBook.findMany({ where, include, orderBy: { mbDate: "asc" } });
  return mbs.map((mb) => {
    const dto = toDTO(mb);
    return {
      id: dto.id,
      mbNumber: dto.mbNumber,
      mbDate: dto.mbDate,
      project: dto.project,
      subWork: dto.subWork,
      engineer: dto.engineer,
      status: dto.status,
      totalAmount: dto.totalAmount,
      daysPending: Math.floor((Date.now() - mb.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    };
  });
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** CSV Export — the Abstract Register (the most detailed, line-item view). */
export async function exportAbstractRegisterToCSV(companyId: string, query: ReportDateQuery) {
  const rows = await getAbstractRegisterReport(companyId, query);

  const headers = [
    "MB Number", "MB Date", "Project", "Sub Work", "Status",
    "BOQ Item No.", "BOQ Description", "Unit",
    "Length", "Breadth", "Height", "Quantity",
    "BOQ Rate", "Payment %", "Effective Rate", "Amount",
  ];

  const csvRows = rows.map((r) =>
    [
      r.mbNumber, r.mbDate, r.project, r.subWork, r.status,
      r.boqItemNo, r.boqDescription, r.unit,
      r.length, r.breadth, r.height, r.quantity,
      r.boqRate, r.paymentPercent, r.effectiveRate, r.amount,
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
}
