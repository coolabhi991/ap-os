import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { getSpecialCategoryIds, compareProgress, CostHeadKey, CostHeads } from "./project-control-center.service.js";
import { sumBudgetHeads } from "./sub-work.service.js";
import type { BudgetHeads } from "./sub-work.service.js";
import { toSiteDTO } from "./site.service.js";

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

function toRecapRevisionDTO(r: {
  id: string;
  siteId: string;
  revisionNo: number;
  isCurrent: boolean;
  label: string | null;
  notes: string | null;
  snapshot: Prisma.JsonValue;
  createdById: string;
  createdAt: Date;
  createdBy?: { name: string } | null;
}) {
  return {
    id: r.id,
    siteId: r.siteId,
    revisionNo: r.revisionNo,
    isCurrent: r.isCurrent,
    label: r.label ?? "",
    notes: r.notes ?? "",
    snapshot: r.snapshot,
    createdById: r.createdById,
    createdByName: r.createdBy?.name ?? "",
    createdAt: r.createdAt.toISOString(),
  };
}

/** Unlimited revisions per Site; exactly one is ever Current. A new revision is always INSERTed — prior revisions are never overwritten. */
export async function createSiteRecapRevision(
  siteId: string,
  companyId: string,
  createdById: string,
  input: { label?: string; notes?: string }
) {
  await verifySiteOwnership(siteId, companyId);
  const snapshot = await getSiteRecapLive(siteId, companyId);

  const revision = await prisma.$transaction(async (tx) => {
    await tx.siteRecapRevision.updateMany({ where: { siteId, isCurrent: true }, data: { isCurrent: false } });
    const last = await tx.siteRecapRevision.findFirst({ where: { siteId }, orderBy: { revisionNo: "desc" } });
    const revisionNo = (last?.revisionNo ?? 0) + 1;
    return tx.siteRecapRevision.create({
      data: {
        companyId,
        siteId,
        revisionNo,
        isCurrent: true,
        label: input.label || null,
        notes: input.notes || null,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        createdById,
      },
      include: { createdBy: { select: { name: true } } },
    });
  });

  return toRecapRevisionDTO(revision);
}

export async function listSiteRecapRevisions(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);
  const revisions = await prisma.siteRecapRevision.findMany({
    where: { siteId, companyId },
    orderBy: { revisionNo: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
  return revisions.map(toRecapRevisionDTO);
}

export async function getCurrentSiteRecapRevision(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);
  const current = await prisma.siteRecapRevision.findFirst({
    where: { siteId, companyId, isCurrent: true },
    include: { createdBy: { select: { name: true } } },
  });
  return current ? toRecapRevisionDTO(current) : null;
}

export async function getSiteRecapRevisionById(revisionId: string, companyId: string) {
  const revision = await prisma.siteRecapRevision.findFirst({
    where: { id: revisionId, companyId },
    include: { createdBy: { select: { name: true } } },
  });
  if (!revision) throw new Error("Recap revision not found");
  return toRecapRevisionDTO(revision);
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
