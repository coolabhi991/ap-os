import api from "./api";

export interface Client {
  id: string;
  companyId: string;
  companyName: string;
  clientCode: string;
  contactPerson: string;
  mobile: string;
  email: string;
  gst: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
  companyName: string;
  clientCode: string;
  contactPerson: string;
  mobile: string;
  email: string;
  gst: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website: string;
  status: string;
  notes: string;
}

export interface ClientListQuery {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ClientListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: Client[];
}

export async function getClients(query?: ClientListQuery): Promise<ClientListResponse> {
  const response = await api.get<ClientListResponse>("/clients", { params: query });
  return response.data;
}

export async function getClient(id: string): Promise<Client> {
  const response = await api.get<{ success: boolean; data: Client }>(`/clients/${id}`);
  return response.data.data;
}

export async function createClient(data: ClientFormData): Promise<Client> {
  const response = await api.post<{ success: boolean; data: Client }>("/clients", data);
  return response.data.data;
}

export async function updateClient(id: string, data: ClientFormData): Promise<Client> {
  const response = await api.put<{ success: boolean; data: Client }>(`/clients/${id}`, data);
  return response.data.data;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}
