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
  allocationStatus: string;
  allocationCount: number;
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
}

export interface BankTransactionListQuery {
  search?: string;
  companyBankAccountId?: string;
  projectId?: string;
  allocationStatus?: string;
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

export interface ImportRow {
  transactionDate: string;
  deposit?: number;
  withdrawal?: number;
  referenceNumber?: string;
  description?: string;
  category?: string;
}

export const ALLOCATION_STATUS_OPTIONS = ["UNALLOCATED", "PARTIALLY_ALLOCATED", "FULLY_ALLOCATED"];
export const ALLOCATION_STATUS_LABELS: Record<string, string> = {
  UNALLOCATED: "Unallocated",
  PARTIALLY_ALLOCATED: "Partially Allocated",
  FULLY_ALLOCATED: "Fully Allocated",
};
export const ALLOCATION_STATUS_COLORS: Record<string, string> = {
  UNALLOCATED: "bg-red-100 text-red-700",
  PARTIALLY_ALLOCATED: "bg-amber-100 text-amber-700",
  FULLY_ALLOCATED: "bg-emerald-100 text-emerald-700",
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

/** MANUAL rows only — imported statement lines are read-only and rejected by the backend. */
export async function updateBankTransaction(id: string, data: Partial<BankTransactionFormData>): Promise<BankTransaction> {
  const response = await api.put<{ success: boolean; data: BankTransaction }>(`/bank-transactions/${id}`, data);
  return response.data.data;
}

export async function deleteBankTransaction(id: string): Promise<void> {
  await api.delete(`/bank-transactions/${id}`);
}

export interface ImportSummary {
  batchId: string;
  totalFound: number;
  imported: number;
  skippedDuplicates: number;
  count: number;
  data: BankTransaction[];
}

export async function importBankTransactions(
  companyBankAccountId: string,
  rows: ImportRow[],
  fileHash?: string,
  fileName?: string
): Promise<ImportSummary> {
  const response = await api.post<{ success: boolean; data: ImportSummary }>("/bank-transactions/import", {
    companyBankAccountId,
    rows,
    fileHash,
    fileName,
  });
  return response.data.data;
}

export interface StatementImportDuplicateCheck {
  duplicate: boolean;
  existingImport?: {
    id: string;
    fileName: string;
    importedAt: string;
    importedBy: string;
    totalRows: number;
    importedRows: number;
    skippedRows: number;
    periodFrom: string;
    periodTo: string;
  };
}

export async function checkStatementImportDuplicate(companyBankAccountId: string, fileHash: string): Promise<StatementImportDuplicateCheck> {
  const response = await api.post<{ success: boolean; data: StatementImportDuplicateCheck }>("/bank-transactions/import/check", {
    companyBankAccountId,
    fileHash,
  });
  return response.data.data;
}

export interface DuplicateTransactionGroup {
  fingerprint: string;
  count: number;
  transactions: BankTransaction[];
}

export async function getDuplicateBankTransactions(companyBankAccountId?: string): Promise<DuplicateTransactionGroup[]> {
  const response = await api.get<{ success: boolean; data: DuplicateTransactionGroup[] }>("/bank-transactions/duplicates", {
    params: { companyBankAccountId },
  });
  return response.data.data;
}

export async function deleteDuplicateBankTransaction(id: string, confirmAllocated = false): Promise<void> {
  await api.delete(`/bank-transactions/duplicates/${id}`, { data: { confirmAllocated } });
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
