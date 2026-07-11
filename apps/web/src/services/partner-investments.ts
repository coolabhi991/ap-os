import api from "./api";

export interface PartnerInvestment {
  id: string;
  companyId: string;
  partnerId: string;
  partner: { id: string; name: string; partnerType: string } | null;
  investmentNumber: string;
  amount: string;
  investmentDate: string;
  mode: string;
  companyBankAccountId: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string } | null;
  referenceNumber: string;
  remarks: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface PartnerInvestmentFormData {
  partnerId: string;
  amount: number;
  investmentDate: string;
  mode: string;
  companyBankAccountId?: string;
  referenceNumber?: string;
  remarks?: string;
}

export const PAYMENT_MODE_OPTIONS = ["CASH", "COMPANY_BANK"];
export const PAYMENT_MODE_LABELS: Record<string, string> = { CASH: "Cash", COMPANY_BANK: "Company Bank" };

export interface PartnerInvestmentListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: PartnerInvestment[];
}

export async function getPartnerInvestments(partnerId?: string): Promise<PartnerInvestmentListResponse> {
  const response = await api.get<PartnerInvestmentListResponse>("/partner-investments", { params: { partnerId, limit: 200 } });
  return response.data;
}

export async function createPartnerInvestment(data: PartnerInvestmentFormData): Promise<PartnerInvestment> {
  const response = await api.post<{ success: boolean; data: PartnerInvestment }>("/partner-investments", data);
  return response.data.data;
}

export async function deletePartnerInvestment(id: string): Promise<void> {
  await api.delete(`/partner-investments/${id}`);
}
