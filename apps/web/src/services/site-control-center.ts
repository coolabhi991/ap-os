import api from "./api";
import type { Site } from "./sites";
import type { CostHeads, ProgressComparison, MonthlyCostRow } from "./project-control-center";

export type { MonthlyCostRow };

export interface SiteOverview extends ProgressComparison {
  site: Site;
  budget: string;
  actualCost: string;
  remainingBudget: string;
  pendingVendorBills: { count: number };
  pendingPayments: { amount: string };
  labourToday: { count: number };
  budgetHeads: CostHeads;
  costHeads: CostHeads;
}

export interface SiteSubWorkRecapRow extends ProgressComparison {
  subWorkId: string;
  name: string;
  status: string;
  budget: string;
  actual: string;
  difference: string;
  budgetHeads: CostHeads;
  costHeads: CostHeads;
}

export interface SiteRecapLive extends ProgressComparison {
  generatedAt: string;
  siteId: string;
  siteName: string;
  budget: string;
  actual: string;
  difference: string;
  budgetHeads: CostHeads;
  costHeads: CostHeads;
  subWorks: SiteSubWorkRecapRow[];
}

export const GST_TYPES = ["NONE", "FIVE", "TWELVE", "EIGHTEEN", "CUSTOM"];
export const GST_TYPE_LABELS: Record<string, string> = { NONE: "None", FIVE: "5%", TWELVE: "12%", EIGHTEEN: "18%", CUSTOM: "Custom" };

export interface OtherCharge {
  label: string;
  amount: string;
}

export interface RecapitulationItem {
  id?: string;
  subWorkId: string;
  sortOrder: number;
  particular: string;
  qty: string;
  rate: string;
  amount: string;
}

export interface SiteRecapRevision {
  id: string;
  siteId: string;
  revisionNo: number;
  isCurrent: boolean;
  label: string;
  notes: string;
  snapshot: SiteRecapLive;
  gstType: string;
  gstPercent: string;
  administrationCharges: string;
  otherCharges: OtherCharge[];
  subTotal: string;
  gstAmount: string;
  grandTotal: string;
  items: RecapitulationItem[];
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface RecapitulationDraft {
  items: RecapitulationItem[];
  gstType: string;
  gstPercent: string;
  administrationCharges: string;
  otherCharges: OtherCharge[];
}

export interface CreateRecapRevisionInput {
  label?: string;
  notes?: string;
  items: { subWorkId?: string; particular: string; qty: number; rate: number }[];
  gstType: string;
  gstPercent?: number;
  administrationCharges?: number;
  otherCharges?: OtherCharge[];
}

export interface SiteBudgetVsActual extends ProgressComparison {
  budget: string;
  actual: string;
  difference: string;
  budgetHeads: CostHeads;
  costHeads: CostHeads;
}

export async function getSiteOverview(siteId: string): Promise<SiteOverview> {
  const response = await api.get<{ success: boolean; data: SiteOverview }>("/site-control-center/overview", { params: { siteId } });
  return response.data.data;
}

export interface SiteWallet {
  inflow: string;
  outflow: string;
  balance: string;
  breakdown: {
    runningBillReceipts: string;
    siteExpenses: string;
    labour: string;
  };
}

export async function getSiteWallet(siteId: string): Promise<SiteWallet> {
  const response = await api.get<{ success: boolean; data: SiteWallet }>("/site-control-center/wallet", { params: { siteId } });
  return response.data.data;
}

export interface SiteBillReceivedRow {
  id: string;
  raNumber: string;
  billDate: string;
  billAmount: string;
  receivedAmount: string;
  pendingAmount: string;
  status: string;
  bankAccounts: string[];
}

export async function getSiteBillReceivedReport(siteId: string): Promise<SiteBillReceivedRow[]> {
  const response = await api.get<{ success: boolean; data: SiteBillReceivedRow[] }>("/site-control-center/bill-received", { params: { siteId } });
  return response.data.data;
}

export interface SiteVendorBillRow {
  id: string;
  billNumber: string;
  billDate: string;
  vendor: string;
  totalAmount: string;
  paidAmount: string;
  outstandingBalance: string;
  status: string;
}

export async function getSiteVendorBillsReport(siteId: string): Promise<SiteVendorBillRow[]> {
  const response = await api.get<{ success: boolean; data: SiteVendorBillRow[] }>("/site-control-center/vendor-bills", { params: { siteId } });
  return response.data.data;
}

export interface SiteMoneyFlowRow {
  id: string;
  date: string;
  allocationType: string;
  direction: "IN" | "OUT";
  amount: string;
  bankAccount: string;
  reference: string;
}

export async function getSiteMoneyFlow(siteId: string): Promise<SiteMoneyFlowRow[]> {
  const response = await api.get<{ success: boolean; data: SiteMoneyFlowRow[] }>("/site-control-center/money-flow", { params: { siteId } });
  return response.data.data;
}

export async function getSiteRecapLive(siteId: string): Promise<SiteRecapLive> {
  const response = await api.get<{ success: boolean; data: SiteRecapLive }>("/site-control-center/recap/live", { params: { siteId } });
  return response.data.data;
}

export async function listSiteRecapRevisions(siteId: string): Promise<SiteRecapRevision[]> {
  const response = await api.get<{ success: boolean; data: SiteRecapRevision[] }>("/site-control-center/recap/revisions", { params: { siteId } });
  return response.data.data;
}

export async function getCurrentSiteRecapRevision(siteId: string): Promise<SiteRecapRevision | null> {
  const response = await api.get<{ success: boolean; data: SiteRecapRevision | null }>("/site-control-center/recap/revisions/current", { params: { siteId } });
  return response.data.data;
}

export async function createSiteRecapRevision(siteId: string, input: CreateRecapRevisionInput): Promise<SiteRecapRevision> {
  const response = await api.post<{ success: boolean; data: SiteRecapRevision }>("/site-control-center/recap/revisions", input, { params: { siteId } });
  return response.data.data;
}

export async function getRecapitulationDraft(siteId: string): Promise<RecapitulationDraft> {
  const response = await api.get<{ success: boolean; data: RecapitulationDraft }>("/site-control-center/recap/draft", { params: { siteId } });
  return response.data.data;
}

export async function getSiteBudgetVsActualReport(siteId: string): Promise<SiteBudgetVsActual> {
  const response = await api.get<{ success: boolean; data: SiteBudgetVsActual }>("/site-control-center/reports/budget-vs-actual", { params: { siteId } });
  return response.data.data;
}

export async function getSiteCostBySubWorkReport(siteId: string): Promise<SiteSubWorkRecapRow[]> {
  const response = await api.get<{ success: boolean; data: SiteSubWorkRecapRow[] }>("/site-control-center/reports/cost-by-sub-work", { params: { siteId } });
  return response.data.data;
}

export async function getSiteMonthlyCostReport(siteId: string): Promise<MonthlyCostRow[]> {
  const response = await api.get<{ success: boolean; data: MonthlyCostRow[] }>("/site-control-center/reports/monthly-cost", { params: { siteId } });
  return response.data.data;
}

export async function exportSiteCostSummaryCSV(siteId: string): Promise<void> {
  const response = await api.get("/site-control-center/reports/export", { params: { siteId }, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `site-cost-summary-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
