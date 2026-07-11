import api from "./api";
import type { CashFlowReport, ReceivableRow, PayableRow } from "./banking-reports";
import type { RunningBill } from "./running-bills";

export interface ProjectHealthRow {
  id: string;
  name: string;
  status: string;
  contractValue: string;
  physicalProgress: number;
  financialProgress: number;
  varianceStatus: "ahead" | "on-track" | "behind";
  budget: string;
  actual: string;
  difference: string;
}

export interface ControlCenterAlert {
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
  link: string;
}

export interface ControlCenterData {
  kpis: {
    totalContractValue: string;
    totalCashAndBankBalance: string;
    totalReceivable: string;
    totalPayable: string;
    overduePayable: string;
    netPosition: string;
    activeProjectCount: number;
  };
  cashFlow: CashFlowReport;
  projectHealth: ProjectHealthRow[];
  receivables: { total: string; count: number; preview: ReceivableRow[] };
  payables: { total: string; count: number; overdueCount: number; overdueAmount: string; preview: PayableRow[] };
  runningBills: { statusCounts: Record<string, number>; recent: RunningBill[] };
  alerts: ControlCenterAlert[];
}

export async function getControlCenter(): Promise<ControlCenterData> {
  const response = await api.get<{ success: boolean; data: ControlCenterData }>("/dashboard");
  return response.data.data;
}
