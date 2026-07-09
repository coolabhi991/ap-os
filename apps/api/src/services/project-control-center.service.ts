import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { getSubWorkById } from "./sub-work.service.js";

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
async function getSpecialCategoryIds(companyId: string) {
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

export type VarianceStatus = "ahead" | "on-track" | "behind";

/** Percentage points of slack before Physical vs Financial Progress is flagged as diverging. */
const VARIANCE_TOLERANCE = 10;

/**
 * Financial Progress (Actual Cost / Budget) is always computed on demand — it is never
 * treated as "Completion %". Physical Progress is a separate, manually-entered value
 * (SubWork.physicalProgress, or Project.progress at whole-project level) and the two are
 * always returned side by side, never collapsed into one number.
 */
function compareProgress(physicalProgress: number, budget: number, actual: number) {
  const financialProgress = budget > 0 ? Math.round((actual / budget) * 1000) / 10 : 0;
  const variance = Math.round((physicalProgress - financialProgress) * 10) / 10;
  const varianceStatus: VarianceStatus =
    variance > VARIANCE_TOLERANCE ? "ahead" : variance < -VARIANCE_TOLERANCE ? "behind" : "on-track";
  return { physicalProgress, financialProgress, variance, varianceStatus };
}

/** The Recapitulation Sheet for a single Sub Work: Budget, Actual, Difference, Physical vs Financial Progress, and the cost-head breakdown. */
export async function getSubWorkRecap(subWorkId: string, companyId: string) {
  const subWork = await getSubWorkById(subWorkId, companyId);
  const costHeads = await computeCostHeads(companyId, subWork.projectId, subWork.id);
  const budget = Number(subWork.budgetAmount);
  const actual = Number(costHeads.total);

  return {
    subWork,
    budget: budget.toFixed(2),
    actual: actual.toFixed(2),
    difference: (budget - actual).toFixed(2),
    ...compareProgress(subWork.physicalProgress, budget, actual),
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

  const budgetAgg = await prisma.subWork.aggregate({ where: { companyId, projectId }, _sum: { budgetAmount: true } });
  const budget = Number(budgetAgg._sum.budgetAmount ?? 0);

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
  };
}

/** Reports: Budget vs Actual (whole project). Physical Progress here is Project.progress — the existing, manually-set field. */
export async function getBudgetVsActualReport(projectId: string, companyId: string) {
  const project = await verifyProjectOwnership(projectId, companyId);
  const budgetAgg = await prisma.subWork.aggregate({ where: { companyId, projectId }, _sum: { budgetAmount: true } });
  const budget = Number(budgetAgg._sum.budgetAmount ?? 0);
  const costHeads = await computeCostHeads(companyId, projectId);
  const actual = Number(costHeads.total);

  return {
    budget: budget.toFixed(2),
    actual: actual.toFixed(2),
    difference: (budget - actual).toFixed(2),
    ...compareProgress(project.progress, budget, actual),
  };
}

/** Reports: Cost by Sub Work — one row per Sub Work in the project. */
export async function getCostBySubWorkReport(projectId: string, companyId: string) {
  await verifyProjectOwnership(projectId, companyId);
  const subWorks = await prisma.subWork.findMany({ where: { companyId, projectId }, orderBy: { sortOrder: "asc" } });

  return Promise.all(
    subWorks.map(async (sw) => {
      const costHeads = await computeCostHeads(companyId, projectId, sw.id);
      const budget = Number(sw.budgetAmount);
      const actual = Number(costHeads.total);
      return {
        subWorkId: sw.id,
        name: sw.name,
        status: sw.status,
        budget: budget.toFixed(2),
        actual: actual.toFixed(2),
        difference: (budget - actual).toFixed(2),
        ...compareProgress(sw.physicalProgress, budget, actual),
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

export async function exportCostBySubWorkToCSV(projectId: string, companyId: string) {
  const rows = await getCostBySubWorkReport(projectId, companyId);

  const headers = ["Sub Work", "Status", "Budget", "Actual", "Difference", "Physical Progress %", "Financial Progress %", "Variance"];
  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvRows = rows.map((r) =>
    [r.name, r.status, r.budget, r.actual, r.difference, `${r.physicalProgress}%`, `${r.financialProgress}%`, r.varianceStatus]
      .map((v) => escapeCsv(String(v)))
      .join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
}
