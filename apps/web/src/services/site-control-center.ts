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

export interface SiteRecapRevision {
  id: string;
  siteId: string;
  revisionNo: number;
  isCurrent: boolean;
  label: string;
  notes: string;
  snapshot: SiteRecapLive;
  createdById: string;
  createdByName: string;
  createdAt: string;
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

export async function createSiteRecapRevision(siteId: string, input: { label?: string; notes?: string }): Promise<SiteRecapRevision> {
  const response = await api.post<{ success: boolean; data: SiteRecapRevision }>("/site-control-center/recap/revisions", input, { params: { siteId } });
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
