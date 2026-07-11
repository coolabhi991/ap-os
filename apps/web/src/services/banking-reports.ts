import api from "./api";
import type { BankTransaction } from "./bank-transactions";

export interface BankBookReport {
  account: { id: string; nickname: string; bankName: string; accountNumber: string; accountType: string };
  openingBalance: string;
  closingBalance: string;
  totalDeposits: string;
  totalWithdrawals: string;
  entries: (BankTransaction & { balance: string })[];
}

export interface CashBookEntry {
  date: string;
  type: string;
  reference: string;
  received: string;
  paid: string;
  balance: string;
}

export interface CashBookReport {
  hasCashAccount: boolean;
  openingBalance: string;
  totalReceived: string;
  totalPaid: string;
  closingBalance: string;
  entries: CashBookEntry[];
}

export interface BankReconciliationReport {
  summary: {
    fullyAllocated: { count: number; amount: string };
    partiallyAllocated: { count: number; amount: string };
    unallocated: { count: number; amount: string };
  };
  transactions: BankTransaction[];
}

export interface CashFlowPeriod {
  inflow: string;
  outflow: string;
  net: string;
}

export interface CashFlowReport {
  today: CashFlowPeriod;
  weekly: CashFlowPeriod;
  monthly: CashFlowPeriod;
  expectedInflow: string;
  expectedOutflow: string;
}

export interface ReceivableRow {
  id: string;
  billNumber: string;
  billDate: string;
  project: { id: string; name: string } | null;
  subWork: { id: string; name: string } | null;
  status: string;
  netPayable: string;
  amountReceived: string;
  outstandingAmount: string;
  daysOutstanding: number;
  expectedPaymentDate: string;
}

export interface PayableRow {
  id: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  vendor: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  totalAmount: string;
  paidAmount: string;
  outstandingBalance: string;
  status: string;
  isOverdue: boolean;
  daysOverdue: number;
}

export interface OutstandingSummary {
  totalReceivable: string;
  receivableCount: number;
  totalPayable: string;
  payableCount: number;
  overduePayable: string;
  overduePayableCount: number;
  netPosition: string;
  totalCashAndBankBalance: string;
  accountBalances: { id: string; nickname: string; bankName: string; accountType: string; currentBalance: string; isActive: boolean }[];
}

export interface ReportQuery {
  companyBankAccountId?: string;
  projectId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface EmailRecipient {
  label: string;
  email: string;
}

export async function getBankBookReport(query: ReportQuery): Promise<BankBookReport> {
  const response = await api.get<{ success: boolean; data: BankBookReport }>("/banking-reports/bank-book", { params: query });
  return response.data.data;
}

export async function getCashBookReport(query?: { fromDate?: string; toDate?: string }): Promise<CashBookReport> {
  const response = await api.get<{ success: boolean; data: CashBookReport }>("/banking-reports/cash-book", { params: query });
  return response.data.data;
}

export async function getBankReconciliationReport(query?: ReportQuery): Promise<BankReconciliationReport> {
  const response = await api.get<{ success: boolean; data: BankReconciliationReport }>("/banking-reports/reconciliation", { params: query });
  return response.data.data;
}

export async function getCashFlowReport(): Promise<CashFlowReport> {
  const response = await api.get<{ success: boolean; data: CashFlowReport }>("/banking-reports/cash-flow");
  return response.data.data;
}

export async function getReceivablesReport(query?: { projectId?: string }): Promise<ReceivableRow[]> {
  const response = await api.get<{ success: boolean; data: ReceivableRow[] }>("/banking-reports/receivables", { params: query });
  return response.data.data;
}

export async function getPayablesReport(query?: { projectId?: string }): Promise<PayableRow[]> {
  const response = await api.get<{ success: boolean; data: PayableRow[] }>("/banking-reports/payables", { params: query });
  return response.data.data;
}

export async function getOutstandingSummary(): Promise<OutstandingSummary> {
  const response = await api.get<{ success: boolean; data: OutstandingSummary }>("/banking-reports/outstanding-summary");
  return response.data.data;
}

async function downloadBlob(url: string, params: object, filename: string): Promise<void> {
  const response = await api.get(url, { params, responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function exportReceivablesCSV(query?: { projectId?: string }): Promise<void> {
  await downloadBlob("/banking-reports/receivables/export", query ?? {}, `receivables-${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportPayablesCSV(query?: { projectId?: string }): Promise<void> {
  await downloadBlob("/banking-reports/payables/export", query ?? {}, `payables-${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportBankBookCSV(query: ReportQuery): Promise<void> {
  await downloadBlob("/banking-reports/bank-book/export/csv", query, `bank-book-${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportBankBookPdf(query: ReportQuery): Promise<void> {
  await downloadBlob("/banking-reports/bank-book/export/pdf", query, `bank-book-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportBankBookExcel(query: ReportQuery): Promise<void> {
  await downloadBlob("/banking-reports/bank-book/export/excel", query, `bank-book-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportCashBookCSV(query?: { fromDate?: string; toDate?: string }): Promise<void> {
  await downloadBlob("/banking-reports/cash-book/export/csv", query ?? {}, `cash-book-${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportCashBookPdf(query?: { fromDate?: string; toDate?: string }): Promise<void> {
  await downloadBlob("/banking-reports/cash-book/export/pdf", query ?? {}, `cash-book-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportCashBookExcel(query?: { fromDate?: string; toDate?: string }): Promise<void> {
  await downloadBlob("/banking-reports/cash-book/export/excel", query ?? {}, `cash-book-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function sendBankBookEmail(query: ReportQuery, recipients: EmailRecipient[], message?: string): Promise<void> {
  await api.post("/banking-reports/bank-book/email", { recipients, message }, { params: query });
}

export async function sendCashBookEmail(query: { fromDate?: string; toDate?: string }, recipients: EmailRecipient[], message?: string): Promise<void> {
  await api.post("/banking-reports/cash-book/email", { recipients, message }, { params: query });
}
