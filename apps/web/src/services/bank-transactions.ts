import api from "./api";

export interface BankAccountBalance {
  id: string;
  nickname: string;
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  isPrimary: boolean;
  isActive: boolean;
  openingBalance: string;
  totalDeposits: string;
  totalWithdrawals: string;
  currentBalance: string;
  transactionCount: number;
}

export interface BankTransaction {
  id: string;
  companyId: string;
  companyBankAccountId: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string; accountType: string } | null;
  transactionDate: string;
  deposit: string;
  withdrawal: string;
  referenceNumber: string;
  description: string;
  category: string;
  projectId: string;
  project: { id: string; name: string } | null;
  runningBillPaymentId: string;
  runningBillPayment: { id: string; paymentNumber: string; amount: string; paymentDate: string; billNumber: string } | null;
  vendorPaymentId: string;
  vendorPayment: { id: string; paymentNumber: string; amount: string; paymentDate: string; vendor: string; billNumber: string } | null;
  reconciliationStatus: string;
  source: string;
  importBatchId: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransactionFormData {
  companyBankAccountId: string;
  transactionDate: string;
  deposit?: number;
  withdrawal?: number;
  referenceNumber?: string;
  description?: string;
  category?: string;
  projectId?: string;
  runningBillPaymentId?: string;
  vendorPaymentId?: string;
}

export interface BankTransactionListQuery {
  search?: string;
  companyBankAccountId?: string;
  projectId?: string;
  reconciliationStatus?: string;
  source?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BankTransactionListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: BankTransaction[];
}

export interface UnmatchedPayment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: string;
  billNumber: string;
  project?: string;
  vendor?: string;
}

export interface ImportRow {
  transactionDate: string;
  deposit?: number;
  withdrawal?: number;
  referenceNumber?: string;
  description?: string;
  category?: string;
}

export interface AutoReconcileResult {
  scanned: number;
  matched: number;
  partiallyMatched: number;
  stillUnmatched: number;
}

export const RECONCILIATION_STATUS_OPTIONS = ["UNMATCHED", "PARTIALLY_MATCHED", "MATCHED"];
export const RECONCILIATION_STATUS_LABELS: Record<string, string> = {
  UNMATCHED: "Unmatched",
  PARTIALLY_MATCHED: "Partially Matched",
  MATCHED: "Matched",
};
export const RECONCILIATION_STATUS_COLORS: Record<string, string> = {
  UNMATCHED: "bg-red-100 text-red-700",
  PARTIALLY_MATCHED: "bg-amber-100 text-amber-700",
  MATCHED: "bg-emerald-100 text-emerald-700",
};

export const TRANSACTION_CATEGORIES = ["Client Receipt", "Vendor Payment", "Bank Charges", "Interest Income", "Transfer", "Salary", "Tax", "Other"];

export async function getBankAccountsWithBalances(): Promise<BankAccountBalance[]> {
  const response = await api.get<{ success: boolean; data: BankAccountBalance[] }>("/bank-transactions/accounts");
  return response.data.data;
}

export async function getBankTransactions(query?: BankTransactionListQuery): Promise<BankTransactionListResponse> {
  const response = await api.get<BankTransactionListResponse>("/bank-transactions", { params: query });
  return response.data;
}

export async function getBankTransaction(id: string): Promise<BankTransaction> {
  const response = await api.get<{ success: boolean; data: BankTransaction }>(`/bank-transactions/${id}`);
  return response.data.data;
}

export async function createBankTransaction(data: BankTransactionFormData): Promise<BankTransaction> {
  const response = await api.post<{ success: boolean; data: BankTransaction }>("/bank-transactions", data);
  return response.data.data;
}

export async function updateBankTransaction(id: string, data: Partial<BankTransactionFormData>): Promise<BankTransaction> {
  const response = await api.put<{ success: boolean; data: BankTransaction }>(`/bank-transactions/${id}`, data);
  return response.data.data;
}

export async function deleteBankTransaction(id: string): Promise<void> {
  await api.delete(`/bank-transactions/${id}`);
}

export async function matchBankTransaction(id: string, data: { runningBillPaymentId?: string; vendorPaymentId?: string }): Promise<BankTransaction> {
  const response = await api.post<{ success: boolean; data: BankTransaction }>(`/bank-transactions/${id}/match`, data);
  return response.data.data;
}

export async function unmatchBankTransaction(id: string): Promise<BankTransaction> {
  const response = await api.post<{ success: boolean; data: BankTransaction }>(`/bank-transactions/${id}/unmatch`);
  return response.data.data;
}

export async function runAutoReconcile(companyBankAccountId?: string): Promise<AutoReconcileResult> {
  const response = await api.post<{ success: boolean; data: AutoReconcileResult }>("/bank-transactions/reconcile/auto", null, { params: { companyBankAccountId } });
  return response.data.data;
}

export async function getUnmatchedRunningBillPayments(companyBankAccountId?: string): Promise<UnmatchedPayment[]> {
  const response = await api.get<{ success: boolean; data: UnmatchedPayment[] }>("/bank-transactions/unmatched/running-bill-payments", { params: { companyBankAccountId } });
  return response.data.data;
}

export async function getUnmatchedVendorPayments(companyBankAccountId?: string): Promise<UnmatchedPayment[]> {
  const response = await api.get<{ success: boolean; data: UnmatchedPayment[] }>("/bank-transactions/unmatched/vendor-payments", { params: { companyBankAccountId } });
  return response.data.data;
}

export async function importBankTransactions(companyBankAccountId: string, rows: ImportRow[]): Promise<{ batchId: string; count: number; data: BankTransaction[] }> {
  const response = await api.post<{ success: boolean; data: { batchId: string; count: number; data: BankTransaction[] } }>("/bank-transactions/import", { companyBankAccountId, rows });
  return response.data.data;
}

export async function exportBankTransactionsCSV(query?: BankTransactionListQuery): Promise<void> {
  const response = await api.get("/bank-transactions/export", { params: query, responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `bank-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
