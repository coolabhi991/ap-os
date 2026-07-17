import api from "./api";

export interface SiteBoqItem {
  id: string;
  companyId: string;
  siteId: string;
  subWorkId: string;
  subWork: { id: string; name: string } | null;
  description: string;
  unit: string;
  contractQuantity: string;
  rate: string;
  amount: string;
  remarks: string;
  sortOrder: number;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteBoqItemFormData {
  siteId: string;
  subWorkId: string;
  description: string;
  unit: string;
  contractQuantity: number;
  rate: number;
  remarks?: string;
}

export async function getSiteBoqItems(siteId: string): Promise<SiteBoqItem[]> {
  const response = await api.get<{ success: boolean; data: SiteBoqItem[] }>("/site-boq-items", { params: { siteId } });
  return response.data.data;
}

export async function createSiteBoqItem(data: SiteBoqItemFormData): Promise<SiteBoqItem> {
  const response = await api.post<{ success: boolean; data: SiteBoqItem }>("/site-boq-items", data);
  return response.data.data;
}

export async function updateSiteBoqItem(id: string, data: Partial<SiteBoqItemFormData>): Promise<SiteBoqItem> {
  const response = await api.put<{ success: boolean; data: SiteBoqItem }>(`/site-boq-items/${id}`, data);
  return response.data.data;
}

export async function deleteSiteBoqItem(id: string): Promise<void> {
  await api.delete(`/site-boq-items/${id}`);
}
