import api from "./api";

export interface SiteBillItem {
  id: string;
  companyId: string;
  siteId: string;
  subWorkId: string;
  subWork: { id: string; name: string } | null;
  itemNo: string;
  description: string;
  unit: string;
  rate: string;
  isActive: boolean;
  sortOrder: number;
  billedCount: number;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteBillItemFormData {
  siteId: string;
  subWorkId?: string;
  itemNo: string;
  description: string;
  unit: string;
  rate: number;
}

export async function getSiteBillItems(siteId: string, includeInactive = false): Promise<SiteBillItem[]> {
  const response = await api.get<{ success: boolean; data: SiteBillItem[] }>("/site-bill-items", { params: { siteId, includeInactive: includeInactive || undefined } });
  return response.data.data;
}

export async function updateSiteBillItem(id: string, data: Partial<SiteBillItemFormData>): Promise<SiteBillItem> {
  const response = await api.put<{ success: boolean; data: SiteBillItem }>(`/site-bill-items/${id}`, data);
  return response.data.data;
}

export async function deleteSiteBillItem(id: string): Promise<void> {
  await api.delete(`/site-bill-items/${id}`);
}
