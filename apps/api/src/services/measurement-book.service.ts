import prisma from "../config/prisma.js";
import { Prisma, MeasurementBookStatus } from "@prisma/client";
import { createRunningBillFromApprovedMB } from "./running-bill.service.js";

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
  subWorkId?: string;
  length?: number;
  breadth?: number;
  height?: number;
  // Direct quantity entry for the Recapitulation-sourced Abstract MB flow (no L/B/H dimensions
  // involved) — only used when none of length/breadth/height are supplied; otherwise the
  // dimensional calc below still wins, exactly as before.
  currentQuantity?: number;
  boqRate: number;
  paymentPercent?: number;
  // Auto Carry Forward: normally left undefined so computePreviousQuantityForItem resolves it.
  // Only set this to explicitly override the auto value (Government-revised certified qty) —
  // doing so requires fieldChangeReason.
  previousQuantity?: number;
  fieldChangeReason?: string;
  remarks?: string;
}

export interface MBFormInput {
  projectId: string;
  siteId: string;
  subWorkId?: string;
  mbNumber: string;
  raBillNumber?: string;
  mbDate?: string;
  site?: string;
  engineerId?: string;
  contractorId?: string;
  status?: string;
  remarks?: string;
  abstractPdfUrl?: string;
  abstractPdfName?: string;
  sourceRecapRevisionId?: string;
  // Form 58 footer config — see toDTO's footer computation for how these feed Net Value/Grand Total.
  aboveBelowPercent?: number;
  gstPercent?: number;
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
function computeItemCalc(input: {
  length?: number;
  breadth?: number;
  height?: number;
  boqRate: number;
  paymentPercent: number;
  currentQuantity?: number;
}) {
  const { length, breadth, height, boqRate, paymentPercent, currentQuantity } = input;

  let quantity = 0;
  if (length !== undefined && length !== null) {
    if (breadth !== undefined && breadth !== null && height !== undefined && height !== null) {
      quantity = length * breadth * height;
    } else if (breadth !== undefined && breadth !== null) {
      quantity = length * breadth;
    } else {
      quantity = length;
    }
  } else if (currentQuantity !== undefined && currentQuantity !== null) {
    quantity = currentQuantity;
  }

  const effectiveRate = Math.round(boqRate * (paymentPercent / 100) * 100) / 100;
  const amount = Math.round(quantity * effectiveRate * 100) / 100;

  return { quantity: Math.round(quantity * 10000) / 10000, effectiveRate, amount };
}

/**
 * Auto Carry Forward — the Previous Qty for a new Abstract MB row is always the immediately
 * preceding MB's Total Qty for the same Sub Work (0 for the very first MB of that Sub Work),
 * never re-summed across the whole history (Total Qty already IS the cumulative figure once
 * carried forward once). Scoped to the Site, keyed by subWorkId; rows without a subWorkId
 * (old-style manual BOQ entry) simply get previousQuantity 0, unchanged from before this existed.
 */
async function computePreviousQuantityForItem(companyId: string, siteId: string, subWorkId: string, excludeMbId?: string): Promise<number> {
  const priorItem = await prisma.measurementBookItem.findFirst({
    where: {
      companyId,
      subWorkId,
      measurementBook: { companyId, siteId, ...(excludeMbId ? { id: { not: excludeMbId } } : {}) },
    },
    orderBy: [{ measurementBook: { mbDate: "desc" } }, { createdAt: "desc" }],
  });
  return priorItem ? Number(priorItem.totalQuantity) : 0;
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

interface ResolvedItemRow {
  data: {
    companyId: string;
    measurementBookId: string;
    subWorkId: string | null;
    sortOrder: number;
    boqItemNo: string;
    boqDescription: string;
    unit: string;
    length: number | null;
    breadth: number | null;
    height: number | null;
    quantity: number;
    boqRate: number;
    paymentPercent: number;
    effectiveRate: number;
    amount: number;
    previousQuantity: number;
    totalQuantity: number;
    previousAmount: number;
    totalAmount: number;
    remarks: string | null;
  };
  audits: Array<{ fieldName: string; oldValue: string; newValue: string; reason: string }>;
}

/**
 * Resolves one Abstract MB row: runs the existing L/B/H (or direct-quantity) calc, then applies
 * Auto Carry Forward for Previous Qty, then diffs Previous Qty and Rate against their "expected"
 * value (the auto carry-forward figure, or — on update — whatever is currently persisted for
 * this boqItemNo) and requires `fieldChangeReason` whenever a Government revision changes either
 * figure (section 4/5's mandatory warning + audit trail).
 */
async function resolveItemRow(
  companyId: string,
  siteId: string,
  measurementBookId: string,
  item: ReturnType<typeof validateItemInput>,
  index: number,
  expected: { previousQuantity?: number; boqRate?: number } | undefined,
  excludeMbId?: string
): Promise<ResolvedItemRow> {
  const calc = computeItemCalc(item);

  const autoPrevious = item.subWorkId ? await computePreviousQuantityForItem(companyId, siteId, item.subWorkId, excludeMbId) : 0;
  const expectedPrevious = expected?.previousQuantity ?? autoPrevious;
  const resolvedPrevious = item.previousQuantity !== undefined && item.previousQuantity !== null ? item.previousQuantity : autoPrevious;

  const audits: ResolvedItemRow["audits"] = [];

  if (Math.abs(resolvedPrevious - expectedPrevious) > 0.0001) {
    if (!item.fieldChangeReason?.trim()) {
      throw new Error(`Previous Qty for item ${item.boqItemNo} was changed from the auto-carried-forward value — a reason is required`);
    }
    audits.push({ fieldName: "previousQuantity", oldValue: String(expectedPrevious), newValue: String(resolvedPrevious), reason: item.fieldChangeReason.trim() });
  }

  if (expected?.boqRate !== undefined && Math.abs(item.boqRate - expected.boqRate) > 0.0001) {
    if (!item.fieldChangeReason?.trim()) {
      throw new Error(`Rate for item ${item.boqItemNo} was changed — a reason is required`);
    }
    audits.push({ fieldName: "boqRate", oldValue: String(expected.boqRate), newValue: String(item.boqRate), reason: item.fieldChangeReason.trim() });
  }

  const totalQuantity = Math.round((resolvedPrevious + calc.quantity) * 10000) / 10000;
  const previousAmount = Math.round(resolvedPrevious * calc.effectiveRate * 100) / 100;
  const totalAmount = Math.round(totalQuantity * calc.effectiveRate * 100) / 100;

  return {
    data: {
      companyId,
      measurementBookId,
      subWorkId: item.subWorkId || null,
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
      previousQuantity: resolvedPrevious,
      totalQuantity,
      previousAmount,
      totalAmount,
      remarks: item.remarks || null,
    },
    audits,
  };
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
    subWorkId: item.subWorkId ?? "",
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
    previousQuantity: item.previousQuantity.toString(),
    totalQuantity: item.totalQuantity.toString(),
    previousAmount: item.previousAmount.toString(),
    totalAmount: item.totalAmount.toString(),
    remarks: item.remarks ?? "",
  };
}

/**
 * Form 58 footer — computed live from item totals + the two stored config percentages, never
 * persisted itself: Total Amount (sum of "Now to Pay") -> Above/Below adjustment -> Net Value
 * (pre-GST) -> GST -> Grand Total.
 */
function computeForm58Footer(mb: { items: { amount: Prisma.Decimal | number; totalAmount: Prisma.Decimal | number; previousAmount: Prisma.Decimal | number }[]; aboveBelowPercent: Prisma.Decimal | number; gstPercent: Prisma.Decimal | number }) {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const totalUpToDate = round2(mb.items.reduce((sum, i) => sum + Number(i.totalAmount), 0));
  const totalSincePrevious = round2(mb.items.reduce((sum, i) => sum + Number(i.previousAmount), 0));
  const totalNowToPay = round2(mb.items.reduce((sum, i) => sum + Number(i.amount), 0));

  const aboveBelowPercent = Number(mb.aboveBelowPercent);
  const aboveBelowAmount = round2(totalNowToPay * (aboveBelowPercent / 100));
  const netValue = round2(totalNowToPay + aboveBelowAmount);

  const gstPercent = Number(mb.gstPercent);
  const gstAmount = round2(netValue * (gstPercent / 100));
  const grandTotal = round2(netValue + gstAmount);

  return { totalUpToDate, totalSincePrevious, totalNowToPay, aboveBelowPercent, aboveBelowAmount, netValue, gstPercent, gstAmount, grandTotal };
}

function toDTO(mb: MBRow) {
  const totalQuantity = mb.items.reduce((sum, i) => sum + Number(i.quantity), 0);
  const totalAmount = mb.items.reduce((sum, i) => sum + Number(i.amount), 0);
  const footer = computeForm58Footer(mb);

  return {
    id: mb.id,
    companyId: mb.companyId,
    projectId: mb.projectId,
    project: mb.project,
    siteId: mb.siteId,
    subWorkId: mb.subWorkId ?? "",
    subWork: mb.subWork,
    mbNumber: mb.mbNumber,
    raBillNumber: mb.raBillNumber ?? "",
    mbDate: mb.mbDate.toISOString().slice(0, 10),
    site: mb.site ?? mb.project.location ?? "",
    engineerId: mb.engineerId ?? "",
    engineer: mb.engineer,
    contractorId: mb.contractorId ?? "",
    contractor: mb.contractor,
    status: mb.status,
    remarks: mb.remarks ?? "",
    abstractPdfUrl: mb.abstractPdfUrl ?? "",
    abstractPdfName: mb.abstractPdfName ?? "",
    sourceRecapRevisionId: mb.sourceRecapRevisionId ?? "",
    items: mb.items.map(itemToDTO),
    totalQuantity: totalQuantity.toFixed(4),
    totalAmount: totalAmount.toFixed(2),
    aboveBelowPercent: footer.aboveBelowPercent.toString(),
    gstPercent: footer.gstPercent.toString(),
    form58: {
      totalUpToDate: footer.totalUpToDate.toFixed(2),
      totalSincePrevious: footer.totalSincePrevious.toFixed(2),
      totalNowToPay: footer.totalNowToPay.toFixed(2),
      aboveBelowAmount: footer.aboveBelowAmount.toFixed(2),
      netValue: footer.netValue.toFixed(2),
      gstAmount: footer.gstAmount.toFixed(2),
      grandTotal: footer.grandTotal.toFixed(2),
    },
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

/** Rate "expected" for a new MB row seeded from a Recap revision — matched by subWorkId. */
async function getRecapRateBySubWork(companyId: string, sourceRecapRevisionId: string | undefined): Promise<Map<string, number>> {
  if (!sourceRecapRevisionId) return new Map();
  const recapItems = await prisma.recapitulationItem.findMany({ where: { companyId, siteRecapRevisionId: sourceRecapRevisionId } });
  return new Map(recapItems.filter((r) => r.subWorkId).map((r) => [r.subWorkId as string, Number(r.rate)]));
}

export async function createMB(companyId: string, createdById: string, input: MBFormInput) {
  if (!input.projectId?.trim()) throw new Error("Project is required");
  if (!input.siteId?.trim()) throw new Error("Site is required");
  if (!input.mbNumber?.trim()) throw new Error("MB Number is required");
  await validateReferences(companyId, input);

  const existingNumber = await prisma.measurementBook.findFirst({ where: { companyId, mbNumber: input.mbNumber.trim() } });
  if (existingNumber) throw new Error(`MB Number "${input.mbNumber}" already exists`);

  const items = (input.items ?? []).map(validateItemInput);
  const recapRateBySubWork = await getRecapRateBySubWork(companyId, input.sourceRecapRevisionId);

  const mb = await prisma.$transaction(async (tx) => {
    const created = await tx.measurementBook.create({
      data: {
        companyId,
        projectId: input.projectId,
        siteId: input.siteId,
        subWorkId: input.subWorkId || null,
        mbNumber: input.mbNumber.trim(),
        raBillNumber: input.raBillNumber || null,
        mbDate: input.mbDate ? new Date(input.mbDate) : new Date(),
        site: input.site || null,
        engineerId: input.engineerId || null,
        contractorId: input.contractorId || null,
        status: parseStatus(input.status),
        remarks: input.remarks || null,
        abstractPdfUrl: input.abstractPdfUrl || null,
        abstractPdfName: input.abstractPdfName || null,
        sourceRecapRevisionId: input.sourceRecapRevisionId || null,
        aboveBelowPercent: input.aboveBelowPercent ?? 0,
        gstPercent: input.gstPercent ?? 0,
        createdById,
      },
    });

    if (items.length) {
      const resolved = await Promise.all(
        items.map((item, index) =>
          resolveItemRow(companyId, input.siteId, created.id, item, index, {
            boqRate: item.subWorkId ? recapRateBySubWork.get(item.subWorkId) : undefined,
          })
        )
      );
      await tx.measurementBookItem.createMany({ data: resolved.map((r) => r.data) });
      const auditRows = resolved.flatMap((r) =>
        r.audits.map((a) => ({ companyId, measurementBookId: created.id, boqItemNo: r.data.boqItemNo, ...a, changedById: createdById }))
      );
      if (auditRows.length) await tx.measurementItemFieldAudit.createMany({ data: auditRows });
    }

    return tx.measurementBook.findFirstOrThrow({ where: { id: created.id }, include });
  });

  return toDTO(mb);
}

export async function updateMB(id: string, companyId: string, changedById: string, input: Partial<MBFormInput>) {
  const existing = await prisma.measurementBook.findFirst({ where: { id, companyId }, include: { items: true } });
  if (!existing) throw new Error("Measurement Book not found");
  if (existing.status === "APPROVED") throw new Error("Cannot edit an Approved Measurement Book");

  // Approving an MB automatically raises its Running Bill — never a manual, separate step. Both
  // pre-conditions createRunningBill would itself check are verified up front so approval never
  // commits without also being able to bill (a partially-approved-but-unbillable MB is never left).
  // (existing.status is already guaranteed not-APPROVED by the guard above.)
  const willApprove = input.status !== undefined && parseStatus(input.status) === "APPROVED";
  if (willApprove) {
    if (!existing.items.length) throw new Error("Cannot approve — this Measurement Book has no BOQ rows to bill");
    const alreadyLinked = await prisma.runningBill.findFirst({ where: { measurementBookId: id } });
    if (alreadyLinked) throw new Error(`This Measurement Book is already linked to Running Bill ${alreadyLinked.billNumber}`);
  }

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
  const existingByBoqNo = new Map(existing.items.map((i) => [i.boqItemNo, i]));
  const effectiveSiteIdForCarryForward = input.siteId || existing.siteId;

  const mb = await prisma.$transaction(async (tx) => {
    const updated = await tx.measurementBook.update({
      where: { id },
      data: {
        projectId: input.projectId || existing.projectId,
        siteId: input.siteId || existing.siteId,
        subWorkId: input.subWorkId !== undefined ? input.subWorkId || null : existing.subWorkId,
        mbNumber: input.mbNumber?.trim() || existing.mbNumber,
        raBillNumber: input.raBillNumber !== undefined ? input.raBillNumber || null : existing.raBillNumber,
        mbDate: input.mbDate ? new Date(input.mbDate) : existing.mbDate,
        site: input.site !== undefined ? input.site || null : existing.site,
        engineerId: input.engineerId !== undefined ? input.engineerId || null : existing.engineerId,
        contractorId: input.contractorId !== undefined ? input.contractorId || null : existing.contractorId,
        status: input.status !== undefined ? parseStatus(input.status) : existing.status,
        remarks: input.remarks !== undefined ? input.remarks || null : existing.remarks,
        abstractPdfUrl: input.abstractPdfUrl !== undefined ? input.abstractPdfUrl || null : existing.abstractPdfUrl,
        abstractPdfName: input.abstractPdfName !== undefined ? input.abstractPdfName || null : existing.abstractPdfName,
        sourceRecapRevisionId: input.sourceRecapRevisionId !== undefined ? input.sourceRecapRevisionId || null : existing.sourceRecapRevisionId,
        aboveBelowPercent: input.aboveBelowPercent !== undefined ? input.aboveBelowPercent : existing.aboveBelowPercent,
        gstPercent: input.gstPercent !== undefined ? input.gstPercent : existing.gstPercent,
      },
    });

    if (items !== undefined) {
      await tx.measurementBookItem.deleteMany({ where: { measurementBookId: id } });
      if (items.length) {
        const resolved = await Promise.all(
          items.map((item, index) => {
            const existingItem = existingByBoqNo.get(item.boqItemNo.trim());
            return resolveItemRow(
              companyId,
              effectiveSiteIdForCarryForward,
              id,
              item,
              index,
              existingItem ? { previousQuantity: Number(existingItem.previousQuantity), boqRate: Number(existingItem.boqRate) } : undefined,
              id
            );
          })
        );
        await tx.measurementBookItem.createMany({ data: resolved.map((r) => r.data) });
        const auditRows = resolved.flatMap((r) =>
          r.audits.map((a) => ({ companyId, measurementBookId: id, boqItemNo: r.data.boqItemNo, ...a, changedById }))
        );
        if (auditRows.length) await tx.measurementItemFieldAudit.createMany({ data: auditRows });
      }
    }

    return tx.measurementBook.findFirstOrThrow({ where: { id: updated.id }, include });
  });

  if (willApprove) {
    await createRunningBillFromApprovedMB(companyId, changedById, id, mb.mbDate.toISOString().slice(0, 10));
  }

  return toDTO(mb);
}

/** Hard delete only allowed pre-Approval — an Approved MB is the official record and is never removable. */
export async function deleteMB(id: string, companyId: string) {
  const existing = await prisma.measurementBook.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Measurement Book not found");
  if (existing.status === "APPROVED") throw new Error("Cannot delete an Approved Measurement Book");

  await prisma.measurementBook.delete({ where: { id } });
}

/**
 * "Load from Recapitulation" — builds Abstract MB draft rows from the Site's current
 * (isCurrent=true) Recapitulation revision: Sr No/Particular/Rate copied straight from each
 * RecapitulationItem, Unit left blank (Recap has no Unit concept), Previous Qty auto-carried
 * forward from the latest prior MB for that Sub Work (0 if this is its first MB), Current Qty
 * left at 0 for the engineer to fill in. Never hardcoded — one row per current Sub Work, exactly
 * mirroring the Recapitulation sheet itself.
 */
export async function getMBRowsFromRecapitulation(siteId: string, companyId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, companyId } });
  if (!site) throw new Error("Site not found");

  const current = await prisma.siteRecapRevision.findFirst({
    where: { siteId, companyId, isCurrent: true },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!current || !current.items.length) {
    throw new Error("No saved Recapitulation Sheet exists yet for this Site — add one first");
  }

  const rows = await Promise.all(
    current.items.map(async (recapItem, index) => {
      const previousQuantity = recapItem.subWorkId
        ? await computePreviousQuantityForItem(companyId, siteId, recapItem.subWorkId)
        : 0;
      return {
        sortOrder: index,
        subWorkId: recapItem.subWorkId ?? "",
        boqItemNo: String(index + 1),
        boqDescription: recapItem.particular,
        unit: "",
        boqRate: recapItem.rate.toString(),
        previousQuantity: previousQuantity.toString(),
        currentQuantity: "0",
      };
    })
  );

  return { sourceRecapRevisionId: current.id, items: rows };
}

export async function getMBFieldAudits(measurementBookId: string, companyId: string) {
  const mb = await prisma.measurementBook.findFirst({ where: { id: measurementBookId, companyId } });
  if (!mb) throw new Error("Measurement Book not found");

  const audits = await prisma.measurementItemFieldAudit.findMany({
    where: { measurementBookId, companyId },
    include: { changedBy: { select: { id: true, name: true } } },
    orderBy: { changedAt: "desc" },
  });

  return audits.map((a) => ({
    id: a.id,
    boqItemNo: a.boqItemNo,
    fieldName: a.fieldName,
    oldValue: a.oldValue,
    newValue: a.newValue,
    reason: a.reason,
    changedById: a.changedById,
    changedByName: a.changedBy.name,
    changedAt: a.changedAt.toISOString(),
  }));
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
