import api from "./api";

export interface LabourGroup {
  id: string;
  companyId: string;
  projectId: string;
  project: { id: string; name: string } | null;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabourGroupFormData {
  name: string;
  projectId: string;
  description: string;
  isActive: boolean;
}

export async function getLabourGroups(includeInactive = true): Promise<LabourGroup[]> {
  const response = await api.get<{ success: boolean; data: LabourGroup[] }>("/labour-groups", { params: { includeInactive } });
  return response.data.data;
}

export async function createLabourGroup(data: LabourGroupFormData): Promise<LabourGroup> {
  const response = await api.post<{ success: boolean; data: LabourGroup }>("/labour-groups", data);
  return response.data.data;
}

export async function updateLabourGroup(id: string, data: LabourGroupFormData): Promise<LabourGroup> {
  const response = await api.put<{ success: boolean; data: LabourGroup }>(`/labour-groups/${id}`, data);
  return response.data.data;
}

export async function deleteLabourGroup(id: string): Promise<{ deleted: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/labour-groups/${id}`);
  return { deleted: response.data.message === "Labour group deleted", message: response.data.message };
}
