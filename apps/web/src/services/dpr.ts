import api from "./api";

export interface ManualMachineryEntry {
  machineType: string;
  hours: number;
  amount: number;
  remarks?: string;
}

export interface MachinerySummaryRow {
  id: string;
  expenseNumber: string;
  machineType: string;
  hours: string;
  amount: string;
  vendor: { id: string; name: string } | null;
  source: "AUTO";
}

export interface MaterialReceivedRow {
  id: string;
  receiptNumber: string;
  itemName: string;
  quantity: string;
  unit: string | null;
  vendor: { id: string; name: string } | null;
}

export interface MaterialIssuedRow {
  id: string;
  issueNumber: string;
  itemName: string;
  quantity: string;
  unit: string | null;
  purpose: string | null;
}

export interface MajorMaterialRow {
  itemName: string;
  quantity: string;
  unit: string;
}

export interface MaterialSummary {
  materialReceivedToday: MaterialReceivedRow[];
  materialIssuedToday: MaterialIssuedRow[];
  majorMaterialsUsed: MajorMaterialRow[];
}

export interface DPRVisitor {
  id: string;
  visitorType: string;
  name: string;
  remarks: string;
  createdAt: string;
}

export interface DPRSiteProblem {
  id: string;
  problemType: string;
  description: string;
  createdAt: string;
}

export interface DPR {
  id: string;
  companyId: string;
  projectId: string;
  project: { id: string; name: string; location: string | null } | null;
  siteId: string;
  subWorkId: string;
  subWork: { id: string; name: string } | null;
  dprNumber: string;
  reportDate: string;
  site: string;
  engineerId: string;
  engineer: { id: string; name: string; email: string } | null;
  contractorId: string;
  contractor: { id: string; name: string } | null;
  weather: string;
  shift: string;
  remarks: string;
  workDone: string;
  plannedWork: string;
  physicalProgressUpdate: number | null;
  delayReason: string;
  instructions: string;
  labourSkilled: number;
  labourUnskilled: number;
  labourSupervisor: number;
  labourOperator: number;
  labourTotal: number;
  labourManuallyAdjusted: boolean;
  manualMachineryEntries: ManualMachineryEntry[];
  visitors: DPRVisitor[];
  siteProblems: DPRSiteProblem[];
  createdById: string;
  createdBy: { id: string; name: string } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DPRDetail extends DPR {
  machinerySummary: MachinerySummaryRow[];
  materialSummary: MaterialSummary;
}

export interface DPRFormData {
  projectId: string;
  siteId: string;
  subWorkId?: string;
  reportDate: string;
  site?: string;
  engineerId?: string;
  contractorId?: string;
  weather?: string;
  shift: string;
  remarks?: string;
  workDone?: string;
  plannedWork?: string;
  physicalProgressUpdate?: number;
  delayReason?: string;
  instructions?: string;
  // Omit these 4 entirely (undefined) to let the backend auto-pull from Labour Attendance —
  // only send them when the engineer has explicitly toggled manual adjustment on.
  labourSkilled?: number;
  labourUnskilled?: number;
  labourSupervisor?: number;
  labourOperator?: number;
  manualMachineryEntries?: ManualMachineryEntry[];
  visitors?: { visitorType: string; name?: string; remarks?: string }[];
  siteProblems?: { problemType: string; description?: string }[];
}

export interface DPRListQuery {
  search?: string;
  projectId?: string;
  siteId?: string;
  subWorkId?: string;
  shift?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DPRListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: DPR[];
}

export interface AutoPullPreview {
  labourSkilled: number;
  labourUnskilled: number;
  labourSupervisor: number;
  labourOperator: number;
  labourTotal: number;
  machinerySummary: MachinerySummaryRow[];
  materialSummary: MaterialSummary;
}

export const SHIFT_OPTIONS = ["DAY", "NIGHT"];
export const SHIFT_LABELS: Record<string, string> = { DAY: "Day", NIGHT: "Night" };

export const VISITOR_TYPE_OPTIONS = ["EXECUTIVE_ENGINEER", "DEPUTY_ENGINEER", "ASSISTANT_ENGINEER", "JUNIOR_ENGINEER", "CONSULTANT", "CLIENT", "OTHER"];
export const VISITOR_TYPE_LABELS: Record<string, string> = {
  EXECUTIVE_ENGINEER: "Executive Engineer",
  DEPUTY_ENGINEER: "Deputy Engineer",
  ASSISTANT_ENGINEER: "Assistant Engineer",
  JUNIOR_ENGINEER: "Junior Engineer",
  CONSULTANT: "Consultant",
  CLIENT: "Client",
  OTHER: "Other",
};

export const SITE_PROBLEM_TYPE_OPTIONS = ["RAIN", "LABOUR_SHORTAGE", "MATERIAL_SHORTAGE", "MACHINERY_BREAKDOWN", "DRAWING_PENDING", "OTHER"];
export const SITE_PROBLEM_TYPE_LABELS: Record<string, string> = {
  RAIN: "Rain",
  LABOUR_SHORTAGE: "Labour Shortage",
  MATERIAL_SHORTAGE: "Material Shortage",
  MACHINERY_BREAKDOWN: "Machinery Breakdown",
  DRAWING_PENDING: "Drawing Pending",
  OTHER: "Other",
};

export const EMAIL_RECIPIENT_ROLES = ["EXECUTIVE_ENGINEER", "DEPUTY_ENGINEER", "ASSISTANT_ENGINEER", "JUNIOR_ENGINEER", "CLIENT", "CUSTOM"];
export const EMAIL_RECIPIENT_ROLE_LABELS: Record<string, string> = {
  EXECUTIVE_ENGINEER: "Executive Engineer",
  DEPUTY_ENGINEER: "Deputy Engineer",
  ASSISTANT_ENGINEER: "Assistant Engineer",
  JUNIOR_ENGINEER: "Junior Engineer",
  CLIENT: "Client",
  CUSTOM: "Custom Email",
};

export async function getDPRs(query?: DPRListQuery): Promise<DPRListResponse> {
  const response = await api.get<DPRListResponse>("/dpr", { params: query });
  return response.data;
}

export async function getDPR(id: string): Promise<DPRDetail> {
  const response = await api.get<{ success: boolean; data: DPRDetail }>(`/dpr/${id}`);
  return response.data.data;
}

export async function getAutoPullPreview(projectId: string, reportDate: string, subWorkId?: string): Promise<AutoPullPreview> {
  const response = await api.get<{ success: boolean; data: AutoPullPreview }>("/dpr/auto-pull", { params: { projectId, reportDate, subWorkId } });
  return response.data.data;
}

export async function createDPR(data: DPRFormData): Promise<DPR> {
  const response = await api.post<{ success: boolean; data: DPR }>("/dpr", data);
  return response.data.data;
}

export async function updateDPR(id: string, data: Partial<DPRFormData>): Promise<DPR> {
  const response = await api.put<{ success: boolean; data: DPR }>(`/dpr/${id}`, data);
  return response.data.data;
}

export async function deleteDPR(id: string): Promise<void> {
  await api.delete(`/dpr/${id}`);
}

export async function addVisitor(dprId: string, data: { visitorType: string; name?: string; remarks?: string }): Promise<DPRVisitor> {
  const response = await api.post<{ success: boolean; data: DPRVisitor }>(`/dpr/${dprId}/visitors`, data);
  return response.data.data;
}

export async function removeVisitor(dprId: string, visitorId: string): Promise<void> {
  await api.delete(`/dpr/${dprId}/visitors/${visitorId}`);
}

export async function addSiteProblem(dprId: string, data: { problemType: string; description?: string }): Promise<DPRSiteProblem> {
  const response = await api.post<{ success: boolean; data: DPRSiteProblem }>(`/dpr/${dprId}/site-problems`, data);
  return response.data.data;
}

export async function removeSiteProblem(dprId: string, problemId: string): Promise<void> {
  await api.delete(`/dpr/${dprId}/site-problems/${problemId}`);
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

export async function exportDPRPdf(id: string, dprNumber: string): Promise<void> {
  await downloadBlob(`/dpr/${id}/export/pdf`, `${dprNumber}.pdf`);
}

export async function exportDPRExcel(id: string, dprNumber: string): Promise<void> {
  await downloadBlob(`/dpr/${id}/export/excel`, `${dprNumber}.xlsx`);
}

export interface EmailRecipient {
  label: string;
  email: string;
}

export interface SendDPREmailInput {
  recipients: EmailRecipient[];
  includeExcel?: boolean;
  message?: string;
}

export interface DPREmailLog {
  id: string;
  recipients: EmailRecipient[];
  includedExcel: boolean;
  sentAt: string;
  status: string;
  errorMessage: string;
}

export async function sendDPREmail(id: string, data: SendDPREmailInput): Promise<DPREmailLog> {
  const response = await api.post<{ success: boolean; data: DPREmailLog }>(`/dpr/${id}/email`, data);
  return response.data.data;
}

export async function getDPREmailLogs(id: string): Promise<DPREmailLog[]> {
  const response = await api.get<{ success: boolean; data: DPREmailLog[] }>(`/dpr/${id}/email-logs`);
  return response.data.data;
}
