import { getControlCenter, getProjectHealthList } from "./dashboard.service.js";
import { listBankAccountsWithBalances } from "./bank-transaction.service.js";
import { getCashFlowReport, getReceivablesReport, getPayablesReport } from "./banking-reports.service.js";
import { listRunningBills, getRunningBillRegisterReport, getPaymentRegisterReport, RB_STATUS_LABELS } from "./running-bill.service.js";
import { getProjectOverview } from "./project-control-center.service.js";
import { listProjects } from "./project.service.js";
import { listVendors, getVendorById } from "./vendor.service.js";
import { getVendorLedger } from "./vendor-payment.service.js";
import { listVendorBills } from "./vendor-bill.service.js";
import { getLabourDashboard } from "./labour-report.service.js";
import { listExpenses, getExpenseDashboard } from "./expense.service.js";
import { listMaterialIssues } from "./material-issue.service.js";
import { listDPRs } from "./dpr.service.js";
import { getPendingMBReport } from "./measurement-book.service.js";
import { getLowStockAlerts } from "./inventory.service.js";
import { listLiabilities } from "./liability.service.js";
import { listLiabilityRepayments } from "./liability-repayment.service.js";
import { getInterestPaidReport } from "./finance-reports.service.js";

/**
 * AP AI Foundation — Phase 1: the AI Integration Layer.
 *
 * This is NOT a chatbot and NEVER computes a financial value itself. Every intent handler
 * below does nothing but call an already-completed module's own service function (or, for
 * cross-module reads, do plain filtering/sorting/subtraction of numbers those services already
 * produced — e.g. "profit" = Contract Value (stored) minus Actual Cost (computed by
 * project-control-center.service.ts), never a new costing formula) and reshape the result into
 * a rich, renderable response. Intent matching is deliberately a transparent, deterministic
 * keyword scorer — not a black-box model — so every answer is traceable back to the exact
 * service call that produced it.
 */

export type AITone = "positive" | "negative" | "warning" | "neutral";

export interface AICard {
  label: string;
  value: string;
  tone?: AITone;
}

export interface AILink {
  label: string;
  href: string;
  kind: "project" | "running-bill" | "vendor" | "measurement-book" | "dpr" | "generic";
}

export interface AITableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
}

export interface AITable {
  columns: AITableColumn[];
  rows: Record<string, string>[];
}

export interface AIResponse {
  intentId: string;
  intentLabel: string;
  summary: string;
  cards?: AICard[];
  table?: AITable;
  links?: AILink[];
}

export interface AIIntentDefinition {
  id: string;
  label: string;
  keywords: string[];
  example: string;
  category: string;
}

interface Ctx {
  companyId: string;
  message: string;
}

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function projectLink(id: string, name: string): AILink {
  return { label: name, href: `/projects/${id}`, kind: "project" };
}
function runningBillLink(id: string, billNumber: string): AILink {
  return { label: billNumber, href: `/running-bills/${id}`, kind: "running-bill" };
}
function vendorLink(id: string, name: string): AILink {
  return { label: name, href: `/vendors/${id}`, kind: "vendor" };
}
function mbLink(id: string, mbNumber: string): AILink {
  return { label: mbNumber, href: `/measurement-books/${id}`, kind: "measurement-book" };
}

async function findMentionedProject(companyId: string, message: string) {
  const { data: projects } = await listProjects(companyId, { limit: 200 });
  const lower = message.toLowerCase();
  let best: { id: string; name: string } | null = null;
  for (const p of projects) {
    if (p.name && lower.includes(p.name.toLowerCase()) && (!best || p.name.length > best.name.length)) {
      best = { id: p.id, name: p.name };
    }
  }
  return { projects, match: best };
}

async function findMentionedVendor(companyId: string, message: string) {
  const { data: vendors } = await listVendors(companyId, { limit: 200 });
  const lower = message.toLowerCase();
  let best: { id: string; name: string } | null = null;
  for (const v of vendors) {
    if (v.name && lower.includes(v.name.toLowerCase()) && (!best || v.name.length > best.name.length)) {
      best = { id: v.id, name: v.name };
    }
  }
  return { vendors, match: best };
}

/** #1 / #30 — What needs my attention today? / Owner's Attention. Reuses the exact alerts the Control Center already computed. */
async function handleOwnersAttention({ companyId }: Ctx): Promise<AIResponse> {
  const cc = await getControlCenter(companyId);
  return {
    intentId: "owners-attention",
    intentLabel: "Owner's Attention",
    summary: cc.alerts.length
      ? `${cc.alerts.length} item${cc.alerts.length === 1 ? "" : "s"} need your attention.`
      : "Nothing needs your attention right now — all clear.",
    cards: cc.alerts.map((a) => ({ label: a.category, value: a.message, tone: a.severity === "high" ? "negative" : a.severity === "medium" ? "warning" : "neutral" })),
    links: cc.alerts.map((a) => ({ label: `Open ${a.category}`, href: a.link, kind: "generic" })),
  };
}

/** #2 — Show bank balance. */
async function handleBankBalance({ companyId }: Ctx): Promise<AIResponse> {
  const accounts = await listBankAccountsWithBalances(companyId);
  const total = accounts.filter((a) => a.isActive).reduce((s, a) => s + Number(a.currentBalance), 0);
  return {
    intentId: "bank-balance",
    intentLabel: "Bank Balance",
    summary: `Total cash + bank balance across ${accounts.length} account${accounts.length === 1 ? "" : "s"}: ${inr(total)}.`,
    table: {
      columns: [
        { key: "account", label: "Account" },
        { key: "type", label: "Type" },
        { key: "balance", label: "Balance", align: "right" },
      ],
      rows: accounts.map((a) => ({ account: a.nickname || a.bankName, type: a.accountType, balance: inr(a.currentBalance) })),
    },
    links: [{ label: "Open Banking", href: "/banking", kind: "generic" }],
  };
}

/** #3 — Show cash flow. */
async function handleCashFlow({ companyId }: Ctx): Promise<AIResponse> {
  const cf = await getCashFlowReport(companyId);
  return {
    intentId: "cash-flow",
    intentLabel: "Cash Flow",
    summary: `Net cash today ${inr(cf.today.net)}, this week ${inr(cf.weekly.net)}, this month ${inr(cf.monthly.net)}.`,
    cards: [
      { label: "Today", value: inr(cf.today.net), tone: Number(cf.today.net) >= 0 ? "positive" : "negative" },
      { label: "This Week", value: inr(cf.weekly.net), tone: Number(cf.weekly.net) >= 0 ? "positive" : "negative" },
      { label: "This Month", value: inr(cf.monthly.net), tone: Number(cf.monthly.net) >= 0 ? "positive" : "negative" },
      { label: "Expected Inflow", value: inr(cf.expectedInflow), tone: "positive" },
      { label: "Expected Outflow", value: inr(cf.expectedOutflow), tone: "warning" },
    ],
    links: [{ label: "Open Banking Reports", href: "/banking/reports", kind: "generic" }],
  };
}

/** #4 — Outstanding Running Bills. */
async function handleOutstandingRunningBills({ companyId }: Ctx): Promise<AIResponse> {
  const rows = await getReceivablesReport(companyId, {});
  const total = rows.reduce((s, r) => s + Number(r.outstandingAmount), 0);
  return {
    intentId: "outstanding-running-bills",
    intentLabel: "Outstanding Running Bills",
    summary: rows.length ? `${rows.length} Running Bill${rows.length === 1 ? "" : "s"} outstanding — ${inr(total)}.` : "No outstanding Running Bills.",
    table: {
      columns: [
        { key: "bill", label: "Bill #" },
        { key: "project", label: "Project" },
        { key: "outstanding", label: "Outstanding", align: "right" },
        { key: "days", label: "Days Outstanding", align: "right" },
      ],
      rows: rows.map((r) => ({ bill: r.billNumber, project: r.project?.name ?? "—", outstanding: inr(r.outstandingAmount), days: String(r.daysOutstanding) })),
    },
    links: rows.slice(0, 8).map((r) => runningBillLink(r.id, r.billNumber)),
  };
}

/** #5 — Vendor payments due. */
async function handleVendorPaymentsDue({ companyId }: Ctx): Promise<AIResponse> {
  const rows = await getPayablesReport(companyId, {});
  const total = rows.reduce((s, r) => s + Number(r.outstandingBalance), 0);
  return {
    intentId: "vendor-payments-due",
    intentLabel: "Vendor Payments Due",
    summary: rows.length ? `${rows.length} vendor bill${rows.length === 1 ? "" : "s"} due — ${inr(total)}.` : "No vendor payments due.",
    table: {
      columns: [
        { key: "bill", label: "Bill #" },
        { key: "vendor", label: "Vendor" },
        { key: "due", label: "Due Date" },
        { key: "outstanding", label: "Outstanding", align: "right" },
      ],
      rows: rows.map((r) => ({ bill: r.billNumber, vendor: r.vendor?.name ?? "—", due: r.dueDate || "—", outstanding: inr(r.outstandingBalance) })),
    },
    links: rows.slice(0, 8).filter((r) => r.vendor).map((r) => vendorLink(r.vendor!.id, r.vendor!.name)),
  };
}

/** #6 — Bills submitted this month. */
async function handleBillsSubmittedThisMonth({ companyId }: Ctx): Promise<AIResponse> {
  const all = await getRunningBillRegisterReport(companyId, { fromDate: startOfMonthISO(), toDate: todayISO() });
  const rows = all.filter((b) => b.status !== "DRAFT");
  const total = rows.reduce((s, b) => s + Number(b.currentCertifiedAmount), 0);
  return {
    intentId: "bills-submitted-month",
    intentLabel: "Bills Submitted This Month",
    summary: rows.length ? `${rows.length} Running Bill${rows.length === 1 ? "" : "s"} submitted this month — ${inr(total)} certified.` : "No Running Bills submitted this month.",
    table: {
      columns: [
        { key: "bill", label: "Bill #" },
        { key: "project", label: "Project" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" },
        { key: "amount", label: "Certified", align: "right" },
      ],
      rows: rows.map((b) => ({ bill: b.billNumber, project: b.project?.name ?? "—", date: b.billDate, status: RB_STATUS_LABELS[b.status] ?? b.status, amount: inr(b.currentCertifiedAmount) })),
    },
    links: rows.slice(0, 8).map((b) => runningBillLink(b.id, b.billNumber)),
  };
}

/** #7 — Payments received this month. */
async function handlePaymentsReceivedThisMonth({ companyId }: Ctx): Promise<AIResponse> {
  const rows = await getPaymentRegisterReport(companyId, { fromDate: startOfMonthISO(), toDate: todayISO() });
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  return {
    intentId: "payments-received-month",
    intentLabel: "Payments Received This Month",
    summary: rows.length ? `${rows.length} payment${rows.length === 1 ? "" : "s"} received this month — ${inr(total)}.` : "No payments received this month.",
    table: {
      columns: [
        { key: "payment", label: "Payment #" },
        { key: "bill", label: "Bill" },
        { key: "date", label: "Date" },
        { key: "amount", label: "Amount", align: "right" },
      ],
      rows: rows.map((r) => ({ payment: r.paymentNumber, bill: r.runningBill?.billNumber ?? "—", date: r.paymentDate, amount: inr(r.amount) })),
    },
  };
}

/** #8 — Labour today. */
async function handleLabourToday({ companyId }: Ctx): Promise<AIResponse> {
  const dash = await getLabourDashboard(companyId);
  return {
    intentId: "labour-today",
    intentLabel: "Labour Today",
    summary: `${dash.today.count} labour attendance record${dash.today.count === 1 ? "" : "s"} today — wages ${inr(dash.today.wageAmount)}.`,
    cards: [
      { label: "Present", value: String(dash.today.byStatus.PRESENT ?? 0), tone: "positive" },
      { label: "Absent", value: String(dash.today.byStatus.ABSENT ?? 0), tone: "negative" },
      { label: "Half Day", value: String(dash.today.byStatus.HALF_DAY ?? 0), tone: "warning" },
      { label: "On Leave", value: String(dash.today.byStatus.ON_LEAVE ?? 0), tone: "neutral" },
      { label: "Wages Today", value: inr(dash.today.wageAmount) },
    ],
    links: [{ label: "Open Labour", href: "/labour", kind: "generic" }],
  };
}

/** #9 — Site expenses today. */
async function handleSiteExpensesToday({ companyId }: Ctx): Promise<AIResponse> {
  const dash = await getExpenseDashboard(companyId);
  const { data: rows } = await listExpenses(companyId, { fromDate: todayISO(), toDate: todayISO(), limit: 20 });
  return {
    intentId: "site-expenses-today",
    intentLabel: "Site Expenses Today",
    summary: `${dash.today.count} expense${dash.today.count === 1 ? "" : "s"} logged today — ${inr(dash.today.amount)}.`,
    table: {
      columns: [
        { key: "number", label: "Expense #" },
        { key: "project", label: "Project" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount", align: "right" },
      ],
      rows: rows.map((e) => ({ number: e.expenseNumber, project: e.project?.name ?? "—", category: e.category?.name ?? "—", amount: inr(e.amount) })),
    },
    links: [{ label: "Open Site Expenses", href: "/expenses", kind: "generic" }],
  };
}

/** #10 — Material issued today. */
async function handleMaterialIssuedToday({ companyId }: Ctx): Promise<AIResponse> {
  const { data: rows, total } = await listMaterialIssues(companyId, { fromDate: todayISO(), toDate: todayISO(), limit: 50 });
  return {
    intentId: "material-issued-today",
    intentLabel: "Material Issued Today",
    summary: total ? `${total} material issue${total === 1 ? "" : "s"} today.` : "No material issued today.",
    table: {
      columns: [
        { key: "number", label: "Issue #" },
        { key: "item", label: "Item" },
        { key: "project", label: "Project" },
        { key: "quantity", label: "Quantity", align: "right" },
      ],
      rows: rows.map((r) => ({ number: r.issueNumber, item: r.itemName, project: r.project?.name ?? "—", quantity: `${r.quantity} ${r.unit}` })),
    },
    links: [{ label: "Open Material Issues", href: "/material-issues", kind: "generic" }],
  };
}

/** #11 — Projects over budget. */
async function handleProjectsOverBudget({ companyId }: Ctx): Promise<AIResponse> {
  const projects = (await getProjectHealthList(companyId)).filter((p) => Number(p.actual) > Number(p.budget));
  return {
    intentId: "projects-over-budget",
    intentLabel: "Projects Over Budget",
    summary: projects.length ? `${projects.length} project${projects.length === 1 ? "" : "s"} over budget.` : "No projects are over budget.",
    table: {
      columns: [
        { key: "project", label: "Project" },
        { key: "budget", label: "Budget", align: "right" },
        { key: "actual", label: "Actual", align: "right" },
        { key: "over", label: "Over By", align: "right" },
      ],
      rows: projects.map((p) => ({ project: p.name, budget: inr(p.budget), actual: inr(p.actual), over: inr(Math.abs(Number(p.difference))) })),
    },
    links: projects.map((p) => projectLink(p.id, p.name)),
  };
}

/** #12 — Projects behind schedule. */
async function handleProjectsBehindSchedule({ companyId }: Ctx): Promise<AIResponse> {
  const projects = (await getProjectHealthList(companyId)).filter((p) => p.varianceStatus === "behind");
  return {
    intentId: "projects-behind-schedule",
    intentLabel: "Projects Behind Schedule",
    summary: projects.length ? `${projects.length} project${projects.length === 1 ? "" : "s"} behind — cost is outpacing physical progress.` : "No projects are behind schedule.",
    table: {
      columns: [
        { key: "project", label: "Project" },
        { key: "physical", label: "Physical %", align: "right" },
        { key: "financial", label: "Financial %", align: "right" },
      ],
      rows: projects.map((p) => ({ project: p.name, physical: `${p.physicalProgress}%`, financial: `${p.financialProgress}%` })),
    },
    links: projects.map((p) => projectLink(p.id, p.name)),
  };
}

/** #13 / #25 — Budget vs Actual / Compare project costs. */
async function handleBudgetVsActual({ companyId }: Ctx): Promise<AIResponse> {
  const projects = await getProjectHealthList(companyId);
  return {
    intentId: "budget-vs-actual",
    intentLabel: "Budget vs Actual",
    summary: `Budget vs Actual across ${projects.length} project${projects.length === 1 ? "" : "s"}.`,
    table: {
      columns: [
        { key: "project", label: "Project" },
        { key: "budget", label: "Budget", align: "right" },
        { key: "actual", label: "Actual", align: "right" },
        { key: "difference", label: "Difference", align: "right" },
      ],
      rows: projects.map((p) => ({ project: p.name, budget: inr(p.budget), actual: inr(p.actual), difference: inr(p.difference) })),
    },
    links: projects.map((p) => projectLink(p.id, p.name)),
  };
}

/** #14 — Running Bills pending (Draft or Submitted, awaiting Pass). */
async function handleRunningBillsPending({ companyId }: Ctx): Promise<AIResponse> {
  const { data } = await listRunningBills(companyId, { limit: 100 });
  const rows = data.filter((b) => b.status === "DRAFT" || b.status === "SUBMITTED");
  return {
    intentId: "running-bills-pending",
    intentLabel: "Running Bills Pending",
    summary: rows.length ? `${rows.length} Running Bill${rows.length === 1 ? "" : "s"} pending (Draft or Submitted).` : "No Running Bills pending.",
    table: {
      columns: [
        { key: "bill", label: "Bill #" },
        { key: "project", label: "Project" },
        { key: "status", label: "Status" },
      ],
      rows: rows.map((b) => ({ bill: b.billNumber, project: b.project?.name ?? "—", status: RB_STATUS_LABELS[b.status] ?? b.status })),
    },
    links: rows.slice(0, 8).map((b) => runningBillLink(b.id, b.billNumber)),
  };
}

/** #15 — DPR pending (active projects with no DPR filed today). */
async function handleDPRPending({ companyId }: Ctx): Promise<AIResponse> {
  const [{ data: activeProjects }, { data: todaysDPRs }] = await Promise.all([
    listProjects(companyId, { status: "ACTIVE", limit: 200 }),
    listDPRs(companyId, { fromDate: todayISO(), toDate: todayISO(), limit: 200 }),
  ]);
  const filedProjectIds = new Set(todaysDPRs.map((d) => d.projectId));
  const missing = activeProjects.filter((p) => !filedProjectIds.has(p.id));
  return {
    intentId: "dpr-pending",
    intentLabel: "DPR Pending",
    summary: missing.length ? `${missing.length} active project${missing.length === 1 ? "" : "s"} have not filed today's DPR.` : "Every active project has filed today's DPR.",
    table: {
      columns: [{ key: "project", label: "Project" }],
      rows: missing.map((p) => ({ project: p.name })),
    },
    links: missing.map((p) => projectLink(p.id, p.name)),
  };
}

/** #16 — MB pending (not yet Approved). */
async function handleMBPending({ companyId }: Ctx): Promise<AIResponse> {
  const rows = await getPendingMBReport(companyId, {});
  return {
    intentId: "mb-pending",
    intentLabel: "Measurement Books Pending",
    summary: rows.length ? `${rows.length} Measurement Book${rows.length === 1 ? "" : "s"} not yet Approved.` : "No pending Measurement Books.",
    table: {
      columns: [
        { key: "mb", label: "MB #" },
        { key: "project", label: "Project" },
        { key: "status", label: "Status" },
        { key: "days", label: "Days Pending", align: "right" },
      ],
      rows: rows.map((r) => ({ mb: r.mbNumber, project: r.project?.name ?? "—", status: r.status, days: String(r.daysPending) })),
    },
    links: rows.slice(0, 8).map((r) => mbLink(r.id, r.mbNumber)),
  };
}

/** #17 — Low stock materials. */
async function handleLowStockMaterials({ companyId }: Ctx): Promise<AIResponse> {
  const rows = await getLowStockAlerts(companyId);
  return {
    intentId: "low-stock-materials",
    intentLabel: "Low Stock Materials",
    summary: rows.length ? `${rows.length} item${rows.length === 1 ? "" : "s"} at or below reorder level.` : "No items are low on stock.",
    table: {
      columns: [
        { key: "item", label: "Item" },
        { key: "project", label: "Project" },
        { key: "stock", label: "Current Stock", align: "right" },
        { key: "status", label: "Status" },
      ],
      rows: rows.map((r) => ({ item: r.itemName, project: r.project?.name ?? "—", stock: `${r.currentStock} ${r.unit}`, status: r.status })),
    },
    links: [{ label: "Open Inventory", href: "/inventory", kind: "generic" }],
  };
}

/** #18 — Top 10 expenses. */
async function handleTopExpenses({ companyId }: Ctx): Promise<AIResponse> {
  const { data: rows } = await listExpenses(companyId, { sortBy: "amount", sortOrder: "desc", limit: 10 });
  return {
    intentId: "top-expenses",
    intentLabel: "Top 10 Expenses",
    summary: `Top ${rows.length} expense${rows.length === 1 ? "" : "s"} by amount.`,
    table: {
      columns: [
        { key: "number", label: "Expense #" },
        { key: "project", label: "Project" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount", align: "right" },
      ],
      rows: rows.map((e) => ({ number: e.expenseNumber, project: e.project?.name ?? "—", category: e.category?.name ?? "—", amount: inr(e.amount) })),
    },
  };
}

/** #19 / #20 — Cash expected this week / this month. Both read the same Expected Inflow/Outflow figures Banking already computes (there is no separate week- or month-bucketed "expected" calculation to draw from — see getCashFlowReport). */
async function handleCashExpected({ companyId }: Ctx): Promise<AIResponse> {
  const cf = await getCashFlowReport(companyId);
  return {
    intentId: "cash-expected",
    intentLabel: "Cash Expected",
    summary: `Expected inflow ${inr(cf.expectedInflow)} (from outstanding Running Bills), expected outflow ${inr(cf.expectedOutflow)} (from outstanding Vendor Bills).`,
    cards: [
      { label: "Expected Inflow", value: inr(cf.expectedInflow), tone: "positive" },
      { label: "Expected Outflow", value: inr(cf.expectedOutflow), tone: "warning" },
    ],
    links: [{ label: "Open Banking Reports", href: "/banking/reports", kind: "generic" }],
  };
}

/** #21 — Receivables. */
async function handleReceivables(ctx: Ctx): Promise<AIResponse> {
  const r = await handleOutstandingRunningBills(ctx);
  return { ...r, intentId: "receivables", intentLabel: "Receivables" };
}

/** #22 — Payables. */
async function handlePayables(ctx: Ctx): Promise<AIResponse> {
  const r = await handleVendorPaymentsDue(ctx);
  return { ...r, intentId: "payables", intentLabel: "Payables" };
}

/** #23 — Profit by project. Profit = Contract Value (stored) − Actual Cost (computed by project-control-center.service.ts) — a plain subtraction of two already-computed figures, not a new costing formula. */
async function handleProfitByProject({ companyId }: Ctx): Promise<AIResponse> {
  const projects = await getProjectHealthList(companyId);
  const withProfit = projects
    .map((p) => ({ ...p, profit: Number(p.contractValue) - Number(p.actual) }))
    .sort((a, b) => b.profit - a.profit);
  return {
    intentId: "profit-by-project",
    intentLabel: "Profit by Project",
    summary: "Profit shown here is Contract Value minus Actual Cost — not a full P&L.",
    table: {
      columns: [
        { key: "project", label: "Project" },
        { key: "contract", label: "Contract Value", align: "right" },
        { key: "actual", label: "Actual Cost", align: "right" },
        { key: "profit", label: "Profit", align: "right" },
      ],
      rows: withProfit.map((p) => ({ project: p.name, contract: inr(p.contractValue), actual: inr(p.actual), profit: inr(p.profit) })),
    },
    links: withProfit.map((p) => projectLink(p.id, p.name)),
  };
}

/** #24 — Most expensive project. */
async function handleMostExpensiveProject({ companyId }: Ctx): Promise<AIResponse> {
  const projects = (await getProjectHealthList(companyId)).sort((a, b) => Number(b.actual) - Number(a.actual));
  const top = projects[0];
  return {
    intentId: "most-expensive-project",
    intentLabel: "Most Expensive Project",
    summary: top ? `${top.name} has the highest actual cost — ${inr(top.actual)}.` : "No active projects to compare.",
    cards: top ? [
      { label: "Project", value: top.name },
      { label: "Actual Cost", value: inr(top.actual) },
      { label: "Budget", value: inr(top.budget) },
    ] : [],
    links: top ? [projectLink(top.id, top.name)] : [],
  };
}

/** #26 — Show project health. */
async function handleProjectHealth(ctx: Ctx): Promise<AIResponse> {
  const r = await handleBudgetVsActual(ctx);
  return { ...r, intentId: "project-health", intentLabel: "Project Health" };
}

/** #27 — Show project summary (for the project mentioned in the message; otherwise asks which one). */
async function handleProjectSummary({ companyId, message }: Ctx): Promise<AIResponse> {
  const { projects, match } = await findMentionedProject(companyId, message);
  if (!match) {
    return {
      intentId: "project-summary",
      intentLabel: "Project Summary",
      summary: "Which project? Mention its name, e.g. \"Show project summary for <project name>\".",
      links: projects.slice(0, 15).map((p) => projectLink(p.id, p.name)),
    };
  }
  const overview = await getProjectOverview(match.id, companyId);
  return {
    intentId: "project-summary",
    intentLabel: "Project Summary",
    summary: `${match.name} — ${overview.completionPercent}% complete, ${inr(overview.actualCost)} spent of ${inr(overview.budget)} budget.`,
    cards: [
      { label: "Contract Value", value: inr(overview.contractValue) },
      { label: "Budget", value: inr(overview.budget) },
      { label: "Actual Cost", value: inr(overview.actualCost) },
      { label: "Remaining Budget", value: inr(overview.remainingBudget), tone: Number(overview.remainingBudget) >= 0 ? "positive" : "negative" },
      { label: "Completion", value: `${overview.completionPercent}%` },
      { label: "Pending Vendor Bills", value: `${overview.pendingVendorBills.count} (${inr(overview.pendingPayments.amount)})`, tone: overview.pendingVendorBills.count > 0 ? "warning" : "positive" },
      { label: "Labour Today", value: String(overview.labourToday.count) },
      { label: "Low Stock Items", value: String(overview.materialStock.lowStockItems), tone: overview.materialStock.lowStockItems > 0 ? "warning" : "positive" },
    ],
    links: [projectLink(match.id, match.name)],
  };
}

/** #28 — Show vendor summary (for the vendor mentioned in the message; otherwise asks which one). */
async function handleVendorSummary({ companyId, message }: Ctx): Promise<AIResponse> {
  const { vendors, match } = await findMentionedVendor(companyId, message);
  if (!match) {
    return {
      intentId: "vendor-summary",
      intentLabel: "Vendor Summary",
      summary: "Which vendor? Mention its name, e.g. \"Show vendor summary for <vendor name>\".",
      links: vendors.slice(0, 15).map((v) => vendorLink(v.id, v.name)),
    };
  }
  const [vendor, ledger, openBills] = await Promise.all([
    getVendorById(match.id, companyId),
    getVendorLedger(companyId, match.id, {}),
    listVendorBills(companyId, { vendorId: match.id, limit: 10 }),
  ]);
  return {
    intentId: "vendor-summary",
    intentLabel: "Vendor Summary",
    summary: `${vendor.name} — total billed ${inr(ledger.totalBilled)}, paid ${inr(ledger.totalPaid)}, outstanding ${inr(ledger.outstandingBalance)}.`,
    cards: [
      { label: "Category", value: vendor.category || "—" },
      { label: "Status", value: vendor.status },
      { label: "Total Billed", value: inr(ledger.totalBilled) },
      { label: "Total Paid", value: inr(ledger.totalPaid) },
      { label: "Outstanding", value: inr(ledger.outstandingBalance), tone: Number(ledger.outstandingBalance) > 0 ? "warning" : "positive" },
    ],
    table: {
      columns: [
        { key: "bill", label: "Bill #" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" },
        { key: "outstanding", label: "Outstanding", align: "right" },
      ],
      rows: openBills.data.map((b) => ({ bill: b.billNumber, date: b.billDate, status: b.status, outstanding: inr(b.outstandingBalance) })),
    },
    links: [vendorLink(vendor.id, vendor.name)],
  };
}

/** Finance #1 — How much Home Loan is outstanding? */
async function handleHomeLoanOutstanding({ companyId }: Ctx): Promise<AIResponse> {
  const { data } = await listLiabilities(companyId, { liabilityType: "HOME_LOAN", limit: 100 });
  const total = data.reduce((s, l) => s + Number(l.outstandingAmount), 0);
  return {
    intentId: "home-loan-outstanding",
    intentLabel: "Home Loan Outstanding",
    summary: data.length
      ? `Home Loan outstanding: ${inr(total)} across ${data.length} loan${data.length === 1 ? "" : "s"}.`
      : "No Home Loan recorded in Finance.",
    cards: data.map((l) => ({ label: l.loanName, value: inr(l.outstandingAmount), tone: Number(l.outstandingAmount) > 0 ? "warning" : "positive" })),
    links: [{ label: "Open Finance", href: "/finance", kind: "generic" }],
  };
}

/** Finance #2 — How much CC interest paid this year? */
async function handleCCInterestPaidThisYear({ companyId }: Ctx): Promise<AIResponse> {
  const d = new Date();
  const fromDate = new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const report = await getInterestPaidReport(companyId, { fromDate });
  const ccRow = report.byLiabilityType.find((r) => r.liabilityType === "CREDIT_CARD");
  const ccInterest = ccRow ? Number(ccRow.interestPaid) : 0;
  return {
    intentId: "cc-interest-paid-year",
    intentLabel: "CC Interest Paid This Year",
    summary: `Credit Card interest paid this year: ${inr(ccInterest)}.`,
    cards: [
      { label: "CC Interest Paid (This Year)", value: inr(ccInterest), tone: "warning" },
      { label: "Total Interest Paid (All Liabilities, This Year)", value: inr(report.thisYearInterestPaid) },
    ],
    links: [{ label: "Open Finance — Interest History", href: "/finance", kind: "generic" }],
  };
}

/** Finance #3 — How much Gold Loan is pending? */
async function handleGoldLoanPending({ companyId }: Ctx): Promise<AIResponse> {
  const { data } = await listLiabilities(companyId, { liabilityType: "GOLD_LOAN", limit: 100 });
  const total = data.reduce((s, l) => s + Number(l.outstandingAmount), 0);
  return {
    intentId: "gold-loan-pending",
    intentLabel: "Gold Loan Pending",
    summary: data.length
      ? `Gold Loan pending: ${inr(total)} across ${data.length} loan${data.length === 1 ? "" : "s"}.`
      : "No Gold Loan recorded in Finance.",
    cards: data.map((l) => ({ label: l.loanName, value: inr(l.outstandingAmount), tone: Number(l.outstandingAmount) > 0 ? "warning" : "positive" })),
    links: [{ label: "Open Finance", href: "/finance", kind: "generic" }],
  };
}

/** Finance #4 — Which bank account paid the Car Loan EMI? */
async function handleCarLoanEMIBank({ companyId }: Ctx): Promise<AIResponse> {
  const { data: carLoans } = await listLiabilities(companyId, { liabilityType: "CAR_LOAN", limit: 100 });
  const carLoanIds = new Set(carLoans.map((l) => l.id));
  const { data: repayments } = await listLiabilityRepayments(companyId, { liabilityType: "CAR_LOAN", limit: 200 });
  const relevant = repayments.filter((r) => carLoanIds.has(r.liabilityId));
  return {
    intentId: "car-loan-emi-bank",
    intentLabel: "Car Loan EMI — Bank Account",
    summary: relevant.length
      ? `Car Loan EMI has been paid from: ${Array.from(new Set(relevant.map((r) => r.companyBankAccount?.nickname || r.companyBankAccount?.bankName))).join(", ")}.`
      : "No Car Loan repayments recorded yet.",
    table: {
      columns: [
        { key: "date", label: "Date" },
        { key: "loan", label: "Loan" },
        { key: "bank", label: "Bank Account" },
        { key: "amount", label: "Amount", align: "right" },
      ],
      rows: relevant.slice(0, 10).map((r) => ({
        date: r.paymentDate,
        loan: r.liability?.loanName ?? "",
        bank: r.companyBankAccount?.nickname || r.companyBankAccount?.bankName || "",
        amount: inr(r.totalPaid),
      })),
    },
    links: [{ label: "Open Finance — Repayment History", href: "/finance", kind: "generic" }],
  };
}

/** Finance #5 — How much money borrowed from friends? */
async function handleFriendLoanBorrowed({ companyId }: Ctx): Promise<AIResponse> {
  const { data } = await listLiabilities(companyId, { liabilityType: "FRIEND_LOAN", limit: 100 });
  const totalBorrowed = data.reduce((s, l) => s + Number(l.sanctionAmount), 0);
  const totalOutstanding = data.reduce((s, l) => s + Number(l.outstandingAmount), 0);
  return {
    intentId: "friend-loan-borrowed",
    intentLabel: "Borrowed From Friends",
    summary: data.length
      ? `Borrowed from friends: ${inr(totalBorrowed)} total, ${inr(totalOutstanding)} still outstanding.`
      : "No Friend Loan recorded in Finance.",
    cards: [
      { label: "Total Borrowed", value: inr(totalBorrowed) },
      { label: "Still Outstanding", value: inr(totalOutstanding), tone: Number(totalOutstanding) > 0 ? "warning" : "positive" },
    ],
    links: [{ label: "Open Finance", href: "/finance", kind: "generic" }],
  };
}

/** Finance #6 — Show all loan repayments this month. */
async function handleLoanRepaymentsThisMonth({ companyId }: Ctx): Promise<AIResponse> {
  const { data } = await listLiabilityRepayments(companyId, { fromDate: startOfMonthISO(), toDate: todayISO(), limit: 200 });
  const total = data.reduce((s, r) => s + Number(r.totalPaid), 0);
  return {
    intentId: "loan-repayments-month",
    intentLabel: "Loan Repayments This Month",
    summary: data.length
      ? `${data.length} repayment${data.length === 1 ? "" : "s"} this month totalling ${inr(total)}.`
      : "No loan repayments recorded this month.",
    table: {
      columns: [
        { key: "date", label: "Date" },
        { key: "loan", label: "Loan" },
        { key: "principal", label: "Principal", align: "right" },
        { key: "interest", label: "Interest", align: "right" },
        { key: "total", label: "Total", align: "right" },
      ],
      rows: data.map((r) => ({
        date: r.paymentDate,
        loan: r.liability?.loanName ?? "",
        principal: inr(r.principalPaid),
        interest: inr(r.interestPaid),
        total: inr(r.totalPaid),
      })),
    },
    links: [{ label: "Open Finance — Repayment History", href: "/finance", kind: "generic" }],
  };
}

/** #29 — Show today's summary (composite, entirely re-reading intents 3/8/9/10/15's own sources). */
async function handleTodaysSummary({ companyId }: Ctx): Promise<AIResponse> {
  const [cf, labour, expenseDash, materials, dprs, activeProjects] = await Promise.all([
    getCashFlowReport(companyId),
    getLabourDashboard(companyId),
    getExpenseDashboard(companyId),
    listMaterialIssues(companyId, { fromDate: todayISO(), toDate: todayISO(), limit: 1 }),
    listDPRs(companyId, { fromDate: todayISO(), toDate: todayISO(), limit: 200 }),
    listProjects(companyId, { status: "ACTIVE", limit: 200 }),
  ]);
  return {
    intentId: "todays-summary",
    intentLabel: "Today's Summary",
    summary: `Today: net cash ${inr(cf.today.net)}, ${labour.today.count} labour present, ${expenseDash.today.count} expenses logged, ${materials.total} material issues, ${dprs.data.length}/${activeProjects.data.length} active projects filed a DPR.`,
    cards: [
      { label: "Net Cash Today", value: inr(cf.today.net), tone: Number(cf.today.net) >= 0 ? "positive" : "negative" },
      { label: "Labour Present", value: String(labour.today.byStatus.PRESENT ?? 0) },
      { label: "Site Expenses Today", value: inr(expenseDash.today.amount) },
      { label: "Material Issues Today", value: String(materials.total) },
      { label: "DPRs Filed / Active Projects", value: `${dprs.data.length} / ${activeProjects.data.length}`, tone: dprs.data.length >= activeProjects.data.length ? "positive" : "warning" },
    ],
  };
}

const INTENT_HANDLERS: Record<string, (ctx: Ctx) => Promise<AIResponse>> = {
  "owners-attention": handleOwnersAttention,
  "bank-balance": handleBankBalance,
  "cash-flow": handleCashFlow,
  "outstanding-running-bills": handleOutstandingRunningBills,
  "vendor-payments-due": handleVendorPaymentsDue,
  "bills-submitted-month": handleBillsSubmittedThisMonth,
  "payments-received-month": handlePaymentsReceivedThisMonth,
  "labour-today": handleLabourToday,
  "site-expenses-today": handleSiteExpensesToday,
  "material-issued-today": handleMaterialIssuedToday,
  "projects-over-budget": handleProjectsOverBudget,
  "projects-behind-schedule": handleProjectsBehindSchedule,
  "budget-vs-actual": handleBudgetVsActual,
  "running-bills-pending": handleRunningBillsPending,
  "dpr-pending": handleDPRPending,
  "mb-pending": handleMBPending,
  "low-stock-materials": handleLowStockMaterials,
  "top-expenses": handleTopExpenses,
  "cash-expected": handleCashExpected,
  receivables: handleReceivables,
  payables: handlePayables,
  "profit-by-project": handleProfitByProject,
  "most-expensive-project": handleMostExpensiveProject,
  "compare-project-costs": handleBudgetVsActual,
  "project-health": handleProjectHealth,
  "project-summary": handleProjectSummary,
  "vendor-summary": handleVendorSummary,
  "todays-summary": handleTodaysSummary,
  "home-loan-outstanding": handleHomeLoanOutstanding,
  "cc-interest-paid-year": handleCCInterestPaidThisYear,
  "gold-loan-pending": handleGoldLoanPending,
  "car-loan-emi-bank": handleCarLoanEMIBank,
  "friend-loan-borrowed": handleFriendLoanBorrowed,
  "loan-repayments-month": handleLoanRepaymentsThisMonth,
};

/** The First 30 Capabilities — one catalogue entry per user-facing question; several share a handler (e.g. #1/#30, #21/#4, #22/#5, #13/#25/#26) since they read the exact same underlying data. */
export const AI_INTENTS: AIIntentDefinition[] = [
  { id: "owners-attention", label: "What needs my attention today?", example: "What needs my attention today?", category: "Attention", keywords: ["what needs my attention today", "needs my attention", "attention today"] },
  { id: "bank-balance", label: "Show bank balance", example: "Show bank balance", category: "Banking", keywords: ["show bank balance", "bank balance", "bank balances"] },
  { id: "cash-flow", label: "Show cash flow", example: "Show cash flow", category: "Banking", keywords: ["show cash flow", "cash flow"] },
  { id: "outstanding-running-bills", label: "Outstanding Running Bills", example: "Outstanding Running Bills", category: "Running Bills", keywords: ["outstanding running bills", "running bills outstanding"] },
  { id: "vendor-payments-due", label: "Vendor payments due", example: "Vendor payments due", category: "Payables", keywords: ["vendor payments due", "payments due"] },
  { id: "bills-submitted-month", label: "Bills submitted this month", example: "Bills submitted this month", category: "Running Bills", keywords: ["bills submitted this month", "submitted this month"] },
  { id: "payments-received-month", label: "Payments received this month", example: "Payments received this month", category: "Running Bills", keywords: ["payments received this month", "received this month"] },
  { id: "labour-today", label: "Labour today", example: "Labour today", category: "Labour", keywords: ["labour today", "labor today"] },
  { id: "site-expenses-today", label: "Site expenses today", example: "Site expenses today", category: "Expenses", keywords: ["site expenses today", "expenses today"] },
  { id: "material-issued-today", label: "Material issued today", example: "Material issued today", category: "Inventory", keywords: ["material issued today", "materials issued today"] },
  { id: "projects-over-budget", label: "Projects over budget", example: "Projects over budget", category: "Budget", keywords: ["projects over budget", "over budget"] },
  { id: "projects-behind-schedule", label: "Projects behind schedule", example: "Projects behind schedule", category: "Project Health", keywords: ["projects behind schedule", "behind schedule"] },
  { id: "budget-vs-actual", label: "Budget vs Actual", example: "Budget vs Actual", category: "Budget", keywords: ["budget vs actual", "budget versus actual"] },
  { id: "running-bills-pending", label: "Running Bills pending", example: "Running Bills pending", category: "Running Bills", keywords: ["running bills pending", "pending running bills"] },
  { id: "dpr-pending", label: "DPR pending", example: "DPR pending", category: "DPR", keywords: ["dpr pending", "pending dpr", "pending dprs"] },
  { id: "mb-pending", label: "MB pending", example: "MB pending", category: "Measurement Books", keywords: ["mb pending", "pending mb", "measurement book pending", "pending measurement books"] },
  { id: "low-stock-materials", label: "Low stock materials", example: "Low stock materials", category: "Inventory", keywords: ["low stock materials", "low stock", "materials low on stock"] },
  { id: "top-expenses", label: "Top 10 expenses", example: "Top 10 expenses", category: "Expenses", keywords: ["top 10 expenses", "top expenses", "biggest expenses"] },
  { id: "cash-expected", label: "Cash expected this week", example: "Cash expected this week", category: "Banking", keywords: ["cash expected this week", "cash expected this month", "expected this week", "expected this month", "cash expected"] },
  { id: "receivables", label: "Receivables", example: "Receivables", category: "Receivables", keywords: ["receivables", "receivable report"] },
  { id: "payables", label: "Payables", example: "Payables", category: "Payables", keywords: ["payables", "payable report"] },
  { id: "profit-by-project", label: "Profit by project", example: "Profit by project", category: "Budget", keywords: ["profit by project", "project profit"] },
  { id: "most-expensive-project", label: "Most expensive project", example: "Most expensive project", category: "Budget", keywords: ["most expensive project", "highest cost project"] },
  { id: "compare-project-costs", label: "Compare project costs", example: "Compare project costs", category: "Budget", keywords: ["compare project costs", "compare projects"] },
  { id: "project-health", label: "Show project health", example: "Show project health", category: "Project Health", keywords: ["show project health", "project health"] },
  { id: "project-summary", label: "Show project summary", example: "Show project summary for", category: "Projects", keywords: ["show project summary", "project summary"] },
  { id: "vendor-summary", label: "Show vendor summary", example: "Show vendor summary for", category: "Vendors", keywords: ["show vendor summary", "vendor summary"] },
  { id: "todays-summary", label: "Show today's summary", example: "Show today's summary", category: "Attention", keywords: ["show today's summary", "todays summary", "today's summary"] },
  { id: "owners-attention-2", label: "Owner's Attention", example: "Owner's Attention", category: "Attention", keywords: ["owner's attention", "owners attention"] },
  { id: "home-loan-outstanding", label: "How much Home Loan is outstanding?", example: "How much Home Loan is outstanding?", category: "Finance", keywords: ["home loan outstanding", "home loan is outstanding", "home loan pending", "how much home loan"] },
  { id: "cc-interest-paid-year", label: "How much CC interest paid this year?", example: "How much CC interest paid this year?", category: "Finance", keywords: ["cc interest paid this year", "credit card interest paid this year", "cc interest paid", "credit card interest"] },
  { id: "gold-loan-pending", label: "How much Gold Loan is pending?", example: "How much Gold Loan is pending?", category: "Finance", keywords: ["gold loan pending", "gold loan is pending", "gold loan outstanding", "how much gold loan"] },
  { id: "car-loan-emi-bank", label: "Which bank account paid the Car Loan EMI?", example: "Which bank account paid the Car Loan EMI?", category: "Finance", keywords: ["bank account paid the car loan", "car loan emi", "which bank paid car loan"] },
  { id: "friend-loan-borrowed", label: "How much money borrowed from friends?", example: "How much money borrowed from friends?", category: "Finance", keywords: ["borrowed from friends", "money borrowed from friends", "friend loan"] },
  { id: "loan-repayments-month", label: "Show all loan repayments this month", example: "Show all loan repayments this month", category: "Finance", keywords: ["loan repayments this month", "show all loan repayments", "repayments this month"] },
];

// #14/#30 catalogue entry "owners-attention-2" reuses the same handler as "owners-attention".
INTENT_HANDLERS["owners-attention-2"] = handleOwnersAttention;

function scoreIntent(message: string, intent: AIIntentDefinition): number {
  const lower = message.toLowerCase();
  let score = 0;
  for (const kw of intent.keywords) {
    if (lower.includes(kw)) score += kw.split(" ").length;
  }
  return score;
}

export function matchIntent(message: string): AIIntentDefinition | null {
  const scored = AI_INTENTS.map((intent) => ({ intent, score: scoreIntent(message, intent) })).filter((s) => s.score > 0);
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  return scored[0].intent;
}

/** Main entry point — matches the message to one of the First 30 Capabilities and dispatches to its handler. Every handler only reads from existing module services. */
export async function answerQuery(companyId: string, message: string): Promise<AIResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { intentId: "empty", intentLabel: "Empty", summary: "Ask me something — try one of the suggested questions below." };
  }

  const intent = matchIntent(trimmed);
  if (!intent) {
    return {
      intentId: "unrecognized",
      intentLabel: "Not sure",
      summary: "I don't have that capability yet. AP AI currently answers a fixed set of questions — try one of the suggestions below.",
    };
  }

  const handler = INTENT_HANDLERS[intent.id];
  return handler({ companyId, message: trimmed });
}
