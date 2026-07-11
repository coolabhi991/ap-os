import api from "./api";

export const LIABILITY_TYPES = [
  "HOME_LOAN",
  "CAR_LOAN",
  "GOLD_LOAN",
  "BANK_LOAN",
  "CASH_CREDIT",
  "OVERDRAFT",
  "CREDIT_CARD",
  "FRIEND_LOAN",
  "RELATIVE_LOAN",
  "PRIVATE_FINANCE",
  "PERSONAL_LOAN",
  "OTHER",
];

export const LIABILITY_TYPE_LABELS: Record<string, string> = {
  HOME_LOAN: "Home Loan",
  CAR_LOAN: "Car Loan",
  GOLD_LOAN: "Gold Loan",
  BANK_LOAN: "Bank Loan",
  CASH_CREDIT: "Cash Credit (CC)",
  OVERDRAFT: "Overdraft (OD)",
  CREDIT_CARD: "Credit Card",
  FRIEND_LOAN: "Friend Loan",
  RELATIVE_LOAN: "Relative Loan",
  PRIVATE_FINANCE: "Private Finance",
  PERSONAL_LOAN: "Personal Loan",
  OTHER: "Other",
};

export const LIABILITY_INTEREST_TYPES = ["MONTHLY", "ANNUAL", "FIXED", "FLOATING", "NONE"];
export const LIABILITY_INTEREST_TYPE_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  ANNUAL: "Annual",
  FIXED: "Fixed",
  FLOATING: "Floating",
  NONE: "None",
};

export const LIABILITY_SECURITY_TYPES = ["HOUSE", "GOLD", "VEHICLE", "NONE", "OTHER"];
export const LIABILITY_SECURITY_LABELS: Record<string, string> = {
  HOUSE: "House",
  GOLD: "Gold",
  VEHICLE: "Vehicle",
  NONE: "None",
  OTHER: "Other",
};

export const LIABILITY_STATUSES = ["ACTIVE", "CLOSED"];
export const LIABILITY_STATUS_LABELS: Record<string, string> = { ACTIVE: "Active", CLOSED: "Closed" };
export const LIABILITY_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-600",
};

export interface Liability {
  id: string;
  companyId: string;
  loanName: string;
  liabilityType: string;
  lenderName: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  sanctionAmount: string;
  outstandingAmount: string;
  interestType: string;
  interestRate: string;
  emiAmount: string;
  emiDate: number | null;
  startDate: string;
  endDate: string;
  security: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiabilityFormData {
  loanName: string;
  liabilityType: string;
  lenderName?: string;
  bankName?: string;
  branch?: string;
  accountNumber?: string;
  sanctionAmount: number;
  outstandingAmount?: number;
  interestType?: string;
  interestRate?: number;
  emiAmount?: number;
  emiDate?: number;
  startDate: string;
  endDate?: string;
  security?: string;
  status?: string;
  notes?: string;
}

export interface LiabilityListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: Liability[];
}

export interface LiabilityListQuery {
  search?: string;
  liabilityType?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getLiabilities(query: LiabilityListQuery = {}): Promise<LiabilityListResponse> {
  const response = await api.get<LiabilityListResponse>("/liabilities", { params: { limit: 200, ...query } });
  return response.data;
}

export async function getLiabilityById(id: string): Promise<Liability> {
  const response = await api.get<{ success: boolean; data: Liability }>(`/liabilities/${id}`);
  return response.data.data;
}

export async function createLiability(data: LiabilityFormData): Promise<Liability> {
  const response = await api.post<{ success: boolean; data: Liability }>("/liabilities", data);
  return response.data.data;
}

export async function updateLiability(id: string, data: Partial<LiabilityFormData>): Promise<Liability> {
  const response = await api.put<{ success: boolean; data: Liability }>(`/liabilities/${id}`, data);
  return response.data.data;
}

export async function deleteLiability(id: string): Promise<void> {
  await api.delete(`/liabilities/${id}`);
}
