import prisma from "../config/prisma.js";
import { getOutstandingSummaryReport, getCashFlowReport, getReceivablesReport, getPayablesReport } from "./banking-reports.service.js";
import { getBudgetVsActualReport } from "./project-control-center.service.js";
import { getSiteBudgetVsActualReport } from "./site-control-center.service.js";
import { listRunningBills } from "./running-bill.service.js";
import { listBankAccountsWithBalances } from "./bank-transaction.service.js";

const RECEIVABLES_PREVIEW = 5;
const PAYABLES_PREVIEW = 5;
const RUNNING_BILLS_PREVIEW = 5;
const RECEIVABLE_OVERDUE_DAYS = 30;

export interface ProjectSiteRow {
  id: string;
  name: string;
  siteCode: string;
  status: string;
  expectedCompletion: string | null;
  paymentReceived: string;
  billsSubmitted: number;
  pendingExpenses: string;
  physicalProgress: number;
  financialProgress: number;
}

export interface ProjectHealthRow {
  id: string;
  name: string;
  status: string;
  contractValue: string;
  received: string;
  pending: string;
  billsSubmitted: number;
  pendingBillPayment: string;
  physicalProgress: number;
  financialProgress: number;
  varianceStatus: "ahead" | "on-track" | "behind";
  budget: string;
  actual: string;
  difference: string;
  sites: ProjectSiteRow[];
}

function dayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Active/Planning projects with Budget vs Actual, Running Bill receivable position, and their
 * Sites — sourced from project-control-center.service.ts's own per-project computation (never
 * recomputed here) plus one batched Running Bill/Site/SubWork query each, avoiding N+1. Shared by
 * getControlCenter (Owner's Control Room) and ai-query.service.ts so the math lives in one place.
 */
export async function getProjectHealthList(companyId: string): Promise<ProjectHealthRow[]> {
  const projects = await prisma.project.findMany({
    where: { companyId, status: { in: ["PLANNING", "ACTIVE"] } },
    select: { id: true, name: true, status: true, progress: true, contractValue: true },
    orderBy: { name: "asc" },
  });
  const projectIds = projects.map((p) => p.id);

  const [receivableAgg, pendingBillByProject, sites] = await Promise.all([
    prisma.runningBill.groupBy({
      by: ["projectId"],
      where: { companyId, projectId: { in: projectIds }, status: { not: "DRAFT" } },
      _sum: { amountReceived: true, outstandingAmount: true },
      _count: { _all: true },
    }),
    prisma.vendorBill.groupBy({
      by: ["projectId"],
      where: { companyId, projectId: { in: projectIds } },
      _sum: { outstandingBalance: true },
    }),
    prisma.site.findMany({
      where: { companyId, projectId: { in: projectIds } },
      select: { id: true, name: true, siteCode: true, projectId: true, status: true, completionDate: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const siteIds = sites.map((s) => s.id);
  const [subWorkProgress, receivableBySite, pendingExpenseBySite] = siteIds.length
    ? await Promise.all([
        prisma.subWork.groupBy({ by: ["siteId"], where: { companyId, siteId: { in: siteIds } }, _avg: { physicalProgress: true } }),
        prisma.runningBill.groupBy({
          by: ["siteId"],
          where: { companyId, siteId: { in: siteIds }, status: { not: "DRAFT" } },
          _sum: { amountReceived: true },
          _count: { _all: true },
        }),
        prisma.vendorBill.groupBy({
          by: ["siteId"],
          where: { companyId, siteId: { in: siteIds } },
          _sum: { outstandingBalance: true },
        }),
      ])
    : [[], [], []];

  const progressBySite = new Map(subWorkProgress.map((s) => [s.siteId, Math.round(s._avg.physicalProgress ?? 0)]));
  const receivableByProject = new Map(receivableAgg.map((r) => [r.projectId, r]));
  const pendingBillByProjectMap = new Map(pendingBillByProject.map((r) => [r.projectId, r]));
  const receivableBySiteMap = new Map(receivableBySite.map((r) => [r.siteId, r]));
  const pendingExpenseBySiteMap = new Map(pendingExpenseBySite.map((r) => [r.siteId, r]));

  const siteFinancials = await Promise.all(sites.map((s) => getSiteBudgetVsActualReport(s.id, companyId)));
  const financialBySite = new Map(sites.map((s, i) => [s.id, siteFinancials[i]]));

  const sitesByProject = new Map<string, ProjectSiteRow[]>();
  for (const s of sites) {
    const rec = receivableBySiteMap.get(s.id);
    const exp = pendingExpenseBySiteMap.get(s.id);
    const row: ProjectSiteRow = {
      id: s.id,
      name: s.name,
      siteCode: s.siteCode ?? "",
      status: s.status,
      expectedCompletion: s.completionDate ? s.completionDate.toISOString().slice(0, 10) : null,
      paymentReceived: (Number(rec?._sum.amountReceived) || 0).toFixed(2),
      billsSubmitted: rec?._count._all ?? 0,
      pendingExpenses: (Number(exp?._sum.outstandingBalance) || 0).toFixed(2),
      physicalProgress: progressBySite.get(s.id) ?? 0,
      financialProgress: financialBySite.get(s.id)?.financialProgress ?? 0,
    };
    if (!sitesByProject.has(s.projectId)) sitesByProject.set(s.projectId, []);
    sitesByProject.get(s.projectId)!.push(row);
  }

  return Promise.all(
    projects.map(async (p) => {
      const bva = await getBudgetVsActualReport(p.id, companyId);
      const rec = receivableByProject.get(p.id);
      const pendingBill = pendingBillByProjectMap.get(p.id);
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        contractValue: p.contractValue.toString(),
        received: (Number(rec?._sum.amountReceived) || 0).toFixed(2),
        pending: (Number(rec?._sum.outstandingAmount) || 0).toFixed(2),
        billsSubmitted: rec?._count._all ?? 0,
        pendingBillPayment: (Number(pendingBill?._sum.outstandingBalance) || 0).toFixed(2),
        physicalProgress: bva.physicalProgress,
        financialProgress: bva.financialProgress,
        varianceStatus: bva.varianceStatus,
        budget: bva.budget,
        actual: bva.actual,
        difference: bva.difference,
        sites: sitesByProject.get(p.id) ?? [],
      };
    })
  );
}

/** Banking Summary — real bank/cash balances, today's real bank movement, and total Employee Advances (SITE_ADVANCE + PERSONAL_ADVANCE, all-time — this system has no separate advance-clearing workflow, so the running total is the honest figure). */
export async function getBankingSummary(companyId: string) {
  const { start, end } = dayBounds();
  const [accounts, todayAgg, advancesAgg] = await Promise.all([
    listBankAccountsWithBalances(companyId),
    prisma.bankTransaction.aggregate({
      where: { companyId, isActive: true, transactionDate: { gte: start, lte: end } },
      _sum: { deposit: true, withdrawal: true },
    }),
    prisma.transactionAllocation.aggregate({
      where: { companyId, allocationType: { in: ["SITE_ADVANCE", "PERSONAL_ADVANCE"] } },
      _sum: { amount: true },
    }),
  ]);

  const bankAccounts = accounts.filter((a) => a.accountType !== "CASH" && a.isActive);
  const cashAccounts = accounts.filter((a) => a.accountType === "CASH" && a.isActive);

  return {
    bankAccounts: bankAccounts.map((a) => ({ id: a.id, name: a.nickname || a.bankName, currentBalance: a.currentBalance, operationalBalance: a.operationalBalance })),
    totalBankBalance: bankAccounts.reduce((s, a) => s + Number(a.currentBalance), 0).toFixed(2),
    officeCash: cashAccounts.reduce((s, a) => s + Number(a.currentBalance), 0).toFixed(2),
    employeeAdvances: (Number(advancesAgg._sum.amount) || 0).toFixed(2),
    todayReceipts: (Number(todayAgg._sum.deposit) || 0).toFixed(2),
    todayPayments: (Number(todayAgg._sum.withdrawal) || 0).toFixed(2),
  };
}

/**
 * Government Summary — Running Bill counts by stage. "Under Correction" has no distinct
 * BillStatus in the schema (no bill-return/resubmit state exists yet) so it always reads 0 —
 * shown for completeness, not fabricated.
 */
export async function getGovernmentSummary(companyId: string) {
  const counts = await prisma.runningBill.groupBy({ by: ["status"], where: { companyId }, _count: { _all: true } });
  const map = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  return {
    billsReady: map.DRAFT ?? 0,
    submitted: map.SUBMITTED ?? 0,
    underCorrection: 0,
    awaitingPayment: map.PASSED ?? 0,
    partialPayments: map.PARTLY_PAID ?? 0,
  };
}

interface Alert {
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
  link: string;
}

async function computeAlerts(
  companyId: string,
  projectHealth: ProjectHealthRow[],
  payables: Awaited<ReturnType<typeof getPayablesReport>>,
  receivables: Awaited<ReturnType<typeof getReceivablesReport>>,
  unallocatedTransactionCount: number
): Promise<Alert[]> {
  const overduePayables = payables.filter((p) => p.isOverdue);
  const overdueReceivables = receivables.filter((r) => r.daysOutstanding > RECEIVABLE_OVERDUE_DAYS);
  const behindProjects = projectHealth.filter((p) => p.varianceStatus === "behind");
  const alerts: Alert[] = [];

  if (overduePayables.length) {
    const amount = overduePayables.reduce((s, p) => s + Number(p.outstandingBalance), 0);
    alerts.push({ severity: "high", category: "Payables", message: `${overduePayables.length} vendor bill${overduePayables.length === 1 ? "" : "s"} overdue — ₹${amount.toLocaleString("en-IN")}`, link: "/banking/reports" });
  }
  if (overdueReceivables.length) {
    const amount = overdueReceivables.reduce((s, r) => s + Number(r.outstandingAmount), 0);
    alerts.push({ severity: "medium", category: "Receivables", message: `${overdueReceivables.length} Running Bill${overdueReceivables.length === 1 ? "" : "s"} outstanding past the expected payment date — ₹${amount.toLocaleString("en-IN")}`, link: "/running-bills/reports" });
  }
  if (behindProjects.length) {
    alerts.push({ severity: "high", category: "Budget", message: `${behindProjects.length} project${behindProjects.length === 1 ? "" : "s"} running behind — actual cost is outpacing physical progress`, link: "/projects" });
  }
  if (unallocatedTransactionCount > 0) {
    alerts.push({ severity: "low", category: "Allocation", message: `${unallocatedTransactionCount} bank transaction${unallocatedTransactionCount === 1 ? "" : "s"} awaiting allocation`, link: "/banking" });
  }
  return alerts;
}

/** Owner's Desk — existing alerts bucketed by urgency (Critical/High/Normal), plus how much allocation work was done today vs. still outstanding, reusing the same signals as the Alerts panel. */
async function getOwnerDesk(companyId: string, alerts: Alert[]) {
  const { start, end } = dayBounds();
  const [completedToday, unallocated, partiallyAllocated] = await Promise.all([
    prisma.transactionAllocation.count({ where: { companyId, createdAt: { gte: start, lte: end } } }),
    prisma.bankTransaction.count({ where: { companyId, isActive: true, allocationStatus: "UNALLOCATED" } }),
    prisma.bankTransaction.count({ where: { companyId, isActive: true, allocationStatus: "PARTIALLY_ALLOCATED" } }),
  ]);

  return {
    critical: alerts.filter((a) => a.severity === "high"),
    high: alerts.filter((a) => a.severity === "medium"),
    normal: alerts.filter((a) => a.severity === "low"),
    completedToday,
    remainingToday: unallocated + partiallyAllocated,
  };
}

/**
 * The AP Control Center (Owner's Control Room / Business Control Center) — composes data already
 * computed by each completed module's own service into a single read-only screen. Nothing here
 * recomputes a financial total itself; it only reads and arranges what those modules already
 * produce.
 */
export async function getControlCenter(companyId: string) {
  const { start, end } = dayBounds();
  const [projects, projectHealth, outstandingSummary, cashFlow, receivables, payables, runningBillsResult, bankingSummary, governmentSummary, unallocatedTransactionCount, billsSubmittedToday, billsApprovedToday, activeSiteCount] = await Promise.all([
    prisma.project.findMany({
      where: { companyId, status: { in: ["PLANNING", "ACTIVE"] } },
      select: { id: true, status: true, contractValue: true },
    }),
    getProjectHealthList(companyId),
    getOutstandingSummaryReport(companyId),
    getCashFlowReport(companyId),
    getReceivablesReport(companyId, {}),
    getPayablesReport(companyId, {}),
    listRunningBills(companyId, { page: 1, limit: RUNNING_BILLS_PREVIEW, sortBy: "billDate", sortOrder: "desc" }),
    getBankingSummary(companyId),
    getGovernmentSummary(companyId),
    prisma.bankTransaction.count({ where: { companyId, isActive: true, allocationStatus: "UNALLOCATED" } }),
    prisma.runningBill.count({ where: { companyId, submittedAt: { gte: start, lte: end } } }),
    prisma.runningBill.count({ where: { companyId, passedAt: { gte: start, lte: end } } }),
    prisma.site.count({ where: { companyId, status: "ACTIVE" } }),
  ]);

  const totalContractValue = projects.reduce((s, p) => s + Number(p.contractValue), 0);
  const alerts = await computeAlerts(companyId, projectHealth, payables, receivables, unallocatedTransactionCount);
  const ownerDesk = await getOwnerDesk(companyId, alerts);

  return {
    kpis: {
      totalContractValue: totalContractValue.toFixed(2),
      totalCashAndBankBalance: outstandingSummary.totalCashAndBankBalance,
      totalReceivable: outstandingSummary.totalReceivable,
      totalPayable: outstandingSummary.totalPayable,
      overduePayable: outstandingSummary.overduePayable,
      netPosition: outstandingSummary.netPosition,
      activeProjectCount: projects.filter((p) => p.status === "ACTIVE").length,
      billsSubmittedToday,
      billsApprovedToday,
      activeSiteCount,
    },
    cashFlow,
    projectHealth,
    financialSummary: {
      governmentReceivable: outstandingSummary.totalReceivable,
      vendorPayable: outstandingSummary.totalPayable,
      cashPosition: outstandingSummary.totalCashAndBankBalance,
      netPosition: outstandingSummary.netPosition,
    },
    bankingSummary,
    governmentSummary,
    ownerDesk,
    receivables: {
      total: outstandingSummary.totalReceivable,
      count: outstandingSummary.receivableCount,
      preview: receivables.slice(0, RECEIVABLES_PREVIEW),
    },
    payables: {
      total: outstandingSummary.totalPayable,
      count: outstandingSummary.payableCount,
      overdueCount: outstandingSummary.overduePayableCount,
      overdueAmount: outstandingSummary.overduePayable,
      preview: payables.slice(0, PAYABLES_PREVIEW),
    },
    runningBills: {
      recent: runningBillsResult.data,
    },
    alerts,
  };
}
