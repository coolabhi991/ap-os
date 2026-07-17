import api from "./api";
import type { CashFlowReport, ReceivableRow, PayableRow } from "./banking-reports";
import type { RunningBill } from "./running-bills";

export interface ProjectSiteRow {
  id: string;
  name: string;
  siteCode: string;
  status: string;
  expectedCompletion: string | null;
  paymentReceived: string;
  billsSubmitted: number;
  pendingExpenses: string;
  physicalProgress: number;
  financialProgress: number;
}

export interface ProjectHealthRow {
  id: string;
  name: string;
  status: string;
  contractValue: string;
  received: string;
  pending: string;
  billsSubmitted: number;
  pendingBillPayment: string;
  physicalProgress: number;
  financialProgress: number;
  varianceStatus: "ahead" | "on-track" | "behind";
  budget: string;
  actual: string;
  difference: string;
  sites: ProjectSiteRow[];
}

export interface ControlCenterAlert {
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
  link: string;
}

export interface BankingSummary {
  bankAccounts: { id: string; name: string; currentBalance: string; operationalBalance: string }[];
  totalBankBalance: string;
  officeCash: string;
  employeeAdvances: string;
  todayReceipts: string;
  todayPayments: string;
}

export interface GovernmentSummary {
  billsReady: number;
  submitted: number;
  underCorrection: number;
  awaitingPayment: number;
  partialPayments: number;
}

export interface FinancialSummary {
  governmentReceivable: string;
  vendorPayable: string;
  cashPosition: string;
  netPosition: string;
}

export interface OwnerDesk {
  critical: ControlCenterAlert[];
  high: ControlCenterAlert[];
  normal: ControlCenterAlert[];
  completedToday: number;
  remainingToday: number;
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
    billsSubmittedToday: number;
    billsApprovedToday: number;
    activeSiteCount: number;
  };
  cashFlow: CashFlowReport;
  projectHealth: ProjectHealthRow[];
  financialSummary: FinancialSummary;
  bankingSummary: BankingSummary;
  governmentSummary: GovernmentSummary;
  ownerDesk: OwnerDesk;
  receivables: { total: string; count: number; preview: ReceivableRow[] };
  payables: { total: string; count: number; overdueCount: number; overdueAmount: string; preview: PayableRow[] };
  runningBills: { recent: RunningBill[] };
  alerts: ControlCenterAlert[];
}

export async function getControlCenter(): Promise<ControlCenterData> {
  const response = await api.get<{ success: boolean; data: ControlCenterData }>("/dashboard");
  return response.data.data;
}
