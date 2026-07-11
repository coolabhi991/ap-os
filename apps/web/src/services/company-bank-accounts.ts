import api from "./api";

export interface CompanyBankAccount {
  id: string;
  companyId: string;
  nickname: string;
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  accountType: string;
  openingBalance: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyBankAccountFormData {
  nickname: string;
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  accountType: string;
  openingBalance: number;
  isPrimary: boolean;
  isActive: boolean;
}

export const ACCOUNT_TYPE_OPTIONS = ["BANK", "CASH"];
export const ACCOUNT_TYPE_LABELS: Record<string, string> = { BANK: "Bank Account", CASH: "Cash Account" };

export async function getCompanyBankAccounts(): Promise<CompanyBankAccount[]> {
  const response = await api.get<{ success: boolean; data: CompanyBankAccount[] }>("/company-bank-accounts");
  return response.data.data;
}

export async function createCompanyBankAccount(data: CompanyBankAccountFormData): Promise<CompanyBankAccount> {
  const response = await api.post<{ success: boolean; data: CompanyBankAccount }>("/company-bank-accounts", data);
  return response.data.data;
}

export async function updateCompanyBankAccount(id: string, data: CompanyBankAccountFormData): Promise<CompanyBankAccount> {
  const response = await api.put<{ success: boolean; data: CompanyBankAccount }>(`/company-bank-accounts/${id}`, data);
  return response.data.data;
}

export async function deleteCompanyBankAccount(id: string): Promise<{ deleted: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/company-bank-accounts/${id}`);
  return { deleted: response.data.message === "Company bank account deleted", message: response.data.message };
}
