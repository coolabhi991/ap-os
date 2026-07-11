import api from "./api";

export interface Site {
  id: string;
  companyId: string;
  projectId: string;
  name: string;
  village: string;
  taluka: string;
  district: string;
  engineer: string;
  siteType: string;
  status: string;
  contractValue: string;
  emdValue: string;
  securityDeposit: string;
  performanceGuarantee: string;
  workOrderDate: string;
  completionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteFormData {
  projectId: string;
  name: string;
  village: string;
  taluka: string;
  district: string;
  engineer: string;
  siteType: string;
  status: string;
  contractValue: number;
  emdValue: number;
  securityDeposit: number;
  performanceGuarantee: number;
  workOrderDate: string;
  completionDate: string;
}

export const SITE_TYPE_OPTIONS = ["OWN_SITE", "PARTNERSHIP_SITE", "AGENCY_SITE"];

export const SITE_TYPE_LABELS: Record<string, string> = {
  OWN_SITE: "Own Site",
  PARTNERSHIP_SITE: "Partnership Site",
  AGENCY_SITE: "Agency Site",
};

export const SITE_STATUS_OPTIONS = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

export const SITE_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SITE_STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export interface SiteListResult {
  total: number;
  page: number;
  limit: number;
  data: Site[];
}

export async function getAllSites(): Promise<Site[]> {
  const response = await api.get<{ success: boolean } & SiteListResult>("/sites", { params: { limit: 100 } });
  return response.data.data;
}

export async function getSites(projectId: string): Promise<Site[]> {
  const response = await api.get<{ success: boolean } & SiteListResult>("/sites", { params: { projectId, limit: 100 } });
  return response.data.data;
}

export async function getSite(id: string): Promise<Site> {
  const response = await api.get<{ success: boolean; data: Site }>(`/sites/${id}`);
  return response.data.data;
}

export async function createSite(data: SiteFormData): Promise<Site> {
  const response = await api.post<{ success: boolean; data: Site }>("/sites", data);
  return response.data.data;
}

export async function updateSite(id: string, data: Partial<SiteFormData>): Promise<Site> {
  const response = await api.put<{ success: boolean; data: Site }>(`/sites/${id}`, data);
  return response.data.data;
}

export async function deleteSite(id: string): Promise<void> {
  await api.delete(`/sites/${id}`);
}
