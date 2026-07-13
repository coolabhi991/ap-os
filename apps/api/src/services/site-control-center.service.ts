import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { getSpecialCategoryIds, compareProgress, CostHeadKey, CostHeads } from "./project-control-center.service.js";
import { sumBudgetHeads } from "./sub-work.service.js";
import type { BudgetHeads } from "./sub-work.service.js";
import { toSiteDTO } from "./site.service.js";
import { getSiteWiseDeductions } from "./deduction-ledger.service.js";

async function verifySiteOwnership(siteId: string, companyId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, companyId } });
  if (!site) throw new Error("Site not found");
  return site;
}

/**
 * Cost-head breakdown for a Site (or a single Sub Work within it) — the Site-scoped
 * counterpart to computeCostHeads in project-control-center.service.ts. Labour/Machinery/
 * Fuel/Other/Site Expenses read Site.siteId directly (every LabourAttendance/Expense row
 * is tagged with the Site it was recorded against). VendorBill has no siteId column of its
 * own (it predates Sites and is not itself a Site Workspace tab) — Material/Vendor Bills
 * figures are scoped through the Site's own Sub Works instead, mirroring how Vendor Bills
 * are already opt-in tagged to a Sub Work today.
 */
async function computeSiteCostHeads(companyId: string, siteId: string, subWorkId?: string): Promise<CostHeads> {
  const { machineryId, fuelId, otherId } = await getSpecialCategoryIds(companyId);
  const excludeIds = [machineryId, fuelId, otherId].filter((x): x is string => !!x);

  const subWorkIds = subWorkId
    ? [subWorkId]
    : (await prisma.subWork.findMany({ where: { companyId, siteId }, select: { id: true } })).map((s) => s.id);

  const vendorBillFilter: Prisma.VendorBillWhereInput = subWorkIds.length ? { subWorkId: { in: subWorkIds } } : { id: "__none__" };
  const siteFilter = subWorkId ? { siteId, subWorkId } : { siteId };

  const [materialAgg, vendorBillsAgg, labourAgg, machineryAgg, fuelAgg, otherAgg, siteExpAgg] = await Promise.all([
    prisma.vendorBill.aggregate({
      where: { companyId, materialReceiptId: { not: null }, ...vendorBillFilter },
      _sum: { totalAmount: true },
    }),
    prisma.vendorBill.aggregate({
      where: { companyId, materialReceiptId: null, ...vendorBillFilter },
      _sum: { totalAmount: true },
    }),
    prisma.labourAttendance.aggregate({
      where: { companyId, isDeleted: false, ...siteFilter },
      _sum: { wageAmount: true },
    }),
    machineryId
      ? prisma.expense.aggregate({ where: { companyId, isDeleted: false, categoryId: machineryId, ...siteFilter }, _sum: { amount: true } })
      : Promise.resolve({ _sum: { amount: null as Prisma.Decimal | null } }),
    fuelId
      ? prisma.expense.aggregate({ where: { companyId, isDeleted: false, categoryId: fuelId, ...siteFilter }, _sum: { amount: true } })
      : Promise.resolve({ _sum: { amount: null as Prisma.Decimal | null } }),
    otherId
      ? prisma.expense.aggregate({ where: { companyId, isDeleted: false, categoryId: otherId, ...siteFilter }, _sum: { amount: true } })
      : Promise.resolve({ _sum: { amount: null as Prisma.Decimal | null } }),
    prisma.expense.aggregate({
      where: {
        companyId,
        isDeleted: false,
        labourPayment: null,
        ...(excludeIds.length ? { categoryId: { notIn: excludeIds } } : {}),
        ...siteFilter,
      },
      _sum: { amount: true },
    }),
  ]);

  const material = Number(materialAgg._sum.totalAmount ?? 0);
  const vendorBills = Number(vendorBillsAgg._sum.totalAmount ?? 0);
  const labour = Number(labourAgg._sum.wageAmount ?? 0);
  const machinery = Number(machineryAgg._sum.amount ?? 0);
  const fuel = Number(fuelAgg._sum.amount ?? 0);
  const other = Number(otherAgg._sum.amount ?? 0);
  const siteExpenses = Number(siteExpAgg._sum.amount ?? 0);
  const total = material + labour + machinery + fuel + vendorBills + siteExpenses + other;

  return {
    material: material.toFixed(2),
    labour: labour.toFixed(2),
    machinery: machinery.toFixed(2),
    fuel: fuel.toFixed(2),
    vendorBills: vendorBills.toFixed(2),
    siteExpenses: siteExpenses.toFixed(2),
    other: other.toFixed(2),
    total: total.toFixed(2),
  };
}

/** Sums every Sub Work's per-head planned budget across the whole Site. Never stored. */
async function computeSiteBudgetHeads(companyId: string, siteId: string): Promise<BudgetHeads> {
  const agg = await prisma.subWork.aggregate({
    where: { companyId, siteId },
    _sum: {
      budgetMaterial: true,
      budgetLabour: true,
      budgetMachinery: true,
      budgetFuel: true,
      budgetSiteExpenses: true,
      budgetVendorBills: true,
      budgetOther: true,
    },
  });

  return sumBudgetHeads({
    budgetMaterial: (agg._sum.budgetMaterial ?? new Prisma.Decimal(0)).toString(),
    budgetLabour: (agg._sum.budgetLabour ?? new Prisma.Decimal(0)).toString(),
    budgetMachinery: (agg._sum.budgetMachinery ?? new Prisma.Decimal(0)).toString(),
    budgetFuel: (agg._sum.budgetFuel ?? new Prisma.Decimal(0)).toString(),
    budgetSiteExpenses: (agg._sum.budgetSiteExpenses ?? new Prisma.Decimal(0)).toString(),
    budgetVendorBills: (agg._sum.budgetVendorBills ?? new Prisma.Decimal(0)).toString(),
    budgetOther: (agg._sum.budgetOther ?? new Prisma.Decimal(0)).toString(),
  });
}

/** Physical Progress at Site level is the plain average of its Sub Works' manually-entered progress — never itself stored. */
async function computeSitePhysicalProgress(companyId: string, siteId: string): Promise<number> {
  const subWorks = await prisma.subWork.findMany({ where: { companyId, siteId }, select: { physicalProgress: true } });
  if (subWorks.length === 0) return 0;
  const sum = subWorks.reduce((acc, s) => acc + s.physicalProgress, 0);
  return Math.round(sum / subWorks.length);
}

/** Overview tab — Site KPIs: contract figures, dates, Site Type, Physical vs Financial Progress. */
export async function getSiteOverview(siteId: string, companyId: string) {
  const site = await verifySiteOwnership(siteId, companyId);
  const costHeads = await computeSiteCostHeads(companyId, siteId);
  const actualCost = Number(costHeads.total);
  const budgetHeads = await computeSiteBudgetHeads(companyId, siteId);
  const budget = Number(budgetHeads.total);
  const physicalProgress = await computeSitePhysicalProgress(companyId, siteId);

  const pendingBillsWhere: Prisma.VendorBillWhereInput = {
    companyId,
    status: { in: ["PENDING", "PARTIALLY_PAID"] },
    subWorkId: { in: (await prisma.subWork.findMany({ where: { companyId, siteId }, select: { id: true } })).map((s) => s.id) },
  };
  const [pendingBillsCount, pendingBillsAgg, labourTodayCount] = await Promise.all([
    prisma.vendorBill.count({ where: pendingBillsWhere }),
    prisma.vendorBill.aggregate({ where: pendingBillsWhere, _sum: { outstandingBalance: true } }),
    prisma.labourAttendance.count({
      where: {
        companyId,
        siteId,
        isDeleted: false,
        status: "PRESENT",
        attendanceDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return {
    site: toSiteDTO(site),
    ...compareProgress(physicalProgress, budget, actualCost),
    budget: budget.toFixed(2),
    actualCost: actualCost.toFixed(2),
    remainingBudget: (budget - actualCost).toFixed(2),
    pendingVendorBills: { count: pendingBillsCount },
    pendingPayments: { amount: (pendingBillsAgg._sum.outstandingBalance ?? new Prisma.Decimal(0)).toString() },
    labourToday: { count: labourTodayCount },
    budgetHeads,
    costHeads,
  };
}

/** Live (unsaved) Recapitulation Sheet for a Site — the payload frozen into a SiteRecapRevision snapshot when the user saves a revision. */
export async function getSiteRecapLive(siteId: string, companyId: string) {
  const site = await verifySiteOwnership(siteId, companyId);
  const costHeads = await computeSiteCostHeads(companyId, siteId);
  const budgetHeads = await computeSiteBudgetHeads(companyId, siteId);
  const budget = Number(budgetHeads.total);
  const actual = Number(costHeads.total);
  const physicalProgress = await computeSitePhysicalProgress(companyId, siteId);

  const subWorks = await prisma.subWork.findMany({ where: { companyId, siteId }, orderBy: { sortOrder: "asc" } });
  const subWorkRows = await Promise.all(
    subWorks.map(async (sw) => {
      const swCostHeads = await computeSiteCostHeads(companyId, siteId, sw.id);
      const swBudgetHeads = sumBudgetHeads(sw);
      const swBudget = Number(swBudgetHeads.total);
      const swActual = Number(swCostHeads.total);
      return {
        subWorkId: sw.id,
        name: sw.name,
        status: sw.status,
        budget: swBudget.toFixed(2),
        actual: swActual.toFixed(2),
        difference: (swBudget - swActual).toFixed(2),
        ...compareProgress(sw.physicalProgress, swBudget, swActual),
        budgetHeads: swBudgetHeads,
        costHeads: swCostHeads,
      };
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    siteId: site.id,
    siteName: site.name,
    budget: budget.toFixed(2),
    actual: actual.toFixed(2),
    difference: (budget - actual).toFixed(2),
    ...compareProgress(physicalProgress, budget, actual),
    budgetHeads,
    costHeads,
    subWorks: subWorkRows,
  };
}

export const GST_TYPES = ["NONE", "FIVE", "TWELVE", "EIGHTEEN", "CUSTOM"];
export const GST_TYPE_LABELS: Record<string, string> = { NONE: "None", FIVE: "5%", TWELVE: "12%", EIGHTEEN: "18%", CUSTOM: "Custom" };
const GST_FIXED_PERCENT: Record<string, number> = { NONE: 0, FIVE: 5, TWELVE: 12, EIGHTEEN: 18 };

/** Resolves the effective GST % for a revision: fixed for NONE/FIVE/TWELVE/EIGHTEEN, user-supplied for CUSTOM. */
function resolveGstPercent(gstType: string, customPercent: number): number {
  return gstType === "CUSTOM" ? customPercent : (GST_FIXED_PERCENT[gstType] ?? 0);
}

export interface OtherCharge {
  label: string;
  amount: string;
}

export interface RecapitulationItemInput {
  subWorkId?: string;
  particular: string;
  unit?: string;
  qty: number;
  rate: number;
}

const recapItemInclude = { items: { orderBy: { sortOrder: "asc" as const } }, createdBy: { select: { name: true } } };
type RecapRevisionRow = Prisma.SiteRecapRevisionGetPayload<{ include: typeof recapItemInclude }>;

function toRecapRevisionDTO(r: RecapRevisionRow) {
  return {
    id: r.id,
    siteId: r.siteId,
    revisionNo: r.revisionNo,
    isCurrent: r.isCurrent,
    label: r.label ?? "",
    notes: r.notes ?? "",
    snapshot: r.snapshot,
    gstType: r.gstType,
    gstPercent: r.gstPercent.toString(),
    administrationCharges: r.administrationCharges.toString(),
    otherCharges: (r.otherCharges as unknown as OtherCharge[]) ?? [],
    msebCharges: r.msebCharges.toString(),
    royaltyCharges: r.royaltyCharges.toString(),
    testingCharges: r.testingCharges.toString(),
    labourCessCharges: r.labourCessCharges.toString(),
    otherRecoveries: r.otherRecoveries.toString(),
    otherChargesTotal: r.otherChargesTotal.toString(),
    subTotal: r.subTotal.toString(),
    gstAmount: r.gstAmount.toString(),
    grandTotal: r.grandTotal.toString(),
    items: r.items.map((i) => ({
      id: i.id,
      subWorkId: i.subWorkId ?? "",
      sortOrder: i.sortOrder,
      particular: i.particular,
      unit: i.unit ?? "",
      qty: i.qty.toString(),
      rate: i.rate.toString(),
      amount: i.amount.toString(),
    })),
    createdById: r.createdById,
    createdByName: r.createdBy?.name ?? "",
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * Recapitulation Sheet draft — the rows the "Add / Edit Recapitulation Sheet" screen starts
 * from. Always exactly one row per current Sub Work of the Site (never hardcoded, never an
 * arbitrary user-added row). If a saved revision already exists, its Qty/Rate values are
 * carried into the draft for matching Sub Works (by subWorkId) so re-saving isn't a blank
 * retype; brand-new Sub Works simply start at Qty 0 / Rate 0.
 */
export async function getRecapitulationDraft(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);
  const [subWorks, current] = await Promise.all([
    prisma.subWork.findMany({ where: { companyId, siteId }, orderBy: { sortOrder: "asc" } }),
    prisma.siteRecapRevision.findFirst({ where: { siteId, companyId, isCurrent: true }, include: recapItemInclude }),
  ]);

  const priorBysubWork = new Map((current?.items ?? []).filter((i) => i.subWorkId).map((i) => [i.subWorkId as string, i]));

  return {
    items: subWorks.map((sw, index) => {
      const prior = priorBysubWork.get(sw.id);
      return {
        subWorkId: sw.id,
        sortOrder: index,
        particular: sw.name,
        qty: prior ? prior.qty.toString() : "0",
        rate: prior ? prior.rate.toString() : "0",
        amount: prior ? prior.amount.toString() : "0",
      };
    }),
    gstType: current?.gstType ?? "NONE",
    gstPercent: current?.gstPercent.toString() ?? "0",
    administrationCharges: current?.administrationCharges.toString() ?? "0",
    otherCharges: (current?.otherCharges as unknown as OtherCharge[]) ?? [],
  };
}

/** Unlimited revisions per Site; exactly one is ever Current. A new revision is always INSERTed — prior revisions are never overwritten. */
export async function createSiteRecapRevision(
  siteId: string,
  companyId: string,
  createdById: string,
  input: {
    label?: string;
    notes?: string;
    items?: RecapitulationItemInput[];
    gstType?: string;
    gstPercent?: number;
    administrationCharges?: number;
    otherCharges?: OtherCharge[];
    msebCharges?: number;
    royaltyCharges?: number;
    testingCharges?: number;
    labourCessCharges?: number;
    otherRecoveries?: number;
  }
) {
  await verifySiteOwnership(siteId, companyId);
  const snapshot = await getSiteRecapLive(siteId, companyId);

  const gstType = input.gstType && GST_TYPES.includes(input.gstType) ? input.gstType : "NONE";
  if (gstType === "CUSTOM" && (input.gstPercent === undefined || input.gstPercent < 0)) {
    throw new Error("A valid custom GST % is required when GST type is Custom");
  }
  const effectiveGstPercent = resolveGstPercent(gstType, input.gstPercent ?? 0);
  const administrationCharges = Math.max(0, input.administrationCharges ?? 0);
  // Legacy free-form charges are still accepted and stored verbatim for display continuity, but
  // no longer contribute to the total — the five named fields below are the source of truth
  // going forward (Other Charges section, Workflow Refinement milestone).
  const otherCharges = (input.otherCharges ?? []).filter((c) => c.label?.trim());
  const msebCharges = Math.max(0, input.msebCharges ?? 0);
  const royaltyCharges = Math.max(0, input.royaltyCharges ?? 0);
  const testingCharges = Math.max(0, input.testingCharges ?? 0);
  const labourCessCharges = Math.max(0, input.labourCessCharges ?? 0);
  const otherRecoveries = Math.max(0, input.otherRecoveries ?? 0);
  const otherChargesTotal = msebCharges + royaltyCharges + testingCharges + labourCessCharges + otherRecoveries;

  // Amount is always server-recomputed as qty * rate — the client's amount is never trusted.
  const items = (input.items ?? []).map((row, index) => {
    const qty = Number(row.qty) || 0;
    const rate = Number(row.rate) || 0;
    return { companyId, subWorkId: row.subWorkId || null, sortOrder: index, particular: row.particular, unit: row.unit?.trim() || null, qty, rate, amount: qty * rate };
  });

  const subTotal = items.reduce((s, i) => s + i.amount, 0);
  const gstAmount = subTotal * (effectiveGstPercent / 100);
  const grandTotal = subTotal + gstAmount + administrationCharges + otherChargesTotal;

  const revision = await prisma.$transaction(async (tx) => {
    await tx.siteRecapRevision.updateMany({ where: { siteId, isCurrent: true }, data: { isCurrent: false } });
    const last = await tx.siteRecapRevision.findFirst({ where: { siteId }, orderBy: { revisionNo: "desc" } });
    const revisionNo = (last?.revisionNo ?? 0) + 1;
    const created = await tx.siteRecapRevision.create({
      data: {
        companyId,
        siteId,
        revisionNo,
        isCurrent: true,
        label: input.label || null,
        notes: input.notes || null,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        gstType: gstType as Prisma.SiteRecapRevisionUncheckedCreateInput["gstType"],
        gstPercent: effectiveGstPercent,
        administrationCharges,
        otherCharges: otherCharges as unknown as Prisma.InputJsonValue,
        msebCharges,
        royaltyCharges,
        testingCharges,
        labourCessCharges,
        otherRecoveries,
        otherChargesTotal,
        subTotal,
        gstAmount,
        grandTotal,
        createdById,
        items: { create: items },
      },
      include: recapItemInclude,
    });
    return created;
  });

  return toRecapRevisionDTO(revision);
}

export async function listSiteRecapRevisions(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);
  const revisions = await prisma.siteRecapRevision.findMany({
    where: { siteId, companyId },
    orderBy: { revisionNo: "desc" },
    include: recapItemInclude,
  });
  return revisions.map(toRecapRevisionDTO);
}

export async function getCurrentSiteRecapRevision(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);
  const current = await prisma.siteRecapRevision.findFirst({
    where: { siteId, companyId, isCurrent: true },
    include: recapItemInclude,
  });
  return current ? toRecapRevisionDTO(current) : null;
}

export async function getSiteRecapRevisionById(revisionId: string, companyId: string) {
  const revision = await prisma.siteRecapRevision.findFirst({
    where: { id: revisionId, companyId },
    include: recapItemInclude,
  });
  if (!revision) throw new Error("Recap revision not found");
  return toRecapRevisionDTO(revision);
}

export const RECAP_UNIT_OPTIONS = ["Nos", "M", "Cum", "Sqm", "Ltr", "Kg", "Job"];

interface RecapItemMutationInput {
  particular: string;
  unit?: string;
  qty: number;
  rate: number;
}

async function recomputeAndPersistRevisionTotals(tx: Prisma.TransactionClient, revisionId: string) {
  const revision = await tx.siteRecapRevision.findUniqueOrThrow({ where: { id: revisionId } });
  const items = await tx.recapitulationItem.findMany({ where: { siteRecapRevisionId: revisionId } });
  const subTotal = items.reduce((s, i) => s + Number(i.amount), 0);
  const otherChargesTotal =
    Number(revision.msebCharges) + Number(revision.royaltyCharges) + Number(revision.testingCharges) + Number(revision.labourCessCharges) + Number(revision.otherRecoveries);
  const gstAmount = subTotal * (Number(revision.gstPercent) / 100);
  const grandTotal = subTotal + otherChargesTotal + gstAmount + Number(revision.administrationCharges);
  return tx.siteRecapRevision.update({
    where: { id: revisionId },
    data: { subTotal, otherChargesTotal, gstAmount, grandTotal },
    include: recapItemInclude,
  });
}

/**
 * The Site's current, directly-editable Recapitulation Register — created empty on first row
 * add. Distinct from a "locked" historical revision (still created via createSiteRecapRevision,
 * unchanged): this is the live working grid that Add/Insert/Delete/Reorder/Inline-Edit act on
 * in place, without bumping the revision history on every keystroke.
 */
async function getOrCreateCurrentRevision(siteId: string, companyId: string, createdById: string) {
  const existing = await prisma.siteRecapRevision.findFirst({ where: { siteId, companyId, isCurrent: true } });
  if (existing) return existing;
  const last = await prisma.siteRecapRevision.findFirst({ where: { siteId }, orderBy: { revisionNo: "desc" } });
  return prisma.siteRecapRevision.create({
    data: { companyId, siteId, revisionNo: (last?.revisionNo ?? 0) + 1, isCurrent: true, snapshot: {}, createdById },
  });
}

function validateRecapItemInput(input: RecapItemMutationInput) {
  if (!input.particular?.trim()) throw new Error("Particular is required");
  const qty = Number(input.qty);
  const rate = Number(input.rate);
  if (!Number.isFinite(qty) || qty < 0) throw new Error("Qty must be a number greater than or equal to zero");
  if (!Number.isFinite(rate) || rate < 0) throw new Error("Rate must be a number greater than or equal to zero");
  return { particular: input.particular.trim(), unit: input.unit?.trim() || null, qty, rate, amount: qty * rate };
}

/**
 * Adds a Recapitulation Register row — appended at the end (Add Row), or inserted immediately
 * after `afterItemId` (Insert Row). Auto-creates the row's linked SubWork so DPR/Expense/
 * VendorBill/MaterialIssue/LabourAttendance/MeasurementBook/RunningBill/SiteBillItem pickers see
 * it immediately too — entering a row here is entering it everywhere ("Enter Once, Use
 * Everywhere"), with zero duplicate data entry.
 */
export async function addRecapItem(siteId: string, companyId: string, createdById: string, input: RecapItemMutationInput & { afterItemId?: string }) {
  const site = await verifySiteOwnership(siteId, companyId);
  const revision = await getOrCreateCurrentRevision(siteId, companyId, createdById);
  const { particular, unit, qty, rate, amount } = validateRecapItemInput(input);

  const updated = await prisma.$transaction(async (tx) => {
    let sortOrder: number;
    if (input.afterItemId) {
      const after = await tx.recapitulationItem.findFirst({ where: { id: input.afterItemId, siteRecapRevisionId: revision.id } });
      if (!after) throw new Error("Reference row not found");
      sortOrder = after.sortOrder + 1;
      await tx.recapitulationItem.updateMany({
        where: { siteRecapRevisionId: revision.id, sortOrder: { gte: sortOrder } },
        data: { sortOrder: { increment: 1 } },
      });
    } else {
      const maxSort = await tx.recapitulationItem.aggregate({ where: { siteRecapRevisionId: revision.id }, _max: { sortOrder: true } });
      sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
    }

    const maxSubWorkSort = await tx.subWork.aggregate({ where: { companyId, siteId }, _max: { sortOrder: true } });
    const subWork = await tx.subWork.create({
      data: { companyId, projectId: site.projectId, siteId, name: particular, sortOrder: (maxSubWorkSort._max.sortOrder ?? -1) + 1 },
    });

    await tx.recapitulationItem.create({
      data: { companyId, siteRecapRevisionId: revision.id, subWorkId: subWork.id, sortOrder, particular, unit, qty, rate, amount },
    });

    return recomputeAndPersistRevisionTotals(tx, revision.id);
  });

  return toRecapRevisionDTO(updated);
}

/** Inline-edits a row's Particular/Unit/Qty/Rate — Amount is always server-recomputed. Keeps the linked SubWork's name in sync so downstream pickers show the current name. */
export async function updateRecapItem(itemId: string, companyId: string, input: RecapItemMutationInput) {
  const existing = await prisma.recapitulationItem.findFirst({ where: { id: itemId, companyId } });
  if (!existing) throw new Error("Recapitulation item not found");
  const { particular, unit, qty, rate, amount } = validateRecapItemInput(input);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.recapitulationItem.update({ where: { id: itemId }, data: { particular, unit, qty, rate, amount } });
    if (existing.subWorkId && particular !== existing.particular) {
      await tx.subWork.update({ where: { id: existing.subWorkId }, data: { name: particular } });
    }
    return recomputeAndPersistRevisionTotals(tx, existing.siteRecapRevisionId);
  });

  return toRecapRevisionDTO(updated);
}

/** Deletes a row (never its linked SubWork — historical DPR/Expense/etc referencing it keep working, matching deleteSubWork's existing non-destructive convention) and closes the Sr No gap. */
export async function deleteRecapItem(itemId: string, companyId: string) {
  const existing = await prisma.recapitulationItem.findFirst({ where: { id: itemId, companyId } });
  if (!existing) throw new Error("Recapitulation item not found");

  const updated = await prisma.$transaction(async (tx) => {
    await tx.recapitulationItem.delete({ where: { id: itemId } });
    await tx.recapitulationItem.updateMany({
      where: { siteRecapRevisionId: existing.siteRecapRevisionId, sortOrder: { gt: existing.sortOrder } },
      data: { sortOrder: { decrement: 1 } },
    });
    return recomputeAndPersistRevisionTotals(tx, existing.siteRecapRevisionId);
  });

  return toRecapRevisionDTO(updated);
}

export interface RecapItemReorderEntry {
  id: string;
  sortOrder: number;
}

/** Reorders rows within the current Recapitulation Register (Reorder Row). */
export async function reorderRecapItems(siteId: string, companyId: string, order: RecapItemReorderEntry[]) {
  const revision = await prisma.siteRecapRevision.findFirst({ where: { siteId, companyId, isCurrent: true } });
  if (!revision) throw new Error("Recap revision not found");

  const ids = order.map((o) => o.id);
  const count = await prisma.recapitulationItem.count({ where: { id: { in: ids }, siteRecapRevisionId: revision.id } });
  if (count !== ids.length) throw new Error("One or more rows do not belong to this Recapitulation Register");

  await prisma.$transaction(order.map((o) => prisma.recapitulationItem.update({ where: { id: o.id }, data: { sortOrder: o.sortOrder } })));
  const updated = await prisma.siteRecapRevision.findUniqueOrThrow({ where: { id: revision.id }, include: recapItemInclude });
  return toRecapRevisionDTO(updated);
}

export interface RecapChargesInput {
  gstType?: string;
  gstPercent?: number;
  administrationCharges?: number;
  msebCharges?: number;
  royaltyCharges?: number;
  testingCharges?: number;
  labourCessCharges?: number;
  otherRecoveries?: number;
}

/**
 * Updates the Other Charges (MSEB / Royalty / Testing / Labour Cess / Other Recoveries) and the
 * GST section, kept as a separate action from item editing per the approved requirement that GST
 * "must remain a completely separate section below Other Charges."
 */
export async function updateRecapCharges(siteId: string, companyId: string, createdById: string, input: RecapChargesInput) {
  await verifySiteOwnership(siteId, companyId);
  const revision = await getOrCreateCurrentRevision(siteId, companyId, createdById);

  const gstType = input.gstType && GST_TYPES.includes(input.gstType) ? input.gstType : "NONE";
  if (gstType === "CUSTOM" && (input.gstPercent === undefined || input.gstPercent < 0)) {
    throw new Error("A valid custom GST % is required when GST type is Custom");
  }
  const effectiveGstPercent = resolveGstPercent(gstType, input.gstPercent ?? 0);
  const nonNeg = (v: number | undefined, label: string) => {
    const n = v ?? 0;
    if (!Number.isFinite(n) || n < 0) throw new Error(`${label} must be a number greater than or equal to zero`);
    return n;
  };

  const updated = await prisma.$transaction(async (tx) => {
    await tx.siteRecapRevision.update({
      where: { id: revision.id },
      data: {
        gstType: gstType as Prisma.SiteRecapRevisionUncheckedCreateInput["gstType"],
        gstPercent: effectiveGstPercent,
        administrationCharges: nonNeg(input.administrationCharges, "Administration Charges"),
        msebCharges: nonNeg(input.msebCharges, "MSEB Charges"),
        royaltyCharges: nonNeg(input.royaltyCharges, "Royalty"),
        testingCharges: nonNeg(input.testingCharges, "Testing Charges"),
        labourCessCharges: nonNeg(input.labourCessCharges, "Labour Cess"),
        otherRecoveries: nonNeg(input.otherRecoveries, "Other Recoveries"),
      },
    });
    return recomputeAndPersistRevisionTotals(tx, revision.id);
  });

  return toRecapRevisionDTO(updated);
}

/** Reports: Budget vs Actual (whole Site), including the full per-cost-head breakdown. */
export async function getSiteBudgetVsActualReport(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);
  const budgetHeads = await computeSiteBudgetHeads(companyId, siteId);
  const budget = Number(budgetHeads.total);
  const costHeads = await computeSiteCostHeads(companyId, siteId);
  const actual = Number(costHeads.total);
  const physicalProgress = await computeSitePhysicalProgress(companyId, siteId);

  return {
    budget: budget.toFixed(2),
    actual: actual.toFixed(2),
    difference: (budget - actual).toFixed(2),
    ...compareProgress(physicalProgress, budget, actual),
    budgetHeads,
    costHeads,
  };
}

/** Reports: Cost by Sub Work — one row per Sub Work in the Site. */
export async function getSiteCostBySubWorkReport(siteId: string, companyId: string) {
  const live = await getSiteRecapLive(siteId, companyId);
  return live.subWorks;
}

/**
 * Sub Work Financial Summary (Workflow Refinement milestone, Items 6 & 8) — replaces the old
 * Budget-vs-Actual "Cost by Sub Work" table with a billing/certification view per Recapitulation
 * section: Contract Value = Work Order/Recapitulation, Total Certified = the latest Running
 * Bill's cumulative certified amount for that section (never summed across bills — each bill's
 * totalCertifiedAmount/RunningBillItem.totalAmount is already the running to-date figure, same
 * rule getSiteFinancialSummary follows for the whole Site).
 *
 * Client Payment Received has no per-section source of truth — payments are recorded once per
 * bill, not itemized — so it is apportioned across sections in proportion to each section's
 * share of the latest bill's certified total. This is a reasonable allocation, not an exact
 * ledger; documented here and in the frontend so it's never mistaken for a stored, exact figure.
 */
export async function getSiteSubWorkFinancialSummary(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);

  const [currentRevision, latestBill, billsAgg, subWorks] = await Promise.all([
    prisma.siteRecapRevision.findFirst({ where: { siteId, companyId, isCurrent: true }, include: recapItemInclude }),
    prisma.runningBill.findFirst({
      where: { companyId, siteId, status: { not: "DRAFT" } },
      orderBy: { raSequence: "desc" },
      include: { items: { include: { siteBillItem: { select: { subWorkId: true } } } } },
    }),
    prisma.runningBill.aggregate({ where: { companyId, siteId, status: { not: "DRAFT" } }, _sum: { amountReceived: true } }),
    prisma.subWork.findMany({ where: { companyId, siteId }, select: { id: true, physicalProgress: true } }),
  ]);

  const certifiedBySubWork = new Map<string, number>();
  for (const item of latestBill?.items ?? []) {
    const subWorkId = item.siteBillItem?.subWorkId;
    if (!subWorkId) continue;
    certifiedBySubWork.set(subWorkId, (certifiedBySubWork.get(subWorkId) ?? 0) + Number(item.totalAmount));
  }
  const totalCertifiedInLatestBill = Array.from(certifiedBySubWork.values()).reduce((s, v) => s + v, 0);
  const totalClientPaymentsReceived = Number(billsAgg._sum.amountReceived ?? 0);
  const progressBySubWork = new Map(subWorks.map((s) => [s.id, s.physicalProgress]));

  const rows = (currentRevision?.items ?? []).map((item) => {
    const contractValue = Number(item.amount);
    const certifiedTillDate = item.subWorkId ? (certifiedBySubWork.get(item.subWorkId) ?? 0) : 0;
    const clientPaymentReceived = totalCertifiedInLatestBill > 0 ? round2(totalClientPaymentsReceived * (certifiedTillDate / totalCertifiedInLatestBill)) : 0;
    const outstandingPayment = round2(certifiedTillDate - clientPaymentReceived);
    const remainingContractValue = round2(contractValue - certifiedTillDate);
    const progressPercent = item.subWorkId ? (progressBySubWork.get(item.subWorkId) ?? 0) : 0;

    return {
      subWorkId: item.subWorkId ?? "",
      particular: item.particular,
      contractValue: contractValue.toFixed(2),
      certifiedTillDate: certifiedTillDate.toFixed(2),
      clientPaymentReceived: clientPaymentReceived.toFixed(2),
      outstandingPayment: outstandingPayment.toFixed(2),
      remainingContractValue: remainingContractValue.toFixed(2),
      progressPercent,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      contractValue: acc.contractValue + Number(r.contractValue),
      certifiedTillDate: acc.certifiedTillDate + Number(r.certifiedTillDate),
      clientPaymentReceived: acc.clientPaymentReceived + Number(r.clientPaymentReceived),
      outstandingPayment: acc.outstandingPayment + Number(r.outstandingPayment),
      remainingContractValue: acc.remainingContractValue + Number(r.remainingContractValue),
    }),
    { contractValue: 0, certifiedTillDate: 0, clientPaymentReceived: 0, outstandingPayment: 0, remainingContractValue: 0 }
  );

  return {
    rows,
    site: {
      contractValue: totals.contractValue.toFixed(2),
      certifiedTillDate: totals.certifiedTillDate.toFixed(2),
      clientPaymentReceived: totals.clientPaymentReceived.toFixed(2),
      outstandingPayment: totals.outstandingPayment.toFixed(2),
      remainingContractValue: totals.remainingContractValue.toFixed(2),
    },
  };
}

/** Reports: Monthly Cost — every cost-bearing record tagged to the Site, bucketed by month. */
export async function getSiteMonthlyCostReport(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);
  const subWorkIds = (await prisma.subWork.findMany({ where: { companyId, siteId }, select: { id: true } })).map((s) => s.id);

  const [vendorBills, attendances, expenses] = await Promise.all([
    subWorkIds.length
      ? prisma.vendorBill.findMany({ where: { companyId, subWorkId: { in: subWorkIds } }, select: { billDate: true, totalAmount: true } })
      : Promise.resolve([]),
    prisma.labourAttendance.findMany({ where: { companyId, siteId, isDeleted: false }, select: { attendanceDate: true, wageAmount: true } }),
    prisma.expense.findMany({ where: { companyId, siteId, isDeleted: false, labourPayment: null }, select: { expenseDate: true, amount: true } }),
  ]);

  const buckets = new Map<string, number>();
  const add = (date: Date, amount: number) => {
    const key = date.toISOString().slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + amount);
  };
  vendorBills.forEach((b) => add(b.billDate, Number(b.totalAmount)));
  attendances.forEach((a) => add(a.attendanceDate, Number(a.wageAmount)));
  expenses.forEach((e) => add(e.expenseDate, Number(e.amount)));

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, amount]) => ({ month, totalAmount: amount.toFixed(2) }));
}

export async function getSiteCostSummaryReport(siteId: string, companyId: string) {
  const budgetVsActual = await getSiteBudgetVsActualReport(siteId, companyId);
  const costHeads = await computeSiteCostHeads(companyId, siteId);
  return { ...budgetVsActual, costHeads };
}

const HEAD_ORDER: CostHeadKey[] = ["material", "labour", "machinery", "fuel", "vendorBills", "siteExpenses", "other"];
const HEAD_CSV_LABELS: Record<CostHeadKey, string> = {
  material: "Material",
  labour: "Labour",
  machinery: "Machinery",
  fuel: "Fuel",
  vendorBills: "Vendor Bills",
  siteExpenses: "Site Expenses",
  other: "Other",
};

export async function exportSiteCostBySubWorkToCSV(siteId: string, companyId: string) {
  const rows = await getSiteCostBySubWorkReport(siteId, companyId);

  const headers = [
    "Sub Work",
    "Status",
    ...HEAD_ORDER.map((k) => `Budget ${HEAD_CSV_LABELS[k]}`),
    "Total Budget",
    ...HEAD_ORDER.map((k) => `Actual ${HEAD_CSV_LABELS[k]}`),
    "Total Actual",
    "Difference",
    "Physical Progress %",
    "Financial Progress %",
    "Variance",
  ];
  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvRows = rows.map((r) =>
    [
      r.name,
      r.status,
      ...HEAD_ORDER.map((k) => r.budgetHeads[k]),
      r.budgetHeads.total,
      ...HEAD_ORDER.map((k) => r.costHeads[k]),
      r.costHeads.total,
      r.difference,
      `${r.physicalProgress}%`,
      `${r.financialProgress}%`,
      r.varianceStatus,
    ]
      .map((v) => escapeCsv(String(v)))
      .join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
}

const WALLET_INFLOW_TYPES = ["RUNNING_BILL_RECEIPT"] as const;
const WALLET_OUTFLOW_TYPES = ["SITE_EXPENSE", "LABOUR"] as const;

/**
 * Site Wallet — the net cash position a Site has moved through the bank, computed purely from
 * TransactionAllocation rows tagged with this Site's id (never stored). Inflow = money credited
 * to the site's work (Running Bill Receipts allocated here); Outflow = money spent on the site's
 * behalf (Site Expense and Labour allocations). Every other allocation type is out of scope for
 * a Site's wallet by definition (Vendor Payment/GST/Loan/etc. are company-level or vendor-level
 * money movements, not a site cash position).
 */
export async function getSiteWallet(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);

  const rows = await prisma.transactionAllocation.groupBy({
    by: ["allocationType"],
    where: { companyId, siteId },
    _sum: { amount: true },
  });

  const byType: Record<string, number> = {};
  for (const r of rows) byType[r.allocationType] = Number(r._sum.amount ?? 0);

  const inflow = WALLET_INFLOW_TYPES.reduce((s, t) => s + (byType[t] ?? 0), 0);
  const outflow = WALLET_OUTFLOW_TYPES.reduce((s, t) => s + (byType[t] ?? 0), 0);

  return {
    inflow: inflow.toFixed(2),
    outflow: outflow.toFixed(2),
    balance: (inflow - outflow).toFixed(2),
    breakdown: {
      runningBillReceipts: (byType["RUNNING_BILL_RECEIPT"] ?? 0).toFixed(2),
      siteExpenses: (byType["SITE_EXPENSE"] ?? 0).toFixed(2),
      labour: (byType["LABOUR"] ?? 0).toFixed(2),
    },
  };
}

/**
 * Bill Received (Client) — read straight off the existing RunningBill + RunningBillPayment
 * ledgers (Banking's Running Bill Receipt allocations write to RunningBillPayment; nothing here
 * is a second copy of that data). Bank Account is every distinct account a receipt against this
 * bill has actually landed in.
 */
export async function getSiteBillReceivedReport(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);

  const bills = await prisma.runningBill.findMany({
    where: { companyId, siteId },
    include: { payments: { include: { companyBankAccount: { select: { id: true, nickname: true, bankName: true } } } } },
    orderBy: { billDate: "desc" },
  });

  return bills.map((b) => ({
    id: b.id,
    raNumber: b.billNumber,
    billDate: b.billDate.toISOString().slice(0, 10),
    billAmount: b.netPayable.toString(),
    receivedAmount: b.amountReceived.toString(),
    pendingAmount: b.outstandingAmount.toString(),
    status: b.status,
    bankAccounts: Array.from(
      new Set(b.payments.map((p) => p.companyBankAccount?.nickname || p.companyBankAccount?.bankName).filter((x): x is string => !!x))
    ),
  }));
}

/** Vendor Bills for a Site — read straight off the existing VendorBill ledger, scoped through this Site's own Sub Works (VendorBill has no direct siteId — it's tagged to a Sub Work, same as everywhere else Vendor Bills are attributed). */
export async function getSiteVendorBillsReport(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);

  const subWorkIds = (await prisma.subWork.findMany({ where: { companyId, siteId }, select: { id: true } })).map((s) => s.id);
  if (!subWorkIds.length) return [];

  const bills = await prisma.vendorBill.findMany({
    where: { companyId, subWorkId: { in: subWorkIds } },
    include: { vendor: { select: { id: true, name: true } } },
    orderBy: { billDate: "desc" },
  });

  return bills.map((b) => ({
    id: b.id,
    billNumber: b.billNumber,
    billDate: b.billDate.toISOString().slice(0, 10),
    vendor: b.vendor.name,
    totalAmount: b.totalAmount.toString(),
    paidAmount: b.paidAmount.toString(),
    outstandingBalance: b.outstandingBalance.toString(),
    status: b.status,
  }));
}

/** Money Flow — the chronological timeline behind Site Wallet's totals: every allocation that has moved money in or out of this Site, oldest logic reused as-is from TransactionAllocation (never a second ledger). */
export async function getSiteMoneyFlow(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);

  const rows = await prisma.transactionAllocation.findMany({
    where: { companyId, siteId },
    include: {
      bankTransaction: { select: { transactionDate: true, companyBankAccount: { select: { nickname: true, bankName: true } } } },
      runningBillPayment: { select: { paymentNumber: true, runningBill: { select: { billNumber: true } } } },
      expense: { select: { expenseNumber: true, category: { select: { name: true } } } },
      labourPayment: { select: { labour: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    date: r.bankTransaction.transactionDate.toISOString().slice(0, 10),
    allocationType: r.allocationType,
    direction: r.allocationType === "RUNNING_BILL_RECEIPT" ? "IN" : "OUT",
    amount: r.amount.toString(),
    bankAccount: r.bankTransaction.companyBankAccount.nickname || r.bankTransaction.companyBankAccount.bankName,
    reference:
      (r.runningBillPayment && `RA ${r.runningBillPayment.runningBill.billNumber} — ${r.runningBillPayment.paymentNumber}`) ||
      (r.expense && `${r.expense.category.name} — ${r.expense.expenseNumber}`) ||
      (r.labourPayment && `Labour — ${r.labourPayment.labour.name}`) ||
      r.notes ||
      "",
  }));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Site Financial Summary — the automatic, always-derived billing rollup a Site maintains per the
 * Form 58 redesign: Agreement Value, Gross Billing, every deduction-type total, Total Deductions,
 * Net Bills Raised, Client Payments Received, Outstanding, and Remaining Agreement Value. Nothing
 * here is stored a second time: Gross Billing reads the latest non-Draft Running Bill's own
 * cumulative totalCertifiedAmount (already the running to-date figure — see running-bill.service.ts),
 * deduction totals reuse getSiteWiseDeductions (the same numbers the Recovery Ledger reads), and
 * payments/outstanding are summed straight off RunningBill.
 */
export async function getSiteFinancialSummary(siteId: string, companyId: string) {
  const site = await verifySiteOwnership(siteId, companyId);

  const [latestBill, billsAgg, billsCount, deductionRows] = await Promise.all([
    prisma.runningBill.findFirst({
      where: { companyId, siteId, status: { not: "DRAFT" } },
      orderBy: { raSequence: "desc" },
      select: { totalCertifiedAmount: true },
    }),
    prisma.runningBill.aggregate({
      where: { companyId, siteId, status: { not: "DRAFT" } },
      _sum: { amountReceived: true, outstandingAmount: true },
    }),
    prisma.runningBill.count({ where: { companyId, siteId, status: { not: "DRAFT" } } }),
    getSiteWiseDeductions(companyId, { siteId }),
  ]);

  const agreementValue = Number(site.contractValue);
  const grossBilling = latestBill ? Number(latestBill.totalCertifiedAmount) : 0;
  const deductionRow = deductionRows[0];
  const totalDeductions = deductionRow ? Number(deductionRow.totalDeductions) : 0;
  const netBillsRaised = round2(grossBilling - totalDeductions);
  const clientPaymentsReceived = Number(billsAgg._sum.amountReceived ?? 0);
  const outstandingAmount = Number(billsAgg._sum.outstandingAmount ?? 0);
  const remainingAgreementValue = round2(agreementValue - grossBilling);

  return {
    siteId,
    agreementValue: agreementValue.toFixed(2),
    totalRABills: billsCount,
    grossBilling: grossBilling.toFixed(2),
    gstStateTotal: deductionRow?.gstState ?? "0.00",
    gstCentralTotal: deductionRow?.gstCentral ?? "0.00",
    incomeTaxTotal: deductionRow?.incomeTax ?? "0.00",
    securityDepositTotal: deductionRow?.sdDeducted ?? "0.00",
    royaltyTotal: deductionRow?.royalty ?? "0.00",
    insuranceTotal: deductionRow?.insurance ?? "0.00",
    fineTotal: deductionRow?.fine ?? "0.00",
    labourCessTotal: deductionRow?.labourCess ?? "0.00",
    otherDeductionsTotal: deductionRow?.other ?? "0.00",
    totalDeductions: totalDeductions.toFixed(2),
    netBillsRaised: netBillsRaised.toFixed(2),
    clientPaymentsReceived: clientPaymentsReceived.toFixed(2),
    outstandingAmount: outstandingAmount.toFixed(2),
    remainingAgreementValue: remainingAgreementValue.toFixed(2),
  };
}
