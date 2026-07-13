import api from "./api";

export interface DeductionLedgerQuery {
  projectId?: string;
  siteId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface SiteWiseDeductionRow {
  siteId: string;
  siteName: string;
  projectId: string;
  projectName: string;
  sdDeducted: string;
  sdReleased: string;
  sdPending: string;
  gst: string;
  tds: string;
  labourCess: string;
  royalty: string;
  insurance: string;
  mobilizationRecovery: string;
  other: string;
  totalDeductions: string;
}

export interface ClientWiseDeductionRow {
  clientId: string;
  clientName: string;
  sdDeducted: string;
  gst: string;
  tds: string;
  labourCess: string;
  royalty: string;
  insurance: string;
  mobilizationRecovery: string;
  other: string;
  totalDeductions: string;
}

export interface SDPendingRow {
  siteId: string;
  siteName: string;
  projectName: string;
  sdDeducted: string;
  sdReleased: string;
  sdPending: string;
}

export interface RecoveryLedgerEntry {
  date: string;
  siteId: string;
  siteName: string;
  projectName: string;
  runningBillNumber: string;
  type: string;
  typeLabel: string;
  amount: string;
  direction: "DEDUCTED" | "RELEASED";
  remarks: string;
}

export async function getSiteWiseDeductions(query: DeductionLedgerQuery = {}): Promise<SiteWiseDeductionRow[]> {
  const response = await api.get<{ success: boolean; data: SiteWiseDeductionRow[] }>("/deduction-ledger/site-wise", { params: query });
  return response.data.data;
}

export async function getClientWiseDeductions(query: DeductionLedgerQuery = {}): Promise<ClientWiseDeductionRow[]> {
  const response = await api.get<{ success: boolean; data: ClientWiseDeductionRow[] }>("/deduction-ledger/client-wise", { params: query });
  return response.data.data;
}

export async function getSDPendingReport(query: DeductionLedgerQuery = {}): Promise<SDPendingRow[]> {
  const response = await api.get<{ success: boolean; data: SDPendingRow[] }>("/deduction-ledger/sd-pending", { params: query });
  return response.data.data;
}

export async function getRecoveryLedger(query: DeductionLedgerQuery & { type?: string } = {}): Promise<RecoveryLedgerEntry[]> {
  const response = await api.get<{ success: boolean; data: RecoveryLedgerEntry[] }>("/deduction-ledger/recovery-ledger", { params: query });
  return response.data.data;
}
