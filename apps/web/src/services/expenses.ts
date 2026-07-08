import api from "./api";

export interface Expense {
  id: string;
  companyId: string;
  projectId: string;
  project: { id: string; name: string } | null;
  categoryId: string;
  category: { id: string; name: string } | null;
  vendorId: string;
  vendor: { id: string; name: string } | null;
  expenseNumber: string;
  expenseDate: string;
  description: string;
  amount: string;
  paymentMode: string;
  companyBankAccountId: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string } | null;
  attachmentFileName: string;
  attachmentFileUrl: string;
  remarks: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  projectId: string;
  categoryId: string;
  vendorId: string;
  expenseDate: string;
  description: string;
  amount: number;
  paymentMode: string;
  companyBankAccountId: string;
  attachmentFileName: string;
  attachmentFileUrl: string;
  remarks: string;
}

export interface ExpenseListQuery {
  search?: string;
  projectId?: string;
  vendorId?: string;
  categoryId?: string;
  paymentMode?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ExpenseListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: Expense[];
}

export interface ExpenseDashboardSummary {
  today: { amount: string; count: number };
  thisMonth: { amount: string; count: number };
  byProject: Array<{ projectId: string; projectName: string; amount: string; count: number }>;
  byCategory: Array<{ categoryId: string; categoryName: string; amount: string; count: number }>;
  byPaymentMode: Array<{ mode: string; amount: string; count: number }>;
  outstandingVendorCredit: { amount: string; count: number };
  recentExpenses: Expense[];
}

export interface ProjectExpenseSummaryRow {
  projectId: string;
  projectName: string;
  totalAmount: string;
  count: number;
}

export interface CategoryExpenseSummaryRow {
  categoryId: string;
  categoryName: string;
  totalAmount: string;
  count: number;
}

export interface MonthlyExpenseSummaryRow {
  month: string;
  totalAmount: string;
  count: number;
}

export interface VendorCreditSummaryRow {
  vendorId: string;
  vendorName: string;
  totalAmount: string;
  count: number;
}

export const PAYMENT_MODE_OPTIONS = ["CASH", "COMPANY_BANK", "CREDIT_CARD", "VENDOR_CREDIT"];

export const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  COMPANY_BANK: "Company Bank",
  CREDIT_CARD: "Credit Card",
  VENDOR_CREDIT: "Vendor Credit",
};

export const PAYMENT_MODE_COLORS: Record<string, string> = {
  CASH: "bg-emerald-100 text-emerald-700",
  COMPANY_BANK: "bg-blue-100 text-blue-700",
  CREDIT_CARD: "bg-purple-100 text-purple-700",
  VENDOR_CREDIT: "bg-amber-100 text-amber-700",
};

export async function getExpenses(query?: ExpenseListQuery): Promise<ExpenseListResponse> {
  const response = await api.get<ExpenseListResponse>("/expenses", { params: query });
  return response.data;
}

export async function getExpense(id: string): Promise<Expense> {
  const response = await api.get<{ success: boolean; data: Expense }>(`/expenses/${id}`);
  return response.data.data;
}

export async function createExpense(data: ExpenseFormData): Promise<Expense> {
  const response = await api.post<{ success: boolean; data: Expense }>("/expenses", data);
  return response.data.data;
}

export async function updateExpense(id: string, data: ExpenseFormData): Promise<Expense> {
  const response = await api.put<{ success: boolean; data: Expense }>(`/expenses/${id}`, data);
  return response.data.data;
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}

export async function getExpenseDashboard(): Promise<ExpenseDashboardSummary> {
  const response = await api.get<{ success: boolean; data: ExpenseDashboardSummary }>("/expenses/dashboard");
  return response.data.data;
}

export async function getProjectExpenseSummary(query?: { fromDate?: string; toDate?: string }): Promise<ProjectExpenseSummaryRow[]> {
  const response = await api.get<{ success: boolean; data: ProjectExpenseSummaryRow[] }>("/expenses/reports/project-summary", { params: query });
  return response.data.data;
}

export async function getCategoryExpenseSummary(query?: { fromDate?: string; toDate?: string }): Promise<CategoryExpenseSummaryRow[]> {
  const response = await api.get<{ success: boolean; data: CategoryExpenseSummaryRow[] }>("/expenses/reports/category-summary", { params: query });
  return response.data.data;
}

export async function getMonthlyExpenseSummary(query?: { fromDate?: string; toDate?: string }): Promise<MonthlyExpenseSummaryRow[]> {
  const response = await api.get<{ success: boolean; data: MonthlyExpenseSummaryRow[] }>("/expenses/reports/monthly-summary", { params: query });
  return response.data.data;
}

export async function getVendorCreditSummary(query?: { fromDate?: string; toDate?: string }): Promise<VendorCreditSummaryRow[]> {
  const response = await api.get<{ success: boolean; data: VendorCreditSummaryRow[] }>("/expenses/reports/vendor-credit-summary", { params: query });
  return response.data.data;
}

/** Triggers a browser download of the (optionally filtered) expenses as CSV. */
export async function exportExpensesCSV(query?: ExpenseListQuery): Promise<void> {
  const response = await api.get("/expenses/export", { params: query, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `expenses-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
