import api from "./api";

export const ALLOCATION_TYPES = [
  "RUNNING_BILL_RECEIPT",
  "VENDOR_PAYMENT",
  "LABOUR",
  "SITE_EXPENSE",
  "INTERNAL_TRANSFER",
  "OWNER_INVESTMENT",
  "PARTNER_INVESTMENT",
  "PARTNER_SETTLEMENT",
  "GST",
  "LOAN",
  "OFFICE_EXPENSE",
  "OTHER",
  "LIABILITY_DISBURSEMENT",
  "LIABILITY_REPAYMENT",
  "EMPLOYEE_SALARY",
  "SITE_ADVANCE",
  "PERSONAL_ADVANCE",
  "OD_CC_INTEREST",
  "BANK_CHARGES",
  "INTEREST_INCOME",
  "CAR_LOAN_EMI",
  "HOME_LOAN_EMI",
  "GOLD_LOAN",
  "EMERGENCY_LOAN",
  "OTHER_LOAN",
  "SECURITY_DEPOSIT_RELEASE",
  "CLIENT_REFUND",
  "CREDIT_CARD_BILL_PAYMENT",
];

export const ALLOCATION_TYPE_LABELS: Record<string, string> = {
  RUNNING_BILL_RECEIPT: "Running Bill Receipt",
  VENDOR_PAYMENT: "Vendor Payment",
  LABOUR: "Labour",
  SITE_EXPENSE: "Site Expense",
  INTERNAL_TRANSFER: "Internal Transfer",
  OWNER_INVESTMENT: "Owner Investment",
  PARTNER_INVESTMENT: "Partner Investment",
  PARTNER_SETTLEMENT: "Partner Settlement",
  GST: "GST",
  LOAN: "Loan",
  OFFICE_EXPENSE: "Office Expense",
  OTHER: "Other",
  LIABILITY_DISBURSEMENT: "Liability Disbursement",
  LIABILITY_REPAYMENT: "Liability Repayment",
  EMPLOYEE_SALARY: "Employee Salary",
  SITE_ADVANCE: "Site Advance",
  PERSONAL_ADVANCE: "Personal Advance",
  OD_CC_INTEREST: "OD / CC Interest",
  BANK_CHARGES: "Bank Charges",
  INTEREST_INCOME: "Interest Income",
  CAR_LOAN_EMI: "Car Loan EMI",
  HOME_LOAN_EMI: "Home Loan EMI",
  GOLD_LOAN: "Gold Loan",
  EMERGENCY_LOAN: "Emergency Loan",
  OTHER_LOAN: "Other Loan",
  SECURITY_DEPOSIT_RELEASE: "Security Deposit Release",
  CLIENT_REFUND: "Client Refund",
  CREDIT_CARD_BILL_PAYMENT: "Credit Card Bill Payment",
};

// Types that require a Site to be selected.
export const SITE_SCOPED_TYPES = ["SITE_EXPENSE", "LABOUR", "SECURITY_DEPOSIT_RELEASE", "CLIENT_REFUND"];

// Of the SITE_SCOPED_TYPES, the ones where Site is mandatory (not just optionally shown).
export const SITE_REQUIRED_TYPES = ["SITE_EXPENSE", "SECURITY_DEPOSIT_RELEASE", "CLIENT_REFUND"];

// Types that require a Partner to be selected.
export const PARTNER_SCOPED_TYPES = ["OWNER_INVESTMENT", "PARTNER_INVESTMENT", "PARTNER_SETTLEMENT"];

// Types that require an Employee to be selected — tag-only, mirrors LIABILITY_DISBURSEMENT.
export const EMPLOYEE_SCOPED_TYPES = ["EMPLOYEE_SALARY", "SITE_ADVANCE", "PERSONAL_ADVANCE"];

// Loan types (+ Credit Card Bill Payment, + OD/CC Interest) that behave exactly like LIABILITY_REPAYMENT — same Liability + Principal/Interest split fields. OD_CC_INTEREST is pure interest against a CASH_CREDIT/OVERDRAFT Liability (principalPaid=0).
export const LOAN_REPAYMENT_TYPES = ["LIABILITY_REPAYMENT", "CAR_LOAN_EMI", "HOME_LOAN_EMI", "GOLD_LOAN", "EMERGENCY_LOAN", "OTHER_LOAN", "CREDIT_CARD_BILL_PAYMENT", "OD_CC_INTEREST"];

// Types that create a real ledger record (Vendor Payment, Running Bill Payment, Liability Repayment, etc.) — these can never be deleted here, only from their own module.
export const LEDGER_BACKED_TYPES = [
  "RUNNING_BILL_RECEIPT",
  "VENDOR_PAYMENT",
  "LABOUR",
  "SITE_EXPENSE",
  "OWNER_INVESTMENT",
  "PARTNER_INVESTMENT",
  "PARTNER_SETTLEMENT",
  ...LOAN_REPAYMENT_TYPES,
];

// Maps a loan-specific allocation type to the matching Liability.liabilityType, to filter the picker to relevant liabilities only.
export const LOAN_TYPE_TO_LIABILITY_TYPE: Record<string, string> = {
  CAR_LOAN_EMI: "CAR_LOAN",
  HOME_LOAN_EMI: "HOME_LOAN",
  GOLD_LOAN: "GOLD_LOAN",
  CREDIT_CARD_BILL_PAYMENT: "CREDIT_CARD",
};

export interface TransactionAllocation {
  id: string;
  companyId: string;
  bankTransactionId: string;
  allocationType: string;
  amount: string;
  siteId: string;
  site: { id: string; name: string } | null;
  employeeId: string;
  employee: { id: string; name: string } | null;
  partyName: string;
  notes: string;
  runningBillPaymentId: string;
  runningBillPayment: { id: string; paymentNumber: string; runningBillId: string; billNumber: string } | null;
  vendorPaymentId: string;
  vendorPayment: { id: string; paymentNumber: string; vendor: string; billNumber: string } | null;
  labourPaymentId: string;
  labourPayment: { id: string; labour: string } | null;
  expenseId: string;
  expense: { id: string; expenseNumber: string; category: string } | null;
  partnerInvestmentId: string;
  partnerInvestment: { id: string; investmentNumber: string; partner: string } | null;
  partnerSettlementId: string;
  partnerSettlement: { id: string; settlementNumber: string; partner: string } | null;
  liabilityId: string;
  liability: { id: string; loanName: string; liabilityType: string } | null;
  liabilityRepaymentId: string;
  liabilityRepayment: { id: string; repaymentNumber: string; principalPaid: string; interestPaid: string; liability: string } | null;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface AllocationRowInput {
  allocationType: string;
  amount: number;
  siteId?: string;
  partyName?: string;
  notes?: string;
  runningBillId?: string;
  vendorBillId?: string;
  vendorBankAccountId?: string;
  labourId?: string;
  categoryId?: string;
  partnerId?: string;
  liabilityId?: string;
  principalPaid?: number;
  interestPaid?: number;
  employeeId?: string;
}

export interface CreateAllocationsResult {
  created: TransactionAllocation[];
  failed: Array<{ index: number; allocationType: string; reason: string }>;
  allocated: number;
  total: number;
  allocationStatus: string;
}

export async function getAllocationsForTransaction(bankTransactionId: string): Promise<TransactionAllocation[]> {
  const response = await api.get<{ success: boolean; data: TransactionAllocation[] }>("/transaction-allocations", { params: { bankTransactionId } });
  return response.data.data;
}

export async function createAllocations(bankTransactionId: string, rows: AllocationRowInput[]): Promise<CreateAllocationsResult> {
  const response = await api.post<{ success: boolean } & CreateAllocationsResult>("/transaction-allocations", { bankTransactionId, rows });
  return response.data;
}

/** Removes a wrong allocation — tag-only types only, and only with confirm=true; ledger-backed types (Vendor Payment, Liability Repayment, etc.) are always refused server-side. */
export async function deleteAllocation(id: string, confirm = false): Promise<void> {
  await api.delete(`/transaction-allocations/${id}`, { data: { confirm } });
}
