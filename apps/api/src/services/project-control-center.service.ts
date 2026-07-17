import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { getSubWorkById, sumBudgetHeads } from "./sub-work.service.js";
import type { BudgetHeads } from "./sub-work.service.js";
import { getProjectById } from "./project.service.js";
import { listSites } from "./site.service.js";
import { getSiteBudgetVsActualReport } from "./site-control-center.service.js";

export type CostHeadKey = "material" | "labour" | "machinery" | "fuel" | "vendorBills" | "siteExpenses" | "other";

export interface CostHeads {
  material: string;
  labour: string;
  machinery: string;
  fuel: string;
  vendorBills: string;
  siteExpenses: string;
  other: string;
  total: string;
}

async function verifyProjectOwnership(projectId: string, companyId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new Error("Project not found");
  return project;
}

/**
 * Resolves the ids of the three ExpenseCategory rows that drive dedicated cost heads
 * (Machinery, Fuel) and the "Other" bucket (mapped onto the existing "Miscellaneous"
 * default category — there is no separate "Other" category, to avoid a duplicate bucket).
 * Matched case-insensitively in JS since category names are free text, not an enum.
 */
export async function getSpecialCategoryIds(companyId: string) {
  const categories = await prisma.expenseCategory.findMany({ where: { companyId }, select: { id: true, name: true } });
  const find = (name: string) => categories.find((c) => c.name.trim().toLowerCase() === name.toLowerCase())?.id ?? null;
  return {
    machineryId: find("Machinery"),
    fuelId: find("Fuel"),
    otherId: find("Miscellaneous"),
  };
}

/**
 * Computes the cost-head breakdown for a project (or a single Sub Work within it, when
 * subWorkId is supplied) purely by aggregating EXISTING modules — no separate ledger:
 *  - Material      = VendorBill.totalAmount where tied to a goods receipt (materialReceiptId set)
 *  - Vendor Bills  = VendorBill.totalAmount NOT tied to a goods receipt (services/direct invoices)
 *  - Labour        = LabourAttendance.wageAmount (accrual; excludes Advances/Payments, which are
 *                    cash movements against that same accrued wage, to avoid double counting)
 *  - Machinery     = Expense.amount where category = "Machinery"
 *  - Fuel          = Expense.amount where category = "Fuel"
 *  - Other         = Expense.amount where category = "Miscellaneous"
 *  - Site Expenses = Expense.amount for every other category, excluding any Expense that has a
 *                    linked LabourPayment (opt-in "log as expense" flow) to avoid double counting Labour
 */
async function computeCostHeads(companyId: string, projectId: string, subWorkId?: string): Promise<CostHeads> {
  const { machineryId, fuelId, otherId } = await getSpecialCategoryIds(companyId);
  const excludeIds = [machineryId, fuelId, otherId].filter((x): x is string => !!x);
  const subWorkFilter = subWorkId ? { subWorkId } : {};

  const [materialAgg, vendorBillsAgg, labourAgg, machineryAgg, fuelAgg, otherAgg, siteExpAgg] = await Promise.all([
    prisma.vendorBill.aggregate({
      where: { companyId, projectId, materialReceiptId: { not: null }, ...subWorkFilter },
      _sum: { totalAmount: true },
    }),
    prisma.vendorBill.aggregate({
      where: { companyId, projectId, materialReceiptId: null, ...subWorkFilter },
      _sum: { totalAmount: true },
    }),
    prisma.labourAttendance.aggregate({
      where: { companyId, projectId, isDeleted: false, ...subWorkFilter },
      _sum: { wageAmount: true },
    }),
    machineryId
      ? prisma.expense.aggregate({ where: { companyId, projectId, isDeleted: false, categoryId: machineryId, ...subWorkFilter }, _sum: { amount: true } })
      : Promise.resolve({ _sum: { amount: null as Prisma.Decimal | null } }),
    fuelId
      ? prisma.expense.aggregate({ where: { companyId, projectId, isDeleted: false, categoryId: fuelId, ...subWorkFilter }, _sum: { amount: true } })
      : Promise.resolve({ _sum: { amount: null as Prisma.Decimal | null } }),
    otherId
      ? prisma.expense.aggregate({ where: { companyId, projectId, isDeleted: false, categoryId: otherId, ...subWorkFilter }, _sum: { amount: true } })
      : Promise.resolve({ _sum: { amount: null as Prisma.Decimal | null } }),
    prisma.expense.aggregate({
      where: {
        companyId,
        projectId,
        isDeleted: false,
        labourPayment: null,
        ...(excludeIds.length ? { categoryId: { notIn: excludeIds } } : {}),
        ...subWorkFilter,
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

/** Sums every Sub Work's per-head planned budget across the whole project — the project-wide counterpart to a single Sub Work's `sumBudgetHeads`. Never stored. */
async function computeProjectBudgetHeads(companyId: string, projectId: string): Promise<BudgetHeads> {
  const agg = await prisma.subWork.aggregate({
    where: { companyId, projectId },
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

export type VarianceStatus = "ahead" | "on-track" | "behind";

/** Percentage points of slack before Physical vs Financial Progress is flagged as diverging. */
const VARIANCE_TOLERANCE = 10;

/**
 * Financial Progress (Actual Cost / Budget) is always computed on demand — it is never
 * treated as "Completion %". Physical Progress is a separate, manually-entered value
 * (SubWork.physicalProgress, or Project.progress at whole-project level) and the two are
 * always returned side by side, never collapsed into one number.
 */
export function compareProgress(physicalProgress: number, budget: number, actual: number) {
  const financialProgress = budget > 0 ? Math.round((actual / budget) * 1000) / 10 : 0;
  const variance = Math.round((physicalProgress - financialProgress) * 10) / 10;
  const varianceStatus: VarianceStatus =
    variance > VARIANCE_TOLERANCE ? "ahead" : variance < -VARIANCE_TOLERANCE ? "behind" : "on-track";
  return { physicalProgress, financialProgress, variance, varianceStatus };
}

/** The Recapitulation Sheet for a single Sub Work: Budget, Actual, Difference, Physical vs Financial Progress, and the Budget-vs-Actual cost-head breakdown. */
export async function getSubWorkRecap(subWorkId: string, companyId: string) {
  const subWork = await getSubWorkById(subWorkId, companyId);
  const costHeads = await computeCostHeads(companyId, subWork.projectId, subWork.id);
  const budgetHeads = sumBudgetHeads(subWork);
  const budget = Number(budgetHeads.total);
  const actual = Number(costHeads.total);

  return {
    subWork,
    budget: budget.toFixed(2),
    actual: actual.toFixed(2),
    difference: (budget - actual).toFixed(2),
    ...compareProgress(subWork.physicalProgress, budget, actual),
    budgetHeads,
    costHeads,
  };
}

/** Drill-down traceability lists behind a single cost head on a Sub Work's Recap Sheet. */
export async function getSubWorkDrillDown(subWorkId: string, companyId: string, head: CostHeadKey) {
  const subWork = await getSubWorkById(subWorkId, companyId);
  const projectId = subWork.projectId;
  const { machineryId, fuelId, otherId } = await getSpecialCategoryIds(companyId);
  const excludeIds = [machineryId, fuelId, otherId].filter((x): x is string => !!x);

  if (head === "material") {
    const [materialIssues, vendorBills] = await Promise.all([
      prisma.materialIssue.findMany({
        where: { companyId, projectId, subWorkId, isDeleted: false },
        select: { id: true, issueNumber: true, issuedDate: true, itemName: true, quantity: true, unit: true, purpose: true },
        orderBy: { issuedDate: "desc" },
      }),
      prisma.vendorBill.findMany({
        where: { companyId, projectId, subWorkId, materialReceiptId: { not: null } },
        select: { id: true, billNumber: true, billDate: true, totalAmount: true, status: true, materialReceiptId: true, vendor: { select: { id: true, name: true } } },
        orderBy: { billDate: "desc" },
      }),
    ]);
    const receiptIds = vendorBills.map((b) => b.materialReceiptId).filter((x): x is string => !!x);
    const materialReceipts = receiptIds.length
      ? await prisma.materialReceipt.findMany({
          where: { id: { in: receiptIds } },
          select: { id: true, receiptNumber: true, receivedDate: true, itemName: true, quantity: true, unit: true, status: true },
        })
      : [];

    return {
      materialIssues: materialIssues.map((mi) => ({ ...mi, issuedDate: mi.issuedDate.toISOString().slice(0, 10), quantity: mi.quantity.toString() })),
      materialReceipts: materialReceipts.map((mr) => ({ ...mr, receivedDate: mr.receivedDate.toISOString().slice(0, 10), quantity: mr.quantity.toString() })),
      vendorBills: vendorBills.map((vb) => ({
        id: vb.id,
        billNumber: vb.billNumber,
        billDate: vb.billDate.toISOString().slice(0, 10),
        totalAmount: vb.totalAmount.toString(),
        status: vb.status,
        vendor: vb.vendor,
      })),
    };
  }

  if (head === "labour") {
    // Advances/Payments are cash movements against a worker's ledger, not tied to a specific
    // day's sub work — scoped to the whole project rather than this Sub Work specifically.
    const [attendance, advances, payments] = await Promise.all([
      prisma.labourAttendance.findMany({
        where: { companyId, projectId, subWorkId, isDeleted: false },
        select: { id: true, attendanceDate: true, status: true, wageAmount: true, labour: { select: { id: true, name: true } } },
        orderBy: { attendanceDate: "desc" },
      }),
      prisma.labourAdvance.findMany({
        where: { companyId, projectId, isDeleted: false },
        select: { id: true, advanceDate: true, amount: true, mode: true, labour: { select: { id: true, name: true } } },
        orderBy: { advanceDate: "desc" },
      }),
      prisma.labourPayment.findMany({
        where: { companyId, projectId, isDeleted: false },
        select: { id: true, paymentDate: true, amount: true, mode: true, labour: { select: { id: true, name: true } } },
        orderBy: { paymentDate: "desc" },
      }),
    ]);

    return {
      attendance: attendance.map((a) => ({ ...a, attendanceDate: a.attendanceDate.toISOString().slice(0, 10), wageAmount: a.wageAmount.toString() })),
      advances: advances.map((a) => ({ ...a, advanceDate: a.advanceDate.toISOString().slice(0, 10), amount: a.amount.toString() })),
      payments: payments.map((p) => ({ ...p, paymentDate: p.paymentDate.toISOString().slice(0, 10), amount: p.amount.toString() })),
    };
  }

  if (head === "machinery" || head === "fuel" || head === "other") {
    const categoryId = head === "machinery" ? machineryId : head === "fuel" ? fuelId : otherId;
    if (!categoryId) return { expenses: [] };
    const expenses = await prisma.expense.findMany({
      where: { companyId, projectId, subWorkId, isDeleted: false, categoryId },
      select: {
        id: true, expenseNumber: true, expenseDate: true, amount: true,
        machineType: true, machineHours: true, machineRatePerHour: true,
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: "desc" },
    });
    return {
      expenses: expenses.map((e) => ({
        ...e,
        expenseDate: e.expenseDate.toISOString().slice(0, 10),
        amount: e.amount.toString(),
        machineHours: e.machineHours?.toString() ?? "",
        machineRatePerHour: e.machineRatePerHour?.toString() ?? "",
      })),
    };
  }

  if (head === "vendorBills") {
    const bills = await prisma.vendorBill.findMany({
      where: { companyId, projectId, subWorkId, materialReceiptId: null },
      select: {
        id: true, billNumber: true, billDate: true, totalAmount: true, paidAmount: true, outstandingBalance: true, status: true,
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { billDate: "desc" },
    });
    const billIds = bills.map((b) => b.id);
    const payments = billIds.length
      ? await prisma.vendorPayment.findMany({
          where: { vendorBillId: { in: billIds } },
          select: { id: true, paymentNumber: true, paymentDate: true, amount: true, mode: true, vendorBillId: true },
          orderBy: { paymentDate: "desc" },
        })
      : [];

    return {
      bills: bills.map((b) => ({
        ...b,
        billDate: b.billDate.toISOString().slice(0, 10),
        totalAmount: b.totalAmount.toString(),
        paidAmount: b.paidAmount.toString(),
        outstandingBalance: b.outstandingBalance.toString(),
      })),
      payments: payments.map((p) => ({ ...p, paymentDate: p.paymentDate.toISOString().slice(0, 10), amount: p.amount.toString() })),
    };
  }

  // siteExpenses
  const expenses = await prisma.expense.findMany({
    where: {
      companyId,
      projectId,
      subWorkId,
      isDeleted: false,
      labourPayment: null,
      ...(excludeIds.length ? { categoryId: { notIn: excludeIds } } : {}),
    },
    select: {
      id: true, expenseNumber: true, expenseDate: true, amount: true,
      category: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
    },
    orderBy: { expenseDate: "desc" },
  });
  return { expenses: expenses.map((e) => ({ ...e, expenseDate: e.expenseDate.toISOString().slice(0, 10), amount: e.amount.toString() })) };
}

/** Overview tab — whole-project KPIs, ignoring any Sub Work tagging. */
export async function getProjectOverview(projectId: string, companyId: string) {
  const project = await verifyProjectOwnership(projectId, companyId);
  const costHeads = await computeCostHeads(companyId, projectId);
  const actualCost = Number(costHeads.total);

  const budgetHeads = await computeProjectBudgetHeads(companyId, projectId);
  const budget = Number(budgetHeads.total);

  const pendingBillsWhere: Prisma.VendorBillWhereInput = { companyId, projectId, status: { in: ["PENDING", "PARTIALLY_PAID"] } };
  const [pendingBillsCount, pendingBillsAgg] = await Promise.all([
    prisma.vendorBill.count({ where: pendingBillsWhere }),
    prisma.vendorBill.aggregate({ where: pendingBillsWhere, _sum: { outstandingBalance: true } }),
  ]);

  const [totalInventoryItems, lowStockItems] = await Promise.all([
    prisma.inventory.count({ where: { companyId, projectId } }),
    prisma.inventory.count({ where: { companyId, projectId, status: { in: ["LOW", "CRITICAL", "OUT_OF_STOCK"] } } }),
  ]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const labourTodayCount = await prisma.labourAttendance.count({
    where: { companyId, projectId, isDeleted: false, attendanceDate: { gte: startOfDay }, status: "PRESENT" },
  });

  return {
    contractValue: project.contractValue.toString(),
    budget: budget.toFixed(2),
    actualCost: actualCost.toFixed(2),
    remainingBudget: (budget - actualCost).toFixed(2),
    completionPercent: project.progress,
    pendingVendorBills: { count: pendingBillsCount },
    pendingPayments: { amount: (pendingBillsAgg._sum.outstandingBalance ?? new Prisma.Decimal(0)).toString() },
    materialStock: { totalItems: totalInventoryItems, lowStockItems },
    labourToday: { count: labourTodayCount },
    budgetHeads,
    costHeads,
  };
}

/** Reports: Budget vs Actual (whole project), including the full per-cost-head breakdown. Physical Progress here is Project.progress — the existing, manually-set field. */
export async function getBudgetVsActualReport(projectId: string, companyId: string) {
  const project = await verifyProjectOwnership(projectId, companyId);
  const budgetHeads = await computeProjectBudgetHeads(companyId, projectId);
  const budget = Number(budgetHeads.total);
  const costHeads = await computeCostHeads(companyId, projectId);
  const actual = Number(costHeads.total);

  return {
    budget: budget.toFixed(2),
    actual: actual.toFixed(2),
    difference: (budget - actual).toFixed(2),
    ...compareProgress(project.progress, budget, actual),
    budgetHeads,
    costHeads,
  };
}

/** Reports: Cost by Sub Work — one row per Sub Work in the project. */
export async function getCostBySubWorkReport(projectId: string, companyId: string) {
  await verifyProjectOwnership(projectId, companyId);
  const subWorks = await prisma.subWork.findMany({ where: { companyId, projectId }, orderBy: { sortOrder: "asc" } });

  return Promise.all(
    subWorks.map(async (sw) => {
      const costHeads = await computeCostHeads(companyId, projectId, sw.id);
      const budgetHeads = sumBudgetHeads(sw);
      const budget = Number(budgetHeads.total);
      const actual = Number(costHeads.total);
      return {
        subWorkId: sw.id,
        name: sw.name,
        status: sw.status,
        budget: budget.toFixed(2),
        actual: actual.toFixed(2),
        difference: (budget - actual).toFixed(2),
        ...compareProgress(sw.physicalProgress, budget, actual),
        budgetHeads,
        costHeads,
      };
    })
  );
}

/** Reports: Monthly Cost — every cost-bearing record in the project, bucketed by month. */
export async function getMonthlyCostReport(projectId: string, companyId: string) {
  await verifyProjectOwnership(projectId, companyId);

  const [vendorBills, attendances, expenses] = await Promise.all([
    prisma.vendorBill.findMany({ where: { companyId, projectId }, select: { billDate: true, totalAmount: true } }),
    prisma.labourAttendance.findMany({ where: { companyId, projectId, isDeleted: false }, select: { attendanceDate: true, wageAmount: true } }),
    // labourPayment: null avoids double counting Expense rows created via LabourPayment's opt-in "log as expense"
    prisma.expense.findMany({ where: { companyId, projectId, isDeleted: false, labourPayment: null }, select: { expenseDate: true, amount: true } }),
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

/** Reports: Project Cost Summary — Budget vs Actual plus the full cost-head breakdown, whole project. */
export async function getProjectCostSummaryReport(projectId: string, companyId: string) {
  const budgetVsActual = await getBudgetVsActualReport(projectId, companyId);
  const costHeads = await computeCostHeads(companyId, projectId);
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

export async function exportCostBySubWorkToCSV(projectId: string, companyId: string) {
  const rows = await getCostBySubWorkReport(projectId, companyId);

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

/**
 * Project Workspace (Phase 2) — Payment Received / Balance Receivable, summed straight off
 * every non-Draft Running Bill raised against this Project (RunningBill.projectId is a direct
 * field, no need to join through Site). Same formula already used by getProjectExecutiveDashboard
 * and dashboard.service.ts's Project Overview table — never recomputed differently.
 */
export async function getProjectReceivables(projectId: string, companyId: string) {
  await verifyProjectOwnership(projectId, companyId);
  const agg = await prisma.runningBill.aggregate({
    where: { companyId, projectId, status: { not: "DRAFT" } },
    _sum: { amountReceived: true, outstandingAmount: true },
    _count: { _all: true },
  });
  return {
    paymentReceived: (Number(agg._sum.amountReceived) || 0).toFixed(2),
    balanceReceivable: (Number(agg._sum.outstandingAmount) || 0).toFixed(2),
    billsSubmitted: agg._count._all,
  };
}

/**
 * Project Workspace Overview tab. Work Order No./Date, Department and Expected Completion have
 * no Project-level column in the schema — they live on Site (relocated there from the removed
 * ProjectContractInfo model, see schema.prisma's Site model comment) — so this reads them off the
 * Project's earliest-created Site as the "primary" one. Honest for the common one-Site-per-Project
 * case; a multi-Site Project's Sites tab still shows every Site's own values individually.
 */
export async function getProjectOverviewSummary(projectId: string, companyId: string) {
  const [project, sitesResult, bva, receivables] = await Promise.all([
    getProjectById(projectId, companyId),
    listSites(companyId, { projectId, page: 1, limit: 100, sortBy: "createdAt", sortOrder: "asc" }),
    getBudgetVsActualReport(projectId, companyId),
    getProjectReceivables(projectId, companyId),
  ]);
  const primarySite = sitesResult.data[0] ?? null;

  return {
    id: project.id,
    name: project.name,
    code: project.code,
    status: project.status,
    client: project.client,
    agreementValue: project.contractValue.toString(),
    department: primarySite?.department ?? null,
    workOrderNumber: primarySite?.workOrderNumber ?? null,
    workOrderDate: primarySite?.workOrderDate ?? null,
    expectedCompletion: primarySite?.completionDate ?? null,
    paymentReceived: receivables.paymentReceived,
    balanceReceivable: receivables.balanceReceivable,
    physicalProgress: bva.physicalProgress,
    financialProgress: bva.financialProgress,
    siteCount: sitesResult.total,
  };
}

/** Project Workspace Sites tab — every Site's own Physical/Financial Progress, reusing site-control-center.service.ts's per-Site report (same acceptable small-N loop already used by dashboard.service.ts's Project Overview table). */
export async function getProjectSitesOverview(projectId: string, companyId: string) {
  await verifyProjectOwnership(projectId, companyId);
  const sitesResult = await listSites(companyId, { projectId, page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  return Promise.all(
    sitesResult.data.map(async (s) => {
      const siteBva = await getSiteBudgetVsActualReport(s.id, companyId);
      return {
        id: s.id,
        name: s.name,
        siteCode: s.siteCode,
        status: s.status,
        engineer: s.engineer,
        expectedCompletion: s.completionDate,
        physicalProgress: siteBva.physicalProgress,
        financialProgress: siteBva.financialProgress,
      };
    })
  );
}

/** Project Workspace Finance tab — composes the existing cost-summary report with the Running Bill receivable position and the Vendor Bill payable position already computed by getProjectOverview. Nothing here is recomputed a second way. */
export async function getProjectFinanceSummary(projectId: string, companyId: string) {
  const [costSummary, receivables, overview] = await Promise.all([
    getProjectCostSummaryReport(projectId, companyId),
    getProjectReceivables(projectId, companyId),
    getProjectOverview(projectId, companyId),
  ]);
  return {
    ...costSummary,
    paymentReceived: receivables.paymentReceived,
    balanceReceivable: receivables.balanceReceivable,
    billsSubmitted: receivables.billsSubmitted,
    pendingVendorBills: overview.pendingVendorBills,
    pendingPayments: overview.pendingPayments,
  };
}

export type ProjectTimelineEventType =
  | "PROJECT_CREATED"
  | "SITE_ADDED"
  | "EXPENSE_ADDED"
  | "RUNNING_BILL_SUBMITTED"
  | "PAYMENT_RECEIVED"
  | "DOCUMENT_UPLOADED";

export interface ProjectTimelineEvent {
  id: string;
  type: ProjectTimelineEventType;
  label: string;
  date: string;
  link?: string;
}

const TIMELINE_EVENT_LIMIT = 200;

/**
 * Project Workspace Timeline tab — a read-only, synthesized chronological feed. No dedicated
 * Timeline/ActivityLog model exists in the schema; this merges the createdAt/date fields every
 * relevant record already carries (Project, Site, Expense, RunningBill, RunningBillPayment,
 * Document), same pattern as getSiteMoneyFlow (site-control-center.service.ts).
 */
export async function getProjectTimeline(projectId: string, companyId: string): Promise<ProjectTimelineEvent[]> {
  const project = await verifyProjectOwnership(projectId, companyId);

  const [sites, expenses, bills, payments, documents] = await Promise.all([
    prisma.site.findMany({ where: { companyId, projectId }, select: { id: true, name: true, createdAt: true } }),
    prisma.expense.findMany({
      where: { companyId, projectId },
      select: { id: true, description: true, amount: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.runningBill.findMany({
      where: { companyId, projectId, submittedAt: { not: null } },
      select: { id: true, billNumber: true, submittedAt: true },
      orderBy: { submittedAt: "desc" },
      take: 50,
    }),
    prisma.runningBillPayment.findMany({
      where: { companyId, projectId },
      select: { id: true, paymentNumber: true, amount: true, createdAt: true, runningBillId: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.document.findMany({
      where: { companyId, projectId },
      select: { id: true, documentType: true, fileName: true, uploadedAt: true },
      orderBy: { uploadedAt: "desc" },
      take: 50,
    }),
  ]);

  const events: ProjectTimelineEvent[] = [
    { id: `project-${project.id}`, type: "PROJECT_CREATED", label: `Project "${project.name}" created`, date: project.createdAt.toISOString() },
    ...sites.map((s) => ({ id: `site-${s.id}`, type: "SITE_ADDED" as const, label: `Site "${s.name}" added`, date: s.createdAt.toISOString(), link: `/sites/${s.id}` })),
    ...expenses.map((e) => ({
      id: `expense-${e.id}`,
      type: "EXPENSE_ADDED" as const,
      label: `Expense recorded${e.description ? ` — ${e.description}` : ""} (₹${Number(e.amount).toLocaleString("en-IN")})`,
      date: e.createdAt.toISOString(),
    })),
    ...bills.map((b) => ({ id: `bill-${b.id}`, type: "RUNNING_BILL_SUBMITTED" as const, label: `Running Bill ${b.billNumber} submitted`, date: b.submittedAt!.toISOString(), link: `/running-bills/${b.id}` })),
    ...payments.map((p) => ({
      id: `payment-${p.id}`,
      type: "PAYMENT_RECEIVED" as const,
      label: `Payment received — ₹${Number(p.amount).toLocaleString("en-IN")} (${p.paymentNumber})`,
      date: p.createdAt.toISOString(),
      link: `/running-bills/${p.runningBillId}`,
    })),
    ...documents.map((d) => ({
      id: `doc-${d.id}`,
      type: "DOCUMENT_UPLOADED" as const,
      label: `Document uploaded — ${d.fileName || d.documentType}`,
      date: d.uploadedAt.toISOString(),
    })),
  ];

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events.slice(0, TIMELINE_EVENT_LIMIT);
}
