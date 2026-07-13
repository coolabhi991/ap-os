import api from "./api";

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  mobile: string;
  designation: string;
  department: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFormData {
  name: string;
  mobile: string;
  designation: string;
  department: string;
  status: string;
}

export interface EmployeeListQuery {
  search?: string;
  status?: string;
  department?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface EmployeeListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: Employee[];
}

export const EMPLOYEE_STATUS_OPTIONS = ["ACTIVE", "INACTIVE"];
export const EMPLOYEE_STATUS_LABELS: Record<string, string> = { ACTIVE: "Active", INACTIVE: "Inactive" };
export const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-200 text-slate-600",
};

export async function getEmployees(query?: EmployeeListQuery): Promise<EmployeeListResponse> {
  const response = await api.get<EmployeeListResponse>("/employees", { params: query });
  return response.data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const response = await api.get<{ success: boolean; data: Employee }>(`/employees/${id}`);
  return response.data.data;
}

export async function createEmployee(data: EmployeeFormData): Promise<Employee> {
  const response = await api.post<{ success: boolean; data: Employee }>("/employees", data);
  return response.data.data;
}

export async function updateEmployee(id: string, data: EmployeeFormData): Promise<Employee> {
  const response = await api.put<{ success: boolean; data: Employee }>(`/employees/${id}`, data);
  return response.data.data;
}

export async function deleteEmployee(id: string): Promise<{ deleted: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/employees/${id}`);
  return { deleted: response.data.message === "Employee deleted", message: response.data.message };
}
