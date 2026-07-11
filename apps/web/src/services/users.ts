import api from "./api";

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  role: string;
}

export async function getUsers(): Promise<CompanyUser[]> {
  const response = await api.get<{ success: boolean; data: CompanyUser[] }>("/users");
  return response.data.data;
}
