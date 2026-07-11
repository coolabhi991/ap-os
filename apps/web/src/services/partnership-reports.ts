import api from "./api";

export interface AllocationLedgerRow {
  id: string;
  allocationType: string;
  amount: string;
  date: string;
  bankAccount: string;
  site: string;
  partyName: string;
  notes: string;
  reference: string;
  createdByName: string;
  createdAt: string;
}

export interface AllocationLedgerQuery {
  allocationType?: string;
  siteId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AllocationLedgerResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: AllocationLedgerRow[];
}

export async function getAllocationLedger(query?: AllocationLedgerQuery): Promise<AllocationLedgerResponse> {
  const response = await api.get<AllocationLedgerResponse>("/partnership-reports/allocation-ledger", { params: { ...query, limit: 200 } });
  return response.data;
}

export interface PartnerCapitalRow {
  partnerId: string;
  partnerName: string;
  partnerType: string;
  sharePercent: string;
  isActive: boolean;
  totalInvested: string;
  totalSettled: string;
  netPosition: string;
}

export interface PartnerCapitalSummary {
  totalSharePercent: string;
  totalInvested: string;
  totalSettled: string;
  partners: PartnerCapitalRow[];
}

export async function getPartnerCapitalSummary(): Promise<PartnerCapitalSummary> {
  const response = await api.get<{ success: boolean; data: PartnerCapitalSummary }>("/partnership-reports/capital-summary");
  return response.data.data;
}

export interface ProfitShareRow {
  partnerId: string;
  partnerName: string;
  partnerType: string;
  sharePercent: string;
  shareAmount: string;
}

export interface ProfitSharingReport {
  revenue: string;
  costs: {
    vendorPayments: string;
    labourPayments: string;
    siteExpenses: string;
    gst: string;
    officeExpense: string;
    total: string;
  };
  netProfit: string;
  totalSharePercentAllocated: string;
  shares: ProfitShareRow[];
}

export async function getProfitSharingReport(fromDate?: string, toDate?: string): Promise<ProfitSharingReport> {
  const response = await api.get<{ success: boolean; data: ProfitSharingReport }>("/partnership-reports/profit-sharing", { params: { fromDate, toDate } });
  return response.data.data;
}
