import api from "./api";

export interface VendorBillPayment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: string;
  mode: string;
  referenceNumber: string;
  attachmentFileName: string;
  attachmentFileUrl: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string } | null;
  vendorBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string } | null;
  remarks: string;
  paidToOtherParty: boolean;
  paidToName: string;
  paidToReason: string;
  status: string;
}

export interface VendorBill {
  id: string;
  companyId: string;
  vendorId: string;
  vendor: { id: string; name: string } | null;
  projectId: string;
  project: { id: string; name: string } | null;
  siteId: string;
  site: { id: string; name: string } | null;
  purchaseOrderId: string;
  purchaseOrder: { id: string; poNumber: string } | null;
  materialReceiptId: string;
  materialReceipt: { id: string; receiptNumber: string } | null;
  subWorkId: string;
  subWork: { id: string; name: string } | null;
  billNumber: string;
  billDate: string;
  dueDate: string;
  billAmount: string;
  taxableAmount: string;
  gstAmount: string;
  totalAmount: string;
  paidAmount: string;
  outstandingBalance: string;
  invoiceFileName: string;
  invoiceFileUrl: string;
  status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  isOverdue: boolean;
  notes: string;
  payments: VendorBillPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorBillFormData {
  vendorId: string;
  projectId: string;
  siteId: string;
  purchaseOrderId: string;
  subWorkId: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  billAmount: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  invoiceFileName: string;
  invoiceFileUrl: string;
  notes: string;
}

export interface VendorBillListQuery {
  search?: string;
  status?: string;
  vendorId?: string;
  projectId?: string;
  siteId?: string;
  fromDate?: string;
  toDate?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VendorBillListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: VendorBill[];
}

export interface RecordPaymentInput {
  amount: number;
  paymentDate?: string;
  mode: string;
  companyBankAccountId?: string;
  vendorBankAccountId?: string;
  referenceNumber?: string;
  attachmentFileName?: string;
  attachmentFileUrl?: string;
  remarks?: string;
  paidToOtherParty?: boolean;
  paidToName?: string;
  paidToReason?: string;
}

export interface VendorBillDashboardSummary {
  totalBills: number;
  countsByStatus: Record<string, number>;
  totalBilled: string;
  totalPaid: string;
  totalOutstanding: string;
  overdueCount: number;
  overdueAmount: string;
  overdueBills: VendorBill[];
  recentBills: VendorBill[];
}

export const VENDOR_BILL_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const VENDOR_BILL_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PARTIALLY_PAID: "bg-sky-100 text-sky-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-200 text-slate-500",
};

export async function getVendorBills(query?: VendorBillListQuery): Promise<VendorBillListResponse> {
  const response = await api.get<VendorBillListResponse>("/vendor-bills", { params: query });
  return response.data;
}

export async function getVendorBill(id: string): Promise<VendorBill> {
  const response = await api.get<{ success: boolean; data: VendorBill }>(`/vendor-bills/${id}`);
  return response.data.data;
}

export async function createVendorBill(data: VendorBillFormData): Promise<VendorBill> {
  const response = await api.post<{ success: boolean; data: VendorBill }>("/vendor-bills", data);
  return response.data.data;
}

export async function updateVendorBill(id: string, data: VendorBillFormData): Promise<VendorBill> {
  const response = await api.put<{ success: boolean; data: VendorBill }>(`/vendor-bills/${id}`, data);
  return response.data.data;
}

export async function recordVendorBillPayment(id: string, data: RecordPaymentInput): Promise<VendorBill> {
  const response = await api.post<{ success: boolean; data: VendorBill }>(`/vendor-bills/${id}/payments`, data);
  return response.data.data;
}

export async function cancelVendorBill(id: string): Promise<VendorBill> {
  const response = await api.post<{ success: boolean; data: VendorBill }>(`/vendor-bills/${id}/cancel`, {});
  return response.data.data;
}

export async function deleteVendorBill(id: string): Promise<void> {
  await api.delete(`/vendor-bills/${id}`);
}

export async function getVendorBillDashboard(): Promise<VendorBillDashboardSummary> {
  const response = await api.get<{ success: boolean; data: VendorBillDashboardSummary }>("/vendor-bills/dashboard");
  return response.data.data;
}

/** Triggers a browser download of the (optionally filtered) vendor bills as CSV. */
export async function exportVendorBillsCSV(query?: VendorBillListQuery): Promise<void> {
  const response = await api.get("/vendor-bills/export", { params: query, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `vendor-bills-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
