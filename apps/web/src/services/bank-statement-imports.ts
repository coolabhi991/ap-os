import api from "./api";

export interface ImportedStatement {
  id: string;
  companyBankAccountId: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string } | null;
  fileName: string;
  periodFrom: string;
  periodTo: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  transactionCount: number;
  importBatchId: string;
  isDeleted: boolean;
  deletedAt: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface ImportedStatementListQuery {
  companyBankAccountId?: string;
  status?: "active" | "deleted" | "all";
  page?: number;
  limit?: number;
}

export interface ImportedStatementListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: ImportedStatement[];
}

export interface StatementAuditLogEntry {
  id: string;
  action: "IMPORTED" | "DELETED" | "RESTORED";
  performedById: string;
  performedBy: string;
  performedAt: string;
  notes: string;
}

export interface StatementSummary {
  statement: ImportedStatement;
  totalTransactions: number;
  allocatedTransactions: number;
  unallocatedTransactions: number;
  ledgerBackedAllocationCount: number;
  totalDeposit: string;
  totalWithdrawal: string;
  auditLog: StatementAuditLogEntry[];
}

export const STATEMENT_AUDIT_ACTION_LABELS: Record<string, string> = {
  IMPORTED: "Imported",
  DELETED: "Deleted",
  RESTORED: "Restored",
};

export async function getImportedStatements(query?: ImportedStatementListQuery): Promise<ImportedStatementListResponse> {
  const response = await api.get<ImportedStatementListResponse>("/bank-statement-imports", { params: query });
  return response.data;
}

export async function getStatementSummary(id: string): Promise<StatementSummary> {
  const response = await api.get<{ success: boolean; data: StatementSummary }>(`/bank-statement-imports/${id}/summary`);
  return response.data.data;
}

/** Soft delete only — the statement and its transactions become inactive everywhere (Banking, Allocation, Reports, Dashboard); nothing is destroyed and Restore reverses it exactly. */
export async function deleteStatement(id: string): Promise<void> {
  await api.delete(`/bank-statement-imports/${id}`);
}

export async function restoreStatement(id: string): Promise<void> {
  await api.post(`/bank-statement-imports/${id}/restore`);
}
