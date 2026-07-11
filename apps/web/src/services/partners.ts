import api from "./api";

export interface Partner {
  id: string;
  companyId: string;
  name: string;
  partnerType: string;
  phone: string;
  email: string;
  address: string;
  panNumber: string;
  sharePercent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerFormData {
  name: string;
  partnerType: string;
  phone: string;
  email: string;
  address: string;
  panNumber: string;
  sharePercent: number;
  isActive: boolean;
}

export const PARTNER_TYPE_OPTIONS = ["OWNER", "PARTNER"];
export const PARTNER_TYPE_LABELS: Record<string, string> = { OWNER: "Owner", PARTNER: "Partner" };

export interface PartnerListQuery {
  search?: string;
  partnerType?: string;
  isActive?: boolean;
}

export interface PartnerListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: Partner[];
}

export async function getPartners(query?: PartnerListQuery): Promise<PartnerListResponse> {
  const response = await api.get<PartnerListResponse>("/partners", { params: { ...query, limit: 100 } });
  return response.data;
}

export async function getPartner(id: string): Promise<Partner> {
  const response = await api.get<{ success: boolean; data: Partner }>(`/partners/${id}`);
  return response.data.data;
}

export async function createPartner(data: PartnerFormData): Promise<Partner> {
  const response = await api.post<{ success: boolean; data: Partner }>("/partners", data);
  return response.data.data;
}

export async function updatePartner(id: string, data: Partial<PartnerFormData>): Promise<Partner> {
  const response = await api.put<{ success: boolean; data: Partner }>(`/partners/${id}`, data);
  return response.data.data;
}

export async function deletePartner(id: string): Promise<void> {
  await api.delete(`/partners/${id}`);
}
