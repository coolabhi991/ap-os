import api from "./api";
import type { SubWork } from "./sub-works";

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

export type CostHeadKey = "material" | "labour" | "machinery" | "fuel" | "vendorBills" | "siteExpenses" | "other";

export const COST_HEAD_LABELS: Record<CostHeadKey, string> = {
  material: "Material",
  labour: "Labour",
  machinery: "Machinery",
  fuel: "Fuel",
  vendorBills: "Vendor Bills",
  siteExpenses: "Site Expenses",
  other: "Other",
};

export interface ProjectOverview {
  contractValue: string;
  budget: string;
  actualCost: string;
  remainingBudget: string;
  completionPercent: number;
  pendingVendorBills: { count: number };
  pendingPayments: { amount: string };
  materialStock: { totalItems: number; lowStockItems: number };
  labourToday: { count: number };
  budgetHeads: CostHeads;
  costHeads: CostHeads;
}

export type VarianceStatus = "ahead" | "on-track" | "behind";

export const VARIANCE_STATUS_LABELS: Record<VarianceStatus, string> = {
  ahead: "Ahead of Cost",
  "on-track": "On Track",
  behind: "Behind / Overspending",
};

export const VARIANCE_STATUS_COLORS: Record<VarianceStatus, string> = {
  ahead: "bg-emerald-100 text-emerald-700",
  "on-track": "bg-blue-100 text-blue-700",
  behind: "bg-red-100 text-red-700",
};

/** Physical Progress is always the manually-entered engineer value; Financial Progress is always Actual/Budget — never collapsed into one number. */
export interface ProgressComparison {
  physicalProgress: number;
  financialProgress: number;
  variance: number;
  varianceStatus: VarianceStatus;
}

export interface SubWorkRecap extends ProgressComparison {
  subWork: SubWork;
  budget: string;
  actual: string;
  difference: string;
  budgetHeads: CostHeads;
  costHeads: CostHeads;
}

export interface MaterialDrillDown {
  materialIssues: Array<{ id: string; issueNumber: string; issuedDate: string; itemName: string; quantity: string; unit: string | null; purpose: string | null }>;
  materialReceipts: Array<{ id: string; receiptNumber: string; receivedDate: string; itemName: string; quantity: string; unit: string | null; status: string }>;
  vendorBills: Array<{ id: string; billNumber: string; billDate: string; totalAmount: string; status: string; vendor: { id: string; name: string } | null }>;
}

export interface LabourDrillDown {
  attendance: Array<{ id: string; attendanceDate: string; status: string; wageAmount: string; labour: { id: string; name: string } | null }>;
  advances: Array<{ id: string; advanceDate: string; amount: string; mode: string; labour: { id: string; name: string } | null }>;
  payments: Array<{ id: string; paymentDate: string; amount: string; mode: string; labour: { id: string; name: string } | null }>;
}

export interface ExpenseDrillDownRow {
  id: string;
  expenseNumber: string;
  expenseDate: string;
  amount: string;
  machineType?: string | null;
  machineHours?: string;
  machineRatePerHour?: string;
  category?: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
}

export interface ExpenseDrillDown {
  expenses: ExpenseDrillDownRow[];
}

export interface VendorBillsDrillDown {
  bills: Array<{ id: string; billNumber: string; billDate: string; totalAmount: string; paidAmount: string; outstandingBalance: string; status: string; vendor: { id: string; name: string } | null }>;
  payments: Array<{ id: string; paymentNumber: string; paymentDate: string; amount: string; mode: string | null; vendorBillId: string }>;
}

export type DrillDownData = MaterialDrillDown | LabourDrillDown | ExpenseDrillDown | VendorBillsDrillDown;

export interface BudgetVsActual extends ProgressComparison {
  budget: string;
  actual: string;
  difference: string;
  budgetHeads: CostHeads;
  costHeads: CostHeads;
}

export interface CostBySubWorkRow extends ProgressComparison {
  subWorkId: string;
  name: string;
  status: string;
  budget: string;
  actual: string;
  difference: string;
  budgetHeads: CostHeads;
  costHeads: CostHeads;
}

export interface MonthlyCostRow {
  month: string;
  totalAmount: string;
}

export interface ProjectCostSummary extends BudgetVsActual {
  costHeads: CostHeads;
}

export async function getProjectOverview(projectId: string): Promise<ProjectOverview> {
  const response = await api.get<{ success: boolean; data: ProjectOverview }>("/project-control-center/overview", { params: { projectId } });
  return response.data.data;
}

export async function getSubWorkRecap(subWorkId: string): Promise<SubWorkRecap> {
  const response = await api.get<{ success: boolean; data: SubWorkRecap }>(`/project-control-center/sub-works/${subWorkId}/recap`);
  return response.data.data;
}

export async function getSubWorkDrillDown(subWorkId: string, head: CostHeadKey): Promise<DrillDownData> {
  const response = await api.get<{ success: boolean; data: DrillDownData }>(`/project-control-center/sub-works/${subWorkId}/drill-down/${head}`);
  return response.data.data;
}

export async function getBudgetVsActualReport(projectId: string): Promise<BudgetVsActual> {
  const response = await api.get<{ success: boolean; data: BudgetVsActual }>("/project-control-center/reports/budget-vs-actual", { params: { projectId } });
  return response.data.data;
}

export async function getCostBySubWorkReport(projectId: string): Promise<CostBySubWorkRow[]> {
  const response = await api.get<{ success: boolean; data: CostBySubWorkRow[] }>("/project-control-center/reports/cost-by-sub-work", { params: { projectId } });
  return response.data.data;
}

export async function getMonthlyCostReport(projectId: string): Promise<MonthlyCostRow[]> {
  const response = await api.get<{ success: boolean; data: MonthlyCostRow[] }>("/project-control-center/reports/monthly-cost", { params: { projectId } });
  return response.data.data;
}

export async function getProjectCostSummaryReport(projectId: string): Promise<ProjectCostSummary> {
  const response = await api.get<{ success: boolean; data: ProjectCostSummary }>("/project-control-center/reports/cost-summary", { params: { projectId } });
  return response.data.data;
}

export async function exportProjectCostSummaryCSV(projectId: string): Promise<void> {
  const response = await api.get("/project-control-center/reports/export", { params: { projectId }, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `project-cost-summary-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
