import api from "./api";

export interface LabourAttendance {
  id: string;
  companyId: string;
  projectId: string;
  project: { id: string; name: string } | null;
  siteId: string;
  labourId: string;
  labour: { id: string; name: string; category: string; contractorId: string | null; groupId: string | null } | null;
  subWorkId: string;
  subWork: { id: string; name: string } | null;
  attendanceDate: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE";
  overtimeHours: string;
  dailyWageSnapshot: string;
  overtimeRateSnapshot: string;
  wageAmount: string;
  remarks: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceEntryInput {
  labourId: string;
  status: string;
  overtimeHours?: number;
  remarks?: string;
}

export interface MarkAttendanceInput extends AttendanceEntryInput {
  projectId: string;
  siteId: string;
  attendanceDate: string;
}

export interface BulkMarkAttendanceInput {
  projectId: string;
  siteId: string;
  subWorkId?: string;
  attendanceDate: string;
  entries: AttendanceEntryInput[];
}

export interface AttendanceUpdateInput {
  status: string;
  overtimeHours: number;
  remarks: string;
}

export interface LabourAttendanceListQuery {
  search?: string;
  projectId?: string;
  siteId?: string;
  labourId?: string;
  groupId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface LabourAttendanceListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: LabourAttendance[];
}

export const ATTENDANCE_STATUS_OPTIONS = ["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"];

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  HALF_DAY: "Half Day",
  ON_LEAVE: "On Leave",
};

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-red-100 text-red-700",
  HALF_DAY: "bg-amber-100 text-amber-700",
  ON_LEAVE: "bg-slate-200 text-slate-600",
};

export async function getLabourAttendanceList(query?: LabourAttendanceListQuery): Promise<LabourAttendanceListResponse> {
  const response = await api.get<LabourAttendanceListResponse>("/labour-attendance", { params: query });
  return response.data;
}

export async function getLabourAttendance(id: string): Promise<LabourAttendance> {
  const response = await api.get<{ success: boolean; data: LabourAttendance }>(`/labour-attendance/${id}`);
  return response.data.data;
}

export async function markAttendance(data: MarkAttendanceInput): Promise<LabourAttendance> {
  const response = await api.post<{ success: boolean; data: LabourAttendance }>("/labour-attendance", data);
  return response.data.data;
}

export async function bulkMarkAttendance(
  data: BulkMarkAttendanceInput
): Promise<{ created: LabourAttendance[]; skipped: Array<{ labourId: string; reason: string }> }> {
  const response = await api.post<{ success: boolean; created: LabourAttendance[]; skipped: Array<{ labourId: string; reason: string }> }>(
    "/labour-attendance/bulk",
    data
  );
  return { created: response.data.created, skipped: response.data.skipped };
}

export async function updateLabourAttendance(id: string, data: AttendanceUpdateInput): Promise<LabourAttendance> {
  const response = await api.put<{ success: boolean; data: LabourAttendance }>(`/labour-attendance/${id}`, data);
  return response.data.data;
}

export async function deleteLabourAttendance(id: string): Promise<void> {
  await api.delete(`/labour-attendance/${id}`);
}

/** Triggers a browser download of the (optionally filtered) attendance register as CSV. */
export async function exportLabourAttendanceCSV(query?: LabourAttendanceListQuery): Promise<void> {
  const response = await api.get("/labour-attendance/export", { params: query, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `labour-attendance-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
