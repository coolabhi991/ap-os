import api from "./api";

export interface RunningBillItem {
  id: string;
  sortOrder: number;
  siteBillItemId: string;
  subWorkId: string;
  subWorkName: string;
  boqItemNo: string;
  boqDescription: string;
  unit: string;
  previousQuantity: string;
  currentQuantity: string;
  totalQuantity: string;
  boqRate: string;
  paymentPercent: string;
  effectiveRate: string;
  previousAmount: string;
  currentAmount: string;
  nowToPayAmount: string;
  totalAmount: string;
  remarks: string;
}

export interface RunningBillDeduction {
  id: string;
  type: string;
  label: string;
  amount: string;
  remarks: string;
}

export interface RunningBillDeductionInput {
  type: string;
  label?: string;
  amount: number;
  remarks?: string;
}

export interface RunningBill {
  id: string;
  companyId: string;
  projectId: string;
  project: { id: string; name: string; location: string | null; contractValue: string } | null;
  siteId: string;
  siteRecord: { id: string; name: string } | null;
  subWorkId: string;
  subWork: { id: string; name: string } | null;
  measurementBookId: string;
  measurementBook: { id: string; mbNumber: string; mbDate: string } | null;
  raSequence: number | null;
  billNumber: string;
  billType: string;
  site: string;
  billDate: string;
  billSubmittedDate: string;
  previousCertifiedAmount: string;
  currentCertifiedAmount: string;
  totalCertifiedAmount: string;
  // Form 58 calculation flow — frozen at creation, never recalculated afterward.
  tenderAboveBelowPercent: string;
  tenderAdjustmentAmount: string;
  adjustedTotal: string;
  gstPercent: string;
  gstAmount: string;
  gstDifferencePercent: string;
  gstDifferenceAmount: string;
  totalGstAmount: string;
  grossBillAmount: string;
  roundOff: string;
  finalBillAmount: string;
  totalDeductions: string;
  netPayable: string;
  amountReceived: string;
  outstandingAmount: string;
  status: string;
  submittedAt: string;
  passedAt: string;
  remarks: string;
  items: RunningBillItem[];
  deductions: RunningBillDeduction[];
  createdById: string;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface RunningBillFormData {
  measurementBookId: string;
  billNumber: string;
  billType?: string;
  site?: string;
  billDate?: string;
  billSubmittedDate?: string;
  remarks?: string;
  deductions?: RunningBillDeductionInput[];
}

export interface Form58ItemInput {
  siteBillItemId?: string;
  itemNo?: string;
  description?: string;
  unit?: string;
  rate?: number;
  subWorkId?: string;
  currentQuantity: number;
  remarks?: string;
}

export interface Form58BillFormData {
  siteId: string;
  billNumber?: string;
  billType?: string;
  billDate?: string;
  billSubmittedDate?: string;
  remarks?: string;
  items: Form58ItemInput[];
  deductions?: RunningBillDeductionInput[];
  gstDifferencePercent?: number;
}

export interface NextRABillDraftItem {
  siteBillItemId: string;
  itemNo: string;
  description: string;
  unit: string;
  rate: string;
  subWorkId: string;
  subWorkName: string;
  previousQuantity: string;
  currentQuantity: string;
}

export interface NextRABillDraftSubWork {
  id: string;
  name: string;
}

export interface NextRABillDraft {
  siteId: string;
  nextRaSequence: number;
  suggestedBillNumber: string;
  isFirstBill: boolean;
  // Final Bill Rules — true once this Site already has a Final Bill; no further bill of any type
  // may be created until it's cancelled.
  isBillingCompleted: boolean;
  // Every Sub Work for this Site (from the Recapitulation Register), including ones with no
  // billable item yet — each always gets its own "+ Add Item" section, never an Unassigned bucket.
  subWorks: NextRABillDraftSubWork[];
  items: NextRABillDraftItem[];
  tenderAboveBelowPercent: string;
  gstPercent: string;
}

export interface RunningBillListQuery {
  search?: string;
  projectId?: string;
  siteId?: string;
  subWorkId?: string;
  status?: string;
  billType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface RunningBillListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: RunningBill[];
}

export interface ReportQuery {
  projectId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
}

export interface OutstandingBillRow {
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
}

export interface PaymentRegisterRow {
  id: string;
  runningBillId: string;
  runningBill: { id: string; billNumber: string } | null;
  projectId: string;
  project: { id: string; name: string } | null;
  companyBankAccountId: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string; ifscCode: string } | null;
  paymentNumber: string;
  paymentDate: string;
  amount: string;
  mode: string;
  referenceNumber: string;
  remarks: string;
  sourceBankTransaction: SourceBankTransaction | null;
  createdAt: string;
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

export interface RecoveryRegisterRow {
  billId: string;
  billNumber: string;
  billDate: string;
  project: string;
  type: string;
  label: string;
  amount: string;
  remarks: string;
}

export interface ProjectBillingSummaryRow {
  projectId: string;
  projectName: string;
  contractValue: string;
  billsSubmittedCount: number;
  totalBillsSubmitted: string;
  totalAmountReceived: string;
  outstandingAmount: string;
  balanceContractValue: string;
}

export interface RecordPaymentInput {
  amount: number;
  paymentDate?: string;
  mode: string;
  companyBankAccountId?: string;
  referenceNumber?: string;
  remarks?: string;
}

export const RB_STATUS_OPTIONS = ["DRAFT", "SUBMITTED", "PASSED", "PARTLY_PAID", "FULLY_PAID"];
export const RB_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PASSED: "Passed",
  PARTLY_PAID: "Partly Paid",
  FULLY_PAID: "Fully Paid",
};
export const RB_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  PASSED: "bg-blue-100 text-blue-700",
  PARTLY_PAID: "bg-orange-100 text-orange-700",
  FULLY_PAID: "bg-emerald-100 text-emerald-700",
};

export const BILL_TYPE_OPTIONS = ["RA_BILL", "FINAL_BILL", "ADVANCE_BILL"];
export const BILL_TYPE_LABELS: Record<string, string> = {
  RA_BILL: "RA Bill",
  FINAL_BILL: "Final Bill",
  ADVANCE_BILL: "Advance Bill",
};

// GST is no longer a manual deduction — it's calculated automatically as part of the Form 58 flow
// (Adjusted Total -> GST -> Gross Bill Amount). GST_STATE/GST_CENTRAL/GST stay in the labels map
// so historical deduction rows still display correctly, but are not offered for new deductions.
export const DEDUCTION_TYPE_OPTIONS = [
  "SECURITY_DEPOSIT",
  "TDS",
  "INCOME_TAX",
  "ROYALTY",
  "LABOUR_CESS",
  "INSURANCE",
  "MOBILIZATION_RECOVERY",
  "MSEB",
  "FINE",
  "OTHER",
];
export const DEDUCTION_TYPE_LABELS: Record<string, string> = {
  SECURITY_DEPOSIT: "Security Deposit",
  TDS: "GST TDS",
  INCOME_TAX: "Income Tax",
  ROYALTY: "Royalty",
  LABOUR_CESS: "Labour Cess",
  INSURANCE: "Insurance",
  MOBILIZATION_RECOVERY: "Mobilization Recovery",
  MSEB: "MSEB",
  FINE: "Fine",
  OTHER: "Other",
  GST_STATE: "GST State",
  GST_CENTRAL: "GST Central",
  GST: "GST (legacy)",
};

export const PAYMENT_MODES = ["CASH", "BANK", "CHEQUE", "UPI", "NEFT", "RTGS"];

export const EMAIL_RECIPIENT_ROLES = ["EXECUTIVE_ENGINEER", "DEPUTY_ENGINEER", "ASSISTANT_ENGINEER", "JUNIOR_ENGINEER", "CLIENT", "CUSTOM"];
export const EMAIL_RECIPIENT_ROLE_LABELS: Record<string, string> = {
  EXECUTIVE_ENGINEER: "Executive Engineer",
  DEPUTY_ENGINEER: "Deputy Engineer",
  ASSISTANT_ENGINEER: "Assistant Engineer",
  JUNIOR_ENGINEER: "Junior Engineer",
  CLIENT: "Client",
  CUSTOM: "Custom Email",
};

export async function getRunningBills(query?: RunningBillListQuery): Promise<RunningBillListResponse> {
  const response = await api.get<RunningBillListResponse>("/running-bills", { params: query });
  return response.data;
}

export async function getRunningBill(id: string): Promise<RunningBill> {
  const response = await api.get<{ success: boolean; data: RunningBill }>(`/running-bills/${id}`);
  return response.data.data;
}

export async function updateRunningBill(id: string, data: Partial<RunningBillFormData> & { items?: Form58ItemInput[]; gstDifferencePercent?: number }): Promise<RunningBill> {
  const response = await api.put<{ success: boolean; data: RunningBill }>(`/running-bills/${id}`, data);
  return response.data.data;
}

export async function getNextRABillDraft(siteId: string): Promise<NextRABillDraft> {
  const response = await api.get<{ success: boolean; data: NextRABillDraft }>("/running-bills/next-draft", { params: { siteId } });
  return response.data.data;
}

export async function createRunningBillFromForm58(data: Form58BillFormData): Promise<RunningBill> {
  const response = await api.post<{ success: boolean; data: RunningBill }>("/running-bills/form58", data);
  return response.data.data;
}

export async function deleteRunningBill(id: string): Promise<void> {
  await api.delete(`/running-bills/${id}`);
}

export async function submitRunningBill(id: string): Promise<RunningBill> {
  const response = await api.post<{ success: boolean; data: RunningBill }>(`/running-bills/${id}/submit`);
  return response.data.data;
}

export async function passRunningBill(id: string): Promise<RunningBill> {
  const response = await api.post<{ success: boolean; data: RunningBill }>(`/running-bills/${id}/pass`);
  return response.data.data;
}

export async function recordRunningBillPayment(id: string, data: RecordPaymentInput): Promise<RunningBill> {
  const response = await api.post<{ success: boolean; data: RunningBill }>(`/running-bills/${id}/payments`, data);
  return response.data.data;
}

export async function getRunningBillPayments(id: string): Promise<PaymentRegisterRow[]> {
  const response = await api.get<{ success: boolean; data: PaymentRegisterRow[] }>(`/running-bills/${id}/payments`);
  return response.data.data;
}

export async function getRunningBillRegisterReport(query?: ReportQuery): Promise<RunningBill[]> {
  const response = await api.get<{ success: boolean; data: RunningBill[] }>("/running-bills/reports/register", { params: query });
  return response.data.data;
}

export async function getOutstandingBillsReport(query?: { projectId?: string }): Promise<OutstandingBillRow[]> {
  const response = await api.get<{ success: boolean; data: OutstandingBillRow[] }>("/running-bills/reports/outstanding", { params: query });
  return response.data.data;
}

export async function getPaymentRegisterReport(query?: ReportQuery): Promise<PaymentRegisterRow[]> {
  const response = await api.get<{ success: boolean; data: PaymentRegisterRow[] }>("/running-bills/reports/payment-register", { params: query });
  return response.data.data;
}

export async function getRecoveryRegisterReport(query?: ReportQuery): Promise<RecoveryRegisterRow[]> {
  const response = await api.get<{ success: boolean; data: RecoveryRegisterRow[] }>("/running-bills/reports/recovery-register", { params: query });
  return response.data.data;
}

export async function getProjectBillingSummaryReport(query?: { projectId?: string }): Promise<ProjectBillingSummaryRow[]> {
  const response = await api.get<{ success: boolean; data: ProjectBillingSummaryRow[] }>("/running-bills/reports/project-billing-summary", { params: query });
  return response.data.data;
}

export async function exportRunningBillRegisterCSV(query?: ReportQuery): Promise<void> {
  const response = await api.get("/running-bills/reports/export", { params: query, responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `running-bill-register-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function downloadBlob(url: string, filename: string): Promise<void> {
  const response = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function exportRunningBillPdf(id: string, billNumber: string): Promise<void> {
  await downloadBlob(`/running-bills/${id}/export/pdf`, `${billNumber}.pdf`);
}

export async function exportRunningBillExcel(id: string, billNumber: string): Promise<void> {
  await downloadBlob(`/running-bills/${id}/export/excel`, `${billNumber}.xlsx`);
}

export interface EmailRecipient {
  label: string;
  email: string;
}

export interface SendRunningBillEmailInput {
  recipients: EmailRecipient[];
  includeExcel?: boolean;
  message?: string;
}

export interface RunningBillEmailLog {
  id: string;
  recipients: EmailRecipient[];
  includedExcel: boolean;
  sentAt: string;
  status: string;
  errorMessage: string;
}

export async function sendRunningBillEmail(id: string, data: SendRunningBillEmailInput): Promise<RunningBillEmailLog> {
  const response = await api.post<{ success: boolean; data: RunningBillEmailLog }>(`/running-bills/${id}/email`, data);
  return response.data.data;
}

export async function getRunningBillEmailLogs(id: string): Promise<RunningBillEmailLog[]> {
  const response = await api.get<{ success: boolean; data: RunningBillEmailLog[] }>(`/running-bills/${id}/email-logs`);
  return response.data.data;
}
