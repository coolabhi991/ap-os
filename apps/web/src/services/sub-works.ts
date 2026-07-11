import api from "./api";

export interface SubWork {
  id: string;
  companyId: string;
  projectId: string;
  siteId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  remarks: string;
  sortOrder: number;
  physicalProgress: number;
  progressUpdatedAt: string;
  budgetMaterial: string;
  budgetLabour: string;
  budgetMachinery: string;
  budgetFuel: string;
  budgetSiteExpenses: string;
  budgetVendorBills: string;
  budgetOther: string;
  totalBudget: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubWorkFormData {
  siteId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  remarks: string;
  physicalProgress: number;
  budgetMaterial: number;
  budgetLabour: number;
  budgetMachinery: number;
  budgetFuel: number;
  budgetSiteExpenses: number;
  budgetVendorBills: number;
  budgetOther: number;
}

export const SUBWORK_STATUS_OPTIONS = ["PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"];

export const SUBWORK_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

export const SUBWORK_STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
};

/** Legacy: lists every Sub Work under a Project regardless of Site — used by top-level forms (Add Expense, Add DPR, etc.) that still pick a Sub Work by Project. */
export async function getSubWorks(projectId: string): Promise<SubWork[]> {
  const response = await api.get<{ success: boolean; data: SubWork[] }>("/sub-works", { params: { projectId } });
  return response.data.data;
}

/** Site Workspace: lists only the Sub Works belonging to one Site. */
export async function getSubWorksBySite(siteId: string): Promise<SubWork[]> {
  const response = await api.get<{ success: boolean; data: SubWork[] }>("/sub-works", { params: { siteId } });
  return response.data.data;
}

export async function getSubWork(id: string): Promise<SubWork> {
  const response = await api.get<{ success: boolean; data: SubWork }>(`/sub-works/${id}`);
  return response.data.data;
}

export async function createSubWork(data: SubWorkFormData): Promise<SubWork> {
  const response = await api.post<{ success: boolean; data: SubWork }>("/sub-works", data);
  return response.data.data;
}

export async function updateSubWork(id: string, data: Partial<SubWorkFormData>): Promise<SubWork> {
  const response = await api.put<{ success: boolean; data: SubWork }>(`/sub-works/${id}`, data);
  return response.data.data;
}

export async function deleteSubWork(id: string): Promise<void> {
  await api.delete(`/sub-works/${id}`);
}

export async function reorderSubWorks(siteId: string, order: { id: string; sortOrder: number }[]): Promise<SubWork[]> {
  const response = await api.put<{ success: boolean; data: SubWork[] }>("/sub-works/reorder", { siteId, order });
  return response.data.data;
}
