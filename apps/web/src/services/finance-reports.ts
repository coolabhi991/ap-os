import api from "./api";

export interface FinanceUpcomingDue {
  id: string;
  loanName: string;
  liabilityType: string;
  emiAmount: string;
  emiDate: number;
  daysUntil: number;
}

export interface FinanceRecentRepayment {
  id: string;
  repaymentNumber: string;
  paymentDate: string;
  liability: string;
  liabilityType: string;
  principalPaid: string;
  interestPaid: string;
  totalPaid: string;
  bankAccount: string;
}

export interface FinanceDashboard {
  totalLiabilities: number;
  activeLiabilities: number;
  totalOutstanding: string;
  monthlyEMI: string;
  monthlyInterestPaid: string;
  upcomingDue: FinanceUpcomingDue[];
  ccUtilizationPercent: number;
  totalRevolvingLimit: string;
  totalRevolvingOutstanding: string;
  loanDistribution: { liabilityType: string; outstanding: string }[];
  recentRepayments: FinanceRecentRepayment[];
}

export async function getFinanceDashboard(): Promise<FinanceDashboard> {
  const response = await api.get<{ success: boolean; data: FinanceDashboard }>("/finance-reports/dashboard");
  return response.data.data;
}

export interface LiabilitySummaryRow {
  id: string;
  loanName: string;
  liabilityType: string;
  lenderName: string;
  sanctionAmount: string;
  outstandingAmount: string;
  repaidSoFar: string;
  interestType: string;
  interestRate: string;
  emiAmount: string;
  status: string;
}

export async function getLiabilitySummaryReport(): Promise<LiabilitySummaryRow[]> {
  const response = await api.get<{ success: boolean; data: LiabilitySummaryRow[] }>("/finance-reports/liability-summary");
  return response.data.data;
}

export interface OutstandingReport {
  totalOutstanding: string;
  rows: { liabilityType: string; count: number; sanctionedAmount: string; outstandingAmount: string }[];
}

export async function getOutstandingReport(): Promise<OutstandingReport> {
  const response = await api.get<{ success: boolean; data: OutstandingReport }>("/finance-reports/outstanding");
  return response.data.data;
}

export interface InterestPaidReport {
  totalInterestPaid: string;
  thisYearInterestPaid: string;
  byLiabilityType: { liabilityType: string; interestPaid: string }[];
  repayments: {
    id: string;
    repaymentNumber: string;
    paymentDate: string;
    liabilityId: string;
    liability: string;
    liabilityType: string;
    interestPaid: string;
  }[];
}

export async function getInterestPaidReport(fromDate?: string, toDate?: string): Promise<InterestPaidReport> {
  const response = await api.get<{ success: boolean; data: InterestPaidReport }>("/finance-reports/interest-paid", { params: { fromDate, toDate } });
  return response.data.data;
}

export interface EMIScheduleRow {
  id: string;
  loanName: string;
  liabilityType: string;
  emiAmount: string;
  emiDate: number | null;
  daysUntil: number;
  outstandingAmount: string;
}

export async function getEMISchedule(): Promise<EMIScheduleRow[]> {
  const response = await api.get<{ success: boolean; data: EMIScheduleRow[] }>("/finance-reports/emi-schedule");
  return response.data.data;
}

export interface CreditCardReportRow {
  id: string;
  loanName: string;
  bankName: string;
  creditLimit: string;
  outstandingAmount: string;
  utilizationPercent: number;
  status: string;
}

export async function getCreditCardReport(): Promise<CreditCardReportRow[]> {
  const response = await api.get<{ success: boolean; data: CreditCardReportRow[] }>("/finance-reports/credit-card");
  return response.data.data;
}

export interface CCUtilizationReport {
  overallUtilizationPercent: number;
  rows: { id: string; loanName: string; liabilityType: string; limit: string; outstanding: string; utilizationPercent: number }[];
}

export async function getCCUtilizationReport(): Promise<CCUtilizationReport> {
  const response = await api.get<{ success: boolean; data: CCUtilizationReport }>("/finance-reports/cc-utilization");
  return response.data.data;
}

export interface LoanLedgerEntry {
  date: string;
  type: "DISBURSEMENT" | "REPAYMENT";
  description: string;
  bankAccount: string;
  principal: string;
  interest: string;
  amount: string;
}

export interface LoanLedger {
  liability: { id: string; loanName: string; liabilityType: string; sanctionAmount: string; outstandingAmount: string; status: string };
  entries: LoanLedgerEntry[];
}

export async function getLoanLedger(liabilityId: string): Promise<LoanLedger> {
  const response = await api.get<{ success: boolean; data: LoanLedger }>("/finance-reports/loan-ledger", { params: { liabilityId } });
  return response.data.data;
}

export interface FundingSourceRow {
  liabilityId: string;
  loanName: string;
  liabilityType: string;
  disbursementAmount: string;
  disbursedOn: string;
  bankAccount: string;
  allocatedTo: { destination: string; amount: string }[];
}

export async function getFundingSourceReport(liabilityId?: string): Promise<FundingSourceRow[]> {
  const response = await api.get<{ success: boolean; data: FundingSourceRow[] }>("/finance-reports/funding-source", { params: { liabilityId } });
  return response.data.data;
}

export interface RepaymentReport {
  totalPrincipalPaid: string;
  totalInterestPaid: string;
  totalPaid: string;
  rows: {
    id: string;
    repaymentNumber: string;
    paymentDate: string;
    liability: string;
    liabilityType: string;
    principalPaid: string;
    interestPaid: string;
    totalPaid: string;
    bankAccount: string;
  }[];
}

export async function getRepaymentReport(fromDate?: string, toDate?: string, liabilityId?: string): Promise<RepaymentReport> {
  const response = await api.get<{ success: boolean; data: RepaymentReport }>("/finance-reports/repayments", { params: { fromDate, toDate, liabilityId } });
  return response.data.data;
}
