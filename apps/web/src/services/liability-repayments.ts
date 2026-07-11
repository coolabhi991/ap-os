import api from "./api";

// Read-only by design — repayments are only ever created via Banking's Allocate Transaction
// modal (Bank Statement → Transaction Allocation → Liability). There is no create/update/delete
// function here on purpose.

export interface LiabilityRepayment {
  id: string;
  companyId: string;
  liabilityId: string;
  liability: { id: string; loanName: string; liabilityType: string } | null;
  repaymentNumber: string;
  paymentDate: string;
  principalPaid: string;
  interestPaid: string;
  totalPaid: string;
  companyBankAccountId: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string; accountNumber: string } | null;
  remarks: string;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface LiabilityRepaymentListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: LiabilityRepayment[];
}

export interface LiabilityRepaymentListQuery {
  liabilityId?: string;
  liabilityType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export async function getLiabilityRepayments(query: LiabilityRepaymentListQuery = {}): Promise<LiabilityRepaymentListResponse> {
  const response = await api.get<LiabilityRepaymentListResponse>("/liability-repayments", { params: { limit: 200, ...query } });
  return response.data;
}
