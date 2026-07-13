import api from "./api";

export interface BankDirectoryRow {
  id: string;
  ownerType: "COMPANY" | "VENDOR" | "EMPLOYEE" | "PARTNER";
  ownerName: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  ifscCode: string;
  isPrimary: boolean;
  status: string;
}

export interface BankDirectory {
  company: BankDirectoryRow[];
  vendor: BankDirectoryRow[];
  employee: BankDirectoryRow[];
  partner: BankDirectoryRow[];
  totalAccounts: number;
}

export async function getBankDirectory(): Promise<BankDirectory> {
  const response = await api.get<{ success: boolean; data: BankDirectory }>("/bank-directory");
  return response.data.data;
}
