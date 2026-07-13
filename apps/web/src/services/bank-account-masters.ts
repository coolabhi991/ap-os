import api from "./api";

export type BankAccountOwnerType = "COMPANY" | "EMPLOYEE" | "VENDOR" | "CLIENT" | "PARTNER" | "LIABILITY" | "OTHER";

export interface BankAccountMaster {
  id: string;
  companyId: string;
  ownerType: BankAccountOwnerType;
  ownerId: string;
  ownerLabel: string;
  bankName: string;
  branch: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  isPrimary: boolean;
  status: "ACTIVE" | "INACTIVE" | "CLOSED";
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountMasterFormData {
  ownerType: BankAccountOwnerType;
  ownerId?: string;
  ownerLabel?: string;
  bankName: string;
  branch: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  isPrimary: boolean;
  status: string;
}

export const BANK_ACCOUNT_STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "CLOSED"];
export const BANK_ACCOUNT_STATUS_LABELS: Record<string, string> = { ACTIVE: "Active", INACTIVE: "Inactive", CLOSED: "Closed" };
export const BANK_ACCOUNT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-200 text-slate-600",
  CLOSED: "bg-red-100 text-red-700",
};

export async function getBankAccountMasters(ownerType: BankAccountOwnerType, ownerId: string): Promise<BankAccountMaster[]> {
  const response = await api.get<{ success: boolean; total: number; data: BankAccountMaster[] }>("/bank-account-masters", {
    params: { ownerType, ownerId, limit: 100 },
  });
  return response.data.data;
}

export async function createBankAccountMaster(data: BankAccountMasterFormData): Promise<BankAccountMaster> {
  const response = await api.post<{ success: boolean; data: BankAccountMaster }>("/bank-account-masters", data);
  return response.data.data;
}

export async function updateBankAccountMaster(id: string, data: BankAccountMasterFormData): Promise<BankAccountMaster> {
  const response = await api.put<{ success: boolean; data: BankAccountMaster }>(`/bank-account-masters/${id}`, data);
  return response.data.data;
}

export async function deleteBankAccountMaster(id: string): Promise<void> {
  await api.delete(`/bank-account-masters/${id}`);
}
