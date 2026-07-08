import api from "./api";

export interface VendorBankAccount {
  id: string;
  companyId: string;
  vendorId: string;
  nickname: string;
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorBankAccountFormData {
  nickname: string;
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  isPrimary: boolean;
  isActive: boolean;
}

export async function getVendorBankAccounts(vendorId: string): Promise<VendorBankAccount[]> {
  const response = await api.get<{ success: boolean; data: VendorBankAccount[] }>("/vendor-bank-accounts", {
    params: { vendorId },
  });
  return response.data.data;
}

export async function createVendorBankAccount(vendorId: string, data: VendorBankAccountFormData): Promise<VendorBankAccount> {
  const response = await api.post<{ success: boolean; data: VendorBankAccount }>("/vendor-bank-accounts", {
    vendorId,
    ...data,
  });
  return response.data.data;
}

export async function updateVendorBankAccount(id: string, data: VendorBankAccountFormData): Promise<VendorBankAccount> {
  const response = await api.put<{ success: boolean; data: VendorBankAccount }>(`/vendor-bank-accounts/${id}`, data);
  return response.data.data;
}

export async function deleteVendorBankAccount(id: string): Promise<{ deleted: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/vendor-bank-accounts/${id}`);
  return { deleted: response.data.message === "Vendor bank account deleted", message: response.data.message };
}
