import api from "./api";

export interface BankStatementMapping {
  id: string;
  companyId: string;
  signature: string;
  bankName: string;
  dateColumn: number;
  descriptionColumn: number | null;
  debitColumn: number | null;
  creditColumn: number | null;
  balanceColumn: number | null;
  referenceColumn: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankStatementMappingInput {
  signature: string;
  bankName?: string;
  dateColumn: number;
  descriptionColumn?: number | null;
  debitColumn?: number | null;
  creditColumn?: number | null;
  balanceColumn?: number | null;
  referenceColumn?: number | null;
}

export async function getBankStatementMapping(signature: string): Promise<BankStatementMapping | null> {
  const response = await api.get<{ success: boolean; data: BankStatementMapping | null }>("/bank-statement-mappings", { params: { signature } });
  return response.data.data;
}

export async function saveBankStatementMapping(input: BankStatementMappingInput): Promise<BankStatementMapping> {
  const response = await api.post<{ success: boolean; data: BankStatementMapping }>("/bank-statement-mappings", input);
  return response.data.data;
}
