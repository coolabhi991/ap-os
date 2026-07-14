import api from "./api";

export interface PartnerSettlement {
  id: string;
  companyId: string;
  partnerId: string;
  partner: { id: string; name: string; partnerType: string } | null;
  settlementNumber: string;
  settlementType: string;
  amount: string;
  settlementDate: string;
  mode: string;
  companyBankAccountId: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string } | null;
  referenceNumber: string;
  remarks: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  sourceBankTransaction: SourceBankTransaction | null;
  createdAt: string;
}

/** Where this settlement's money actually moved, if it was created by allocating a Bank Transaction (Banking Integration traceability) — null when entered directly. */
export interface SourceBankTransaction {
  id: string;
  transactionDate: string;
  referenceNumber: string;
  amount: string;
  companyBankAccountId: string;
  bankAccountLabel: string;
}

export interface PartnerSettlementFormData {
  partnerId: string;
  settlementType: string;
  amount: number;
  settlementDate: string;
  mode: string;
  companyBankAccountId?: string;
  referenceNumber?: string;
  remarks?: string;
}

export const SETTLEMENT_TYPE_OPTIONS = ["PROFIT_SHARE", "INVESTMENT_RETURN", "OTHER"];
export const SETTLEMENT_TYPE_LABELS: Record<string, string> = {
  PROFIT_SHARE: "Profit Share",
  INVESTMENT_RETURN: "Investment Return",
  OTHER: "Other",
};

export const PAYMENT_MODE_OPTIONS = ["CASH", "COMPANY_BANK"];
export const PAYMENT_MODE_LABELS: Record<string, string> = { CASH: "Cash", COMPANY_BANK: "Company Bank" };

export interface PartnerSettlementListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: PartnerSettlement[];
}

export async function getPartnerSettlements(partnerId?: string): Promise<PartnerSettlementListResponse> {
  const response = await api.get<PartnerSettlementListResponse>("/partner-settlements", { params: { partnerId, limit: 200 } });
  return response.data;
}

export async function createPartnerSettlement(data: PartnerSettlementFormData): Promise<PartnerSettlement> {
  const response = await api.post<{ success: boolean; data: PartnerSettlement }>("/partner-settlements", data);
  return response.data.data;
}

export async function deletePartnerSettlement(id: string): Promise<void> {
  await api.delete(`/partner-settlements/${id}`);
}
