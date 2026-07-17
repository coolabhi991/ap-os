import api from "./api";

export interface Project {
  id: string;
  companyId: string;
  clientId: string | null;
  projectTypeId: string | null;
  name: string;
  code: string | null;
  description: string | null;
  location: string | null;
  manager: string | null;
  status: string;
  contractValue: string; // Decimal serialized as string by Prisma
  progress: number;
  startDate: string | null;
  endDate: string | null;
  client: { id: string; name: string } | null;
  projectType: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: Project[];
}

export interface ProjectFormData {
  name: string;
  code: string;
  clientName: string;
  projectTypeName: string;
  contractValue: string;
  manager: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
  location: string;
}

export const PROJECT_STATUS_OPTIONS = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export const PROJECT_SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "totalOutstanding", label: "Outstanding (High-Low)" },
  { value: "totalProjectCost", label: "Project Cost (High-Low)" },
  { value: "totalSites", label: "Total Sites (High-Low)" },
];

export interface ProjectListQuery {
  search?: string;
  status?: string;
  clientId?: string;
  projectTypeId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getProjects(query?: ProjectListQuery): Promise<ProjectListResponse> {
  const response = await api.get<ProjectListResponse>("/projects", { params: query });
  return response.data;
}

export async function getProject(id: string): Promise<Project> {
  const response = await api.get<{ success: boolean; data: Project }>(`/projects/${id}`);
  return response.data.data;
}

export async function createProject(data: ProjectFormData): Promise<Project> {
  const response = await api.post<{ success: boolean; data: Project }>("/projects", {
    name: data.name,
    code: data.code || undefined,
    clientName: data.clientName || undefined,
    projectTypeName: data.projectTypeName || undefined,
    contractValue: data.contractValue ? Number(data.contractValue) : 0,
    manager: data.manager || undefined,
    startDate: data.startDate || undefined,
    endDate: data.endDate || undefined,
    status: data.status || "PLANNING",
    description: data.description || undefined,
    location: data.location || undefined,
  });
  return response.data.data;
}

export async function updateProject(id: string, data: ProjectFormData): Promise<Project> {
  const response = await api.put<{ success: boolean; data: Project }>(`/projects/${id}`, {
    name: data.name,
    code: data.code || undefined,
    clientName: data.clientName || undefined,
    projectTypeName: data.projectTypeName || undefined,
    contractValue: data.contractValue ? Number(data.contractValue) : 0,
    manager: data.manager || undefined,
    startDate: data.startDate || undefined,
    endDate: data.endDate || undefined,
    status: data.status || "PLANNING",
    description: data.description || undefined,
    location: data.location || undefined,
  });
  return response.data.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export interface ProjectDashboardSite {
  id: string;
  projectId: string;
  name: string;
  taluka: string;
  siteType: string;
  tenderCost: string;
  workOrderDate: string;
  completionDate: string;
  extensionTillDate: string;
  clientPaymentsReceived: string;
  outstandingAmount: string;
  physicalProgress: number;
  financialProgress: number;
  status: string;
}

export interface ProjectDashboardRow {
  id: string;
  name: string;
  code: string;
  client: { id: string; name: string } | null;
  status: string;
  totalSites: number;
  totalProjectCost: string;
  totalClientPaymentsReceived: string;
  totalOutstanding: string;
  sites: ProjectDashboardSite[];
}

/** Project Executive Dashboard — every Project's roll-up plus its full Site table, computed
 * entirely on demand from Site Work Orders / RA Bills / Client Payments (never stored). */
export async function getProjectExecutiveDashboard(): Promise<ProjectDashboardRow[]> {
  const response = await api.get<{ success: boolean; data: ProjectDashboardRow[] }>("/projects/dashboard");
  return response.data.data;
}

export interface ProjectOverview {
  id: string;
  name: string;
  code: string | null;
  status: string;
  client: { id: string; name: string } | null;
  agreementValue: string;
  department: string | null;
  workOrderNumber: string | null;
  workOrderDate: string | null;
  expectedCompletion: string | null;
  paymentReceived: string;
  balanceReceivable: string;
  physicalProgress: number;
  financialProgress: number;
  siteCount: number;
}

export async function getProjectOverview(id: string): Promise<ProjectOverview> {
  const response = await api.get<{ success: boolean; data: ProjectOverview }>(`/projects/${id}/overview`);
  return response.data.data;
}

export interface ProjectSiteOverview {
  id: string;
  name: string;
  siteCode: string | null;
  status: string;
  engineer: string | null;
  expectedCompletion: string | null;
  physicalProgress: number;
  financialProgress: number;
}

export async function getProjectSitesOverview(id: string): Promise<ProjectSiteOverview[]> {
  const response = await api.get<{ success: boolean; data: ProjectSiteOverview[] }>(`/projects/${id}/sites-overview`);
  return response.data.data;
}

export interface ProjectFinanceSummary {
  budget: string;
  actual: string;
  difference: string;
  physicalProgress: number;
  financialProgress: number;
  varianceStatus: "ahead" | "on-track" | "behind";
  costHeads: Record<string, string>;
  paymentReceived: string;
  balanceReceivable: string;
  billsSubmitted: number;
  pendingVendorBills: { count: number };
  pendingPayments: { amount: string };
}

export async function getProjectFinance(id: string): Promise<ProjectFinanceSummary> {
  const response = await api.get<{ success: boolean; data: ProjectFinanceSummary }>(`/projects/${id}/finance`);
  return response.data.data;
}

export type ProjectTimelineEventType =
  | "PROJECT_CREATED"
  | "SITE_ADDED"
  | "EXPENSE_ADDED"
  | "RUNNING_BILL_SUBMITTED"
  | "PAYMENT_RECEIVED"
  | "DOCUMENT_UPLOADED";

export interface ProjectTimelineEvent {
  id: string;
  type: ProjectTimelineEventType;
  label: string;
  date: string;
  link?: string;
}

export async function getProjectTimeline(id: string): Promise<ProjectTimelineEvent[]> {
  const response = await api.get<{ success: boolean; data: ProjectTimelineEvent[] }>(`/projects/${id}/timeline`);
  return response.data.data;
}
