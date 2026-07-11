import api from "./api";

export interface SiteVisit {
  id: string;
  companyId: string;
  siteId: string;
  visitDate: string;
  visitedBy: string;
  purpose: string;
  remarks: string;
  photos: string[];
  status: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteVisitFormData {
  siteId: string;
  visitDate: string;
  visitedBy: string;
  purpose: string;
  remarks: string;
  photos: string[];
  status: string;
}

export const SITE_VISIT_STATUS_OPTIONS = ["PLANNED", "COMPLETED", "CANCELLED"];

export const SITE_VISIT_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SITE_VISIT_STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export interface SiteVisitSummary {
  totalPlanned: number;
  completed: number;
  pending: number;
}

export interface SiteVisitListResult {
  total: number;
  page: number;
  limit: number;
  summary: SiteVisitSummary;
  data: SiteVisit[];
}

export async function getSiteVisits(siteId: string, status?: string): Promise<SiteVisitListResult> {
  const response = await api.get<{ success: boolean } & SiteVisitListResult>("/site-visits", { params: { siteId, status, limit: 100 } });
  return response.data;
}

export async function getSiteVisit(id: string): Promise<SiteVisit> {
  const response = await api.get<{ success: boolean; data: SiteVisit }>(`/site-visits/${id}`);
  return response.data.data;
}

export async function createSiteVisit(data: SiteVisitFormData): Promise<SiteVisit> {
  const response = await api.post<{ success: boolean; data: SiteVisit }>("/site-visits", data);
  return response.data.data;
}

export async function updateSiteVisit(id: string, data: Partial<SiteVisitFormData>): Promise<SiteVisit> {
  const response = await api.put<{ success: boolean; data: SiteVisit }>(`/site-visits/${id}`, data);
  return response.data.data;
}

export async function deleteSiteVisit(id: string): Promise<void> {
  await api.delete(`/site-visits/${id}`);
}
