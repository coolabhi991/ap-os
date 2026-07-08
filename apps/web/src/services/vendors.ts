import api from "./api";

export interface Vendor {
  id: string;
  companyId: string;
  name: string;
  vendorCode: string;
  category: string;
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst: string;
  pan: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorFormData {
  name: string;
  vendorCode: string;
  category: string;
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst: string;
  pan: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  notes: string;
  status: string;
}

export interface VendorListQuery {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VendorListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: Vendor[];
}

export async function getVendors(query?: VendorListQuery): Promise<VendorListResponse> {
  const response = await api.get<VendorListResponse>("/vendors", { params: query });
  return response.data;
}

export async function getVendor(id: string): Promise<Vendor> {
  const response = await api.get<{ success: boolean; data: Vendor }>(`/vendors/${id}`);
  return response.data.data;
}

export async function createVendor(data: VendorFormData): Promise<Vendor> {
  const response = await api.post<{ success: boolean; data: Vendor }>("/vendors", data);
  return response.data.data;
}

export async function updateVendor(id: string, data: VendorFormData): Promise<Vendor> {
  const response = await api.put<{ success: boolean; data: Vendor }>(`/vendors/${id}`, data);
  return response.data.data;
}

export async function deleteVendor(id: string): Promise<void> {
  await api.delete(`/vendors/${id}`);
}
