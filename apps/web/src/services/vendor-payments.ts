import api from "./api";

export interface PaymentBankAccountRef {
  id: string;
  nickname: string | null;
  beneficiaryName: string | null;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string | null;
}

export interface VendorPayment {
  id: string;
  companyId: string;
  vendorId: string;
  vendor: { id: string; name: string } | null;
  projectId: string;
  project: { id: string; name: string } | null;
  vendorBillId: string;
  vendorBill: { id: string; billNumber: string; totalAmount: string; outstandingBalance: string; status: string } | null;
  companyBankAccountId: string;
  companyBankAccount: PaymentBankAccountRef | null;
  vendorBankAccountId: string;
  vendorBankAccount: PaymentBankAccountRef | null;
  paymentNumber: string;
  paymentDate: string;
  amount: string;
  mode: string;
  referenceNumber: string;
  attachmentFileName: string;
  attachmentFileUrl: string;
  remarks: string;
  paidToOtherParty: boolean;
  paidToName: string;
  paidToReason: string;
  status: string;
  sourceBankTransaction: SourceBankTransaction | null;
  createdAt: string;
  updatedAt: string;
}

/** Where this payment's money actually moved, if it was created by allocating a Bank Transaction (Banking Integration traceability) — null when entered directly. */
export interface SourceBankTransaction {
  id: string;
  transactionDate: string;
  referenceNumber: string;
  amount: string;
  companyBankAccountId: string;
  bankAccountLabel: string;
}

export interface RecordVendorPaymentInput {
  vendorBillId: string;
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

export interface VendorProjectBreakdownRow {
  project: { id: string; name: string } | null;
  workDone: string;
  billAmount: string;
  paidAmount: string;
  outstanding: string;
  billCount: number;
}

export interface VendorPaymentListQuery {
  search?: string;
  vendorId?: string;
  vendorBillId?: string;
  mode?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VendorPaymentListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: VendorPayment[];
}

export interface VendorLedgerEntry {
  date: string;
  type: "BILL" | "PAYMENT";
  reference: string;
  debit: string;
  credit: string;
  balance: string;
}

export interface VendorLedger {
  vendor: { id: string; name: string };
  totalBilled: string;
  totalPaid: string;
  outstandingBalance: string;
  entries: VendorLedgerEntry[];
}

export interface VendorPaymentDashboardSummary {
  totalPayments: number;
  totalPaidAmount: string;
  paidToday: string;
  paidThisMonth: string;
  byMode: Array<{ mode: string; count: number; amount: string }>;
  recentPayments: VendorPayment[];
  topOutstandingVendors: Array<{ vendorId: string; vendorName: string; outstandingBalance: string }>;
}

export const PAYMENT_MODE_OPTIONS = ["CASH", "BANK", "CHEQUE", "UPI", "NEFT", "RTGS"];

export const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK: "Bank Transfer",
  CHEQUE: "Cheque",
  UPI: "UPI",
  NEFT: "NEFT",
  RTGS: "RTGS",
};

export async function getVendorPayments(query?: VendorPaymentListQuery): Promise<VendorPaymentListResponse> {
  const response = await api.get<VendorPaymentListResponse>("/vendor-payments", { params: query });
  return response.data;
}

export async function getVendorPayment(id: string): Promise<VendorPayment> {
  const response = await api.get<{ success: boolean; data: VendorPayment }>(`/vendor-payments/${id}`);
  return response.data.data;
}

export async function recordVendorPayment(data: RecordVendorPaymentInput): Promise<VendorPayment> {
  const response = await api.post<{ success: boolean; data: VendorPayment }>("/vendor-payments", data);
  return response.data.data;
}

export async function getVendorLedger(vendorId: string, query?: { fromDate?: string; toDate?: string }): Promise<VendorLedger> {
  const response = await api.get<{ success: boolean; data: VendorLedger }>("/vendor-payments/ledger", {
    params: { vendorId, ...query },
  });
  return response.data.data;
}

export async function getVendorProjectBreakdown(vendorId: string): Promise<VendorProjectBreakdownRow[]> {
  const response = await api.get<{ success: boolean; data: VendorProjectBreakdownRow[] }>("/vendor-payments/project-breakdown", { params: { vendorId } });
  return response.data.data;
}

export async function getVendorPaymentDashboard(): Promise<VendorPaymentDashboardSummary> {
  const response = await api.get<{ success: boolean; data: VendorPaymentDashboardSummary }>("/vendor-payments/dashboard");
  return response.data.data;
}

/** Triggers a browser download of the (optionally filtered) vendor payments as CSV. */
export async function exportVendorPaymentsCSV(query?: VendorPaymentListQuery): Promise<void> {
  const response = await api.get("/vendor-payments/export", { params: query, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `vendor-payments-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
