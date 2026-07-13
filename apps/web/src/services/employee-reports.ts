import api from "./api";

export interface EmployeeReportSummaryRow {
  employeeId: string;
  employeeName: string;
  salaryPaid: string;
  siteAdvances: string;
  personalAdvances: string;
  grandTotal: string;
}

export interface EmployeeReportTransaction {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  allocationType: string;
  amount: string;
  bankAccount: string;
  notes: string;
}

export interface EmployeeReport {
  summary: EmployeeReportSummaryRow[];
  grandTotal: { salaryPaid: string; siteAdvances: string; personalAdvances: string; total: string };
  transactions: EmployeeReportTransaction[];
}

export interface EmployeeReportQuery {
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
}

export async function getEmployeeReport(query: EmployeeReportQuery = {}): Promise<EmployeeReport> {
  const response = await api.get<{ success: boolean; data: EmployeeReport }>("/employee-reports", { params: query });
  return response.data.data;
}
