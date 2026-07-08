import api from "./api";

export interface LabourAdvance {
  id: string;
  companyId: string;
  labourId: string;
  labour: { id: string; name: string; category: string } | null;
  projectId: string;
  project: { id: string; name: string } | null;
  amount: string;
  advanceDate: string;
  mode: string;
  companyBankAccountId: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string } | null;
  remarks: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabourAdvanceFormData {
  labourId: string;
  projectId: string;
  amount: number;
  advanceDate: string;
  mode: string;
  companyBankAccountId: string;
  remarks: string;
}

export interface LabourAdvanceListQuery {
  search?: string;
  labourId?: string;
  projectId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface LabourAdvanceListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: LabourAdvance[];
}

export const ADVANCE_MODE_OPTIONS = ["CASH", "COMPANY_BANK"];

export const ADVANCE_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  COMPANY_BANK: "Company Bank",
};

export async function getLabourAdvances(query?: LabourAdvanceListQuery): Promise<LabourAdvanceListResponse> {
  const response = await api.get<LabourAdvanceListResponse>("/labour-advances", { params: query });
  return response.data;
}

export async function getLabourAdvance(id: string): Promise<LabourAdvance> {
  const response = await api.get<{ success: boolean; data: LabourAdvance }>(`/labour-advances/${id}`);
  return response.data.data;
}

export async function createLabourAdvance(data: LabourAdvanceFormData): Promise<LabourAdvance> {
  const response = await api.post<{ success: boolean; data: LabourAdvance }>("/labour-advances", data);
  return response.data.data;
}

export async function deleteLabourAdvance(id: string): Promise<void> {
  await api.delete(`/labour-advances/${id}`);
}

/** Triggers a browser download of the (optionally filtered) advances as CSV. */
export async function exportLabourAdvancesCSV(query?: LabourAdvanceListQuery): Promise<void> {
  const response = await api.get("/labour-advances/export", { params: query, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `labour-advances-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
