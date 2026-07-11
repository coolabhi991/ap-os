import api from "./api";

export interface MBItem {
  id: string;
  sortOrder: number;
  subWorkId: string;
  boqItemNo: string;
  boqDescription: string;
  unit: string;
  length: string;
  breadth: string;
  height: string;
  quantity: string;
  boqRate: string;
  paymentPercent: string;
  effectiveRate: string;
  amount: string;
  previousQuantity: string;
  totalQuantity: string;
  previousAmount: string;
  totalAmount: string;
  remarks: string;
}

export interface MBItemInput {
  boqItemNo: string;
  boqDescription: string;
  unit: string;
  subWorkId?: string;
  length?: number;
  breadth?: number;
  height?: number;
  currentQuantity?: number;
  boqRate: number;
  paymentPercent?: number;
  previousQuantity?: number;
  fieldChangeReason?: string;
  remarks?: string;
}

export interface MBFieldAudit {
  id: string;
  boqItemNo: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason: string;
  changedById: string;
  changedByName: string;
  changedAt: string;
}

export interface MBRecapRow {
  sortOrder: number;
  subWorkId: string;
  boqItemNo: string;
  boqDescription: string;
  unit: string;
  boqRate: string;
  previousQuantity: string;
  currentQuantity: string;
}

export interface MB {
  id: string;
  companyId: string;
  projectId: string;
  project: { id: string; name: string; location: string | null } | null;
  siteId: string;
  subWorkId: string;
  subWork: { id: string; name: string } | null;
  mbNumber: string;
  raBillNumber: string;
  mbDate: string;
  site: string;
  engineerId: string;
  engineer: { id: string; name: string; email: string } | null;
  contractorId: string;
  contractor: { id: string; name: string } | null;
  status: string;
  remarks: string;
  abstractPdfUrl: string;
  abstractPdfName: string;
  sourceRecapRevisionId: string;
  items: MBItem[];
  totalQuantity: string;
  totalAmount: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface MBFormData {
  projectId: string;
  siteId: string;
  subWorkId?: string;
  mbNumber: string;
  raBillNumber?: string;
  mbDate: string;
  site?: string;
  engineerId?: string;
  contractorId?: string;
  status?: string;
  remarks?: string;
  abstractPdfUrl?: string;
  abstractPdfName?: string;
  sourceRecapRevisionId?: string;
  items?: MBItemInput[];
}

export interface MBListQuery {
  search?: string;
  projectId?: string;
  siteId?: string;
  subWorkId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface MBListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: MB[];
}

export interface ReportQuery {
  projectId?: string;
  subWorkId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface MBRegisterRow {
  id: string;
  mbNumber: string;
  mbDate: string;
  project: { id: string; name: string } | null;
  subWork: { id: string; name: string } | null;
  engineer: { id: string; name: string } | null;
  contractor: { id: string; name: string } | null;
  status: string;
  totalQuantity: string;
  totalAmount: string;
  itemCount: number;
}

export interface AbstractRegisterRow extends MBItem {
  mbId: string;
  mbNumber: string;
  mbDate: string;
  project: string;
  subWork: string;
  status: string;
}

export interface ItemWiseQuantityRow {
  boqItemNo: string;
  boqDescription: string;
  unit: string;
  totalQuantity: string;
  totalAmount: string;
  count: number;
}

export interface SubWorkQuantityRow {
  subWork: string;
  totalQuantity: string;
  totalAmount: string;
  count: number;
}

export interface PendingMBRow {
  id: string;
  mbNumber: string;
  mbDate: string;
  project: { id: string; name: string } | null;
  subWork: { id: string; name: string } | null;
  engineer: { id: string; name: string } | null;
  status: string;
  totalAmount: string;
  daysPending: number;
}

export const MB_STATUS_OPTIONS = ["DRAFT", "SUBMITTED", "APPROVED"];
export const MB_STATUS_LABELS: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Submitted", APPROVED: "Approved" };
export const MB_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
};

export const PAYMENT_PERCENT_PRESETS = [100, 95, 90, 75, 70];

export const EMAIL_RECIPIENT_ROLES = ["EXECUTIVE_ENGINEER", "DEPUTY_ENGINEER", "ASSISTANT_ENGINEER", "JUNIOR_ENGINEER", "CLIENT", "CUSTOM"];
export const EMAIL_RECIPIENT_ROLE_LABELS: Record<string, string> = {
  EXECUTIVE_ENGINEER: "Executive Engineer",
  DEPUTY_ENGINEER: "Deputy Engineer",
  ASSISTANT_ENGINEER: "Assistant Engineer",
  JUNIOR_ENGINEER: "Junior Engineer",
  CLIENT: "Client",
  CUSTOM: "Custom Email",
};

export async function getMBs(query?: MBListQuery): Promise<MBListResponse> {
  const response = await api.get<MBListResponse>("/measurement-books", { params: query });
  return response.data;
}

export async function getMB(id: string): Promise<MB> {
  const response = await api.get<{ success: boolean; data: MB }>(`/measurement-books/${id}`);
  return response.data.data;
}

export async function createMB(data: MBFormData): Promise<MB> {
  const response = await api.post<{ success: boolean; data: MB }>("/measurement-books", data);
  return response.data.data;
}

export async function updateMB(id: string, data: Partial<MBFormData>): Promise<MB> {
  const response = await api.put<{ success: boolean; data: MB }>(`/measurement-books/${id}`, data);
  return response.data.data;
}

export async function deleteMB(id: string): Promise<void> {
  await api.delete(`/measurement-books/${id}`);
}

export async function getMBRowsFromRecapitulation(siteId: string): Promise<{ sourceRecapRevisionId: string; items: MBRecapRow[] }> {
  const response = await api.get<{ success: boolean; data: { sourceRecapRevisionId: string; items: MBRecapRow[] } }>("/measurement-books/from-recapitulation", { params: { siteId } });
  return response.data.data;
}

export async function getMBFieldAudits(id: string): Promise<MBFieldAudit[]> {
  const response = await api.get<{ success: boolean; data: MBFieldAudit[] }>(`/measurement-books/${id}/field-audits`);
  return response.data.data;
}

export async function getMBRegisterReport(query?: ReportQuery): Promise<MBRegisterRow[]> {
  const response = await api.get<{ success: boolean; data: MBRegisterRow[] }>("/measurement-books/reports/register", { params: query });
  return response.data.data;
}

export async function getAbstractRegisterReport(query?: ReportQuery): Promise<AbstractRegisterRow[]> {
  const response = await api.get<{ success: boolean; data: AbstractRegisterRow[] }>("/measurement-books/reports/abstract-register", { params: query });
  return response.data.data;
}

export async function getItemWiseQuantityReport(query?: ReportQuery): Promise<ItemWiseQuantityRow[]> {
  const response = await api.get<{ success: boolean; data: ItemWiseQuantityRow[] }>("/measurement-books/reports/item-wise-quantity", { params: query });
  return response.data.data;
}

export async function getSubWorkQuantityReport(query?: ReportQuery): Promise<SubWorkQuantityRow[]> {
  const response = await api.get<{ success: boolean; data: SubWorkQuantityRow[] }>("/measurement-books/reports/sub-work-quantity", { params: query });
  return response.data.data;
}

export async function getPendingMBReport(query?: ReportQuery): Promise<PendingMBRow[]> {
  const response = await api.get<{ success: boolean; data: PendingMBRow[] }>("/measurement-books/reports/pending", { params: query });
  return response.data.data;
}

export async function exportAbstractRegisterCSV(query?: ReportQuery): Promise<void> {
  const response = await api.get("/measurement-books/reports/export", { params: query, responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `abstract-register-${new Date().toISOString().slice(0, 10)}.csv`);
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

export async function exportMBPdf(id: string, mbNumber: string): Promise<void> {
  await downloadBlob(`/measurement-books/${id}/export/pdf`, `${mbNumber}.pdf`);
}

export async function exportMBExcel(id: string, mbNumber: string): Promise<void> {
  await downloadBlob(`/measurement-books/${id}/export/excel`, `${mbNumber}.xlsx`);
}

export interface EmailRecipient {
  label: string;
  email: string;
}

export interface SendMBEmailInput {
  recipients: EmailRecipient[];
  includeExcel?: boolean;
  message?: string;
}

export interface MBEmailLog {
  id: string;
  recipients: EmailRecipient[];
  includedExcel: boolean;
  sentAt: string;
  status: string;
  errorMessage: string;
}

export async function sendMBEmail(id: string, data: SendMBEmailInput): Promise<MBEmailLog> {
  const response = await api.post<{ success: boolean; data: MBEmailLog }>(`/measurement-books/${id}/email`, data);
  return response.data.data;
}

export async function getMBEmailLogs(id: string): Promise<MBEmailLog[]> {
  const response = await api.get<{ success: boolean; data: MBEmailLog[] }>(`/measurement-books/${id}/email-logs`);
  return response.data.data;
}
