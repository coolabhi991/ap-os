import api from "./api";

export interface MaterialIssueInventoryRef {
  id: string;
  itemCode: string | null;
  itemName: string;
  unit: string | null;
  warehouse: string | null;
  currentStock: string;
  reservedStock: string;
  availableStock: string;
}

export interface MaterialIssue {
  id: string;
  companyId: string;
  projectId: string;
  project: { id: string; name: string } | null;
  inventoryId: string;
  inventory: MaterialIssueInventoryRef | null;
  subWorkId: string;
  subWork: { id: string; name: string } | null;
  issueNumber: string;
  issuedDate: string;
  itemName: string;
  warehouse: string;
  quantity: string;
  unit: string;
  purpose: string;
  issuedTo: string;
  approvedBy: string;
  remarks: string;
  attachmentFileName: string;
  attachmentFileUrl: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialIssueFormData {
  projectId: string;
  inventoryId: string;
  subWorkId: string;
  quantity: number;
  issuedDate: string;
  purpose: string;
  issuedTo: string;
  approvedBy: string;
  remarks: string;
  attachmentFileName: string;
  attachmentFileUrl: string;
}

export interface MaterialIssueUpdateData {
  purpose: string;
  issuedTo: string;
  approvedBy: string;
  remarks: string;
  attachmentFileName: string;
  attachmentFileUrl: string;
}

export interface MaterialIssueListQuery {
  search?: string;
  projectId?: string;
  inventoryId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface MaterialIssueListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: MaterialIssue[];
}

export interface MaterialIssueDashboardSummary {
  today: { quantity: string; count: number };
  thisMonth: { quantity: string; count: number };
  byProject: Array<{ projectId: string; projectName: string; quantity: string; count: number }>;
  byMaterial: Array<{ inventoryId: string; itemName: string; unit: string; quantity: string; count: number }>;
  recentIssues: MaterialIssue[];
}

export interface ProjectConsumptionRow {
  projectId: string;
  projectName: string;
  totalQuantity: string;
  count: number;
}

export interface MaterialConsumptionRow {
  inventoryId: string;
  itemName: string;
  unit: string;
  totalQuantity: string;
  count: number;
}

export interface MonthlyConsumptionRow {
  month: string;
  totalQuantity: string;
  count: number;
}

export async function getMaterialIssues(query?: MaterialIssueListQuery): Promise<MaterialIssueListResponse> {
  const response = await api.get<MaterialIssueListResponse>("/material-issues", { params: query });
  return response.data;
}

export async function getMaterialIssue(id: string): Promise<MaterialIssue> {
  const response = await api.get<{ success: boolean; data: MaterialIssue }>(`/material-issues/${id}`);
  return response.data.data;
}

export async function createMaterialIssue(data: MaterialIssueFormData): Promise<MaterialIssue> {
  const response = await api.post<{ success: boolean; data: MaterialIssue }>("/material-issues", data);
  return response.data.data;
}

export async function updateMaterialIssue(id: string, data: MaterialIssueUpdateData): Promise<MaterialIssue> {
  const response = await api.put<{ success: boolean; data: MaterialIssue }>(`/material-issues/${id}`, data);
  return response.data.data;
}

export async function deleteMaterialIssue(id: string): Promise<void> {
  await api.delete(`/material-issues/${id}`);
}

export async function getMaterialIssueDashboard(): Promise<MaterialIssueDashboardSummary> {
  const response = await api.get<{ success: boolean; data: MaterialIssueDashboardSummary }>("/material-issues/dashboard");
  return response.data.data;
}

export async function getProjectConsumptionReport(query?: { fromDate?: string; toDate?: string }): Promise<ProjectConsumptionRow[]> {
  const response = await api.get<{ success: boolean; data: ProjectConsumptionRow[] }>("/material-issues/reports/project-consumption", { params: query });
  return response.data.data;
}

export async function getMaterialConsumptionReport(query?: { fromDate?: string; toDate?: string }): Promise<MaterialConsumptionRow[]> {
  const response = await api.get<{ success: boolean; data: MaterialConsumptionRow[] }>("/material-issues/reports/material-consumption", { params: query });
  return response.data.data;
}

export async function getMonthlyConsumptionReport(query?: { fromDate?: string; toDate?: string }): Promise<MonthlyConsumptionRow[]> {
  const response = await api.get<{ success: boolean; data: MonthlyConsumptionRow[] }>("/material-issues/reports/monthly-consumption", { params: query });
  return response.data.data;
}

/** Triggers a browser download of the (optionally filtered) material issues as CSV. */
export async function exportMaterialIssuesCSV(query?: MaterialIssueListQuery): Promise<void> {
  const response = await api.get("/material-issues/export", { params: query, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `material-issues-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
