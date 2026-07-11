import prisma from "../config/prisma.js";
import { getOutstandingSummaryReport, getCashFlowReport, getReceivablesReport, getPayablesReport } from "./banking-reports.service.js";
import { getBudgetVsActualReport } from "./project-control-center.service.js";
import { listRunningBills } from "./running-bill.service.js";

const RECEIVABLES_PREVIEW = 5;
const PAYABLES_PREVIEW = 5;
const RUNNING_BILLS_PREVIEW = 5;
const RECEIVABLE_OVERDUE_DAYS = 30;

export interface ProjectHealthRow {
  id: string;
  name: string;
  status: string;
  contractValue: string;
  physicalProgress: number;
  financialProgress: number;
  varianceStatus: "ahead" | "on-track" | "behind";
  budget: string;
  actual: string;
  difference: string;
}

/**
 * Active/Planning projects with their Budget vs Actual figures, sourced entirely from
 * project-control-center.service.ts's own per-project computation (never recomputed here).
 * Shared by getControlCenter (Owner's Control Room) and ai-query.service.ts (AP AI) so the
 * budget/progress math is computed in exactly one place.
 */
export async function getProjectHealthList(companyId: string): Promise<ProjectHealthRow[]> {
  const projects = await prisma.project.findMany({
    where: { companyId, status: { in: ["PLANNING", "ACTIVE"] } },
    select: { id: true, name: true, status: true, progress: true, contractValue: true },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    projects.map(async (p) => {
      const bva = await getBudgetVsActualReport(p.id, companyId);
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        contractValue: p.contractValue.toString(),
        physicalProgress: bva.physicalProgress,
        financialProgress: bva.financialProgress,
        varianceStatus: bva.varianceStatus,
        budget: bva.budget,
        actual: bva.actual,
        difference: bva.difference,
      };
    })
  );
}

/**
 * The AP Control Center (Owner's Control Room) — composes data already computed by each
 * completed module's own service (Banking & Reconciliation, Running Bills, Project Control
 * Center, Vendor Bills) into a single read-only screen. Nothing here recomputes a financial
 * total itself; it only reads and arranges what those modules already produce.
 */
export async function getControlCenter(companyId: string) {
  const [projects, projectHealth, outstandingSummary, cashFlow, receivables, payables, runningBillsResult, runningBillStatusCounts, unmatchedTransactionCount] = await Promise.all([
    prisma.project.findMany({
      where: { companyId, status: { in: ["PLANNING", "ACTIVE"] } },
      select: { id: true, name: true, status: true, progress: true, contractValue: true },
      orderBy: { name: "asc" },
    }),
    getProjectHealthList(companyId),
    getOutstandingSummaryReport(companyId),
    getCashFlowReport(companyId),
    getReceivablesReport(companyId, {}),
    getPayablesReport(companyId, {}),
    listRunningBills(companyId, { page: 1, limit: RUNNING_BILLS_PREVIEW, sortBy: "billDate", sortOrder: "desc" }),
    prisma.runningBill.groupBy({ by: ["status"], where: { companyId }, _count: { _all: true } }),
    prisma.bankTransaction.count({ where: { companyId, reconciliationStatus: "UNMATCHED" } }),
  ]);

  const totalContractValue = projects.reduce((s, p) => s + Number(p.contractValue), 0);
  const overduePayables = payables.filter((p) => p.isOverdue);
  const overdueReceivables = receivables.filter((r) => r.daysOutstanding > RECEIVABLE_OVERDUE_DAYS);
  const behindProjects = projectHealth.filter((p) => p.varianceStatus === "behind");

  const alerts: { severity: "high" | "medium" | "low"; category: string; message: string; link: string }[] = [];

  if (overduePayables.length) {
    const amount = overduePayables.reduce((s, p) => s + Number(p.outstandingBalance), 0);
    alerts.push({
      severity: "high",
      category: "Payables",
      message: `${overduePayables.length} vendor bill${overduePayables.length === 1 ? "" : "s"} overdue — ₹${amount.toLocaleString("en-IN")}`,
      link: "/banking/reports",
    });
  }

  if (overdueReceivables.length) {
    const amount = overdueReceivables.reduce((s, r) => s + Number(r.outstandingAmount), 0);
    alerts.push({
      severity: "medium",
      category: "Receivables",
      message: `${overdueReceivables.length} Running Bill${overdueReceivables.length === 1 ? "" : "s"} outstanding past the expected payment date — ₹${amount.toLocaleString("en-IN")}`,
      link: "/running-bills/reports",
    });
  }

  if (behindProjects.length) {
    alerts.push({
      severity: "high",
      category: "Budget",
      message: `${behindProjects.length} project${behindProjects.length === 1 ? "" : "s"} running behind — actual cost is outpacing physical progress`,
      link: "/projects",
    });
  }

  if (unmatchedTransactionCount > 0) {
    alerts.push({
      severity: "low",
      category: "Reconciliation",
      message: `${unmatchedTransactionCount} bank transaction${unmatchedTransactionCount === 1 ? "" : "s"} awaiting reconciliation`,
      link: "/banking",
    });
  }

  return {
    kpis: {
      totalContractValue: totalContractValue.toFixed(2),
      totalCashAndBankBalance: outstandingSummary.totalCashAndBankBalance,
      totalReceivable: outstandingSummary.totalReceivable,
      totalPayable: outstandingSummary.totalPayable,
      overduePayable: outstandingSummary.overduePayable,
      netPosition: outstandingSummary.netPosition,
      activeProjectCount: projects.filter((p) => p.status === "ACTIVE").length,
    },
    cashFlow,
    projectHealth,
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
      statusCounts: Object.fromEntries(runningBillStatusCounts.map((r) => [r.status, r._count._all])),
      recent: runningBillsResult.data,
    },
    alerts,
  };
}
