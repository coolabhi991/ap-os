import api from "./api";

export const ALLOCATION_TYPES = [
  "RUNNING_BILL_RECEIPT",
  "VENDOR_PAYMENT",
  "LABOUR",
  "SITE_EXPENSE",
  "INTERNAL_TRANSFER",
  "OWNER_INVESTMENT",
  "PARTNER_INVESTMENT",
  "GST",
  "LOAN",
  "OFFICE_EXPENSE",
  "OTHER",
];

export const ALLOCATION_TYPE_LABELS: Record<string, string> = {
  RUNNING_BILL_RECEIPT: "Running Bill Receipt",
  VENDOR_PAYMENT: "Vendor Payment",
  LABOUR: "Labour",
  SITE_EXPENSE: "Site Expense",
  INTERNAL_TRANSFER: "Internal Transfer",
  OWNER_INVESTMENT: "Owner Investment",
  PARTNER_INVESTMENT: "Partner Investment",
  GST: "GST",
  LOAN: "Loan",
  OFFICE_EXPENSE: "Office Expense",
  OTHER: "Other",
};

// Types that require a Site to be selected.
export const SITE_SCOPED_TYPES = ["SITE_EXPENSE", "LABOUR"];

export interface TransactionAllocation {
  id: string;
  companyId: string;
  bankTransactionId: string;
  allocationType: string;
  amount: string;
  siteId: string;
  site: { id: string; name: string } | null;
  partyName: string;
  notes: string;
  runningBillPaymentId: string;
  runningBillPayment: { id: string; paymentNumber: string; billNumber: string } | null;
  vendorPaymentId: string;
  vendorPayment: { id: string; paymentNumber: string; vendor: string; billNumber: string } | null;
  labourPaymentId: string;
  labourPayment: { id: string; labour: string } | null;
  expenseId: string;
  expense: { id: string; expenseNumber: string; category: string } | null;
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
