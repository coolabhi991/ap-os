import api from "./api";

export interface LabourWageRateRef {
  dailyWage: string;
  overtimeRate: string;
  effectiveFrom: string;
}

export interface Labour {
  id: string;
  companyId: string;
  projectId: string;
  project: { id: string; name: string } | null;
  contractorId: string;
  contractor: { id: string; name: string } | null;
  groupId: string;
  group: { id: string; name: string } | null;
  name: string;
  phone: string;
  designation: string;
  category: "SKILLED" | "SEMI_SKILLED" | "UNSKILLED";
  status: string;
  remarks: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  isDeleted: boolean;
  currentWageRate: LabourWageRateRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface LabourFormData {
  name: string;
  projectId: string;
  contractorId: string;
  groupId: string;
  phone: string;
  designation: string;
  category: string;
  status: string;
  remarks: string;
  dailyWage: number;
  overtimeRate: number;
}

export interface LabourListQuery {
  search?: string;
  projectId?: string;
  contractorId?: string;
  groupId?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface LabourListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: Labour[];
}

export const LABOUR_CATEGORY_LABELS: Record<string, string> = {
  SKILLED: "Skilled",
  SEMI_SKILLED: "Semi-Skilled",
  UNSKILLED: "Unskilled",
};

export async function getLabourList(query?: LabourListQuery): Promise<LabourListResponse> {
  const response = await api.get<LabourListResponse>("/labour", { params: query });
  return response.data;
}

export async function getLabour(id: string): Promise<Labour> {
  const response = await api.get<{ success: boolean; data: Labour }>(`/labour/${id}`);
  return response.data.data;
}

export async function createLabour(data: LabourFormData): Promise<Labour> {
  const response = await api.post<{ success: boolean; data: Labour }>("/labour", data);
  return response.data.data;
}

export async function updateLabour(id: string, data: LabourFormData): Promise<Labour> {
  const response = await api.put<{ success: boolean; data: Labour }>(`/labour/${id}`, data);
  return response.data.data;
}

export async function deleteLabour(id: string): Promise<void> {
  await api.delete(`/labour/${id}`);
}

/** Triggers a browser download of the (optionally filtered) labour master list as CSV. */
export async function exportLabourCSV(query?: LabourListQuery): Promise<void> {
  const response = await api.get("/labour/export", { params: query, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `labour-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
