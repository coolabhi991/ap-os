import api from "./api";

export interface LabourPayment {
  id: string;
  companyId: string;
  labourId: string;
  labour: { id: string; name: string; category: string; contractorId: string | null } | null;
  projectId: string;
  project: { id: string; name: string } | null;
  amount: string;
  paymentDate: string;
  periodFrom: string;
  periodTo: string;
  mode: string;
  companyBankAccountId: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string } | null;
  expenseId: string;
  expense: { id: string; expenseNumber: string } | null;
  remarks: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabourPaymentFormData {
  labourId: string;
  projectId: string;
  siteId: string;
  amount: number;
  paymentDate: string;
  periodFrom: string;
  periodTo: string;
  mode: string;
  companyBankAccountId: string;
  remarks: string;
  logAsExpense: boolean;
}

export interface LabourPaymentListQuery {
  search?: string;
  labourId?: string;
  projectId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface LabourPaymentListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: LabourPayment[];
}

export const PAYMENT_MODE_OPTIONS = ["CASH", "COMPANY_BANK"];

export const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  COMPANY_BANK: "Company Bank",
};

export async function getLabourPayments(query?: LabourPaymentListQuery): Promise<LabourPaymentListResponse> {
  const response = await api.get<LabourPaymentListResponse>("/labour-payments", { params: query });
  return response.data;
}

export async function getLabourPayment(id: string): Promise<LabourPayment> {
  const response = await api.get<{ success: boolean; data: LabourPayment }>(`/labour-payments/${id}`);
  return response.data.data;
}

export async function createLabourPayment(data: LabourPaymentFormData): Promise<LabourPayment> {
  const response = await api.post<{ success: boolean; data: LabourPayment }>("/labour-payments", data);
  return response.data.data;
}

export async function deleteLabourPayment(id: string): Promise<void> {
  await api.delete(`/labour-payments/${id}`);
}

/** Triggers a browser download of the (optionally filtered) payments as CSV. */
export async function exportLabourPaymentsCSV(query?: LabourPaymentListQuery): Promise<void> {
  const response = await api.get("/labour-payments/export", { params: query, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `labour-payments-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
