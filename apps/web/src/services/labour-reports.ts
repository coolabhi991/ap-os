import api from "./api";

export interface LabourDashboardSummary {
  totalActiveLabour: number;
  today: { count: number; wageAmount: string; byStatus: Record<string, number> };
  thisMonth: { count: number; wageAmount: string };
  projectWiseCost: Array<{ projectId: string; projectName: string; totalWageCost: string }>;
  topPendingWages: WageSummaryRow[];
  recentAttendance: Array<{
    id: string;
    attendanceDate: string;
    project: { id: string; name: string } | null;
    labour: { id: string; name: string } | null;
    status: string;
    wageAmount: string;
  }>;
}

export interface WageSummaryRow {
  labourId: string;
  name: string;
  category: string;
  contractorName: string;
  daysPresent: number;
  daysHalfDay: number;
  daysAbsent: number;
  daysOnLeave: number;
  totalOvertimeHours: string;
  wageEarned: string;
  totalAdvances: string;
  totalPayments: string;
  pendingWages: string;
}

export interface ProjectLabourCostRow {
  projectId: string;
  projectName: string;
  totalWageCost: string;
  attendanceCount: number;
}

export interface WageReportFilters {
  labourId?: string;
  projectId?: string;
  contractorId?: string;
  fromDate?: string;
  toDate?: string;
}

export async function getLabourDashboard(): Promise<LabourDashboardSummary> {
  const response = await api.get<{ success: boolean; data: LabourDashboardSummary }>("/labour/dashboard");
  return response.data.data;
}

export async function getWageRegister(filters?: WageReportFilters): Promise<WageSummaryRow[]> {
  const response = await api.get<{ success: boolean; data: WageSummaryRow[] }>("/labour/reports/wage-register", { params: filters });
  return response.data.data;
}

export async function getPendingWages(filters?: Omit<WageReportFilters, "fromDate" | "toDate">): Promise<WageSummaryRow[]> {
  const response = await api.get<{ success: boolean; data: WageSummaryRow[] }>("/labour/reports/pending-wages", { params: filters });
  return response.data.data;
}

export async function getProjectLabourCostReport(filters?: { fromDate?: string; toDate?: string }): Promise<ProjectLabourCostRow[]> {
  const response = await api.get<{ success: boolean; data: ProjectLabourCostRow[] }>("/labour/reports/project-cost", { params: filters });
  return response.data.data;
}
