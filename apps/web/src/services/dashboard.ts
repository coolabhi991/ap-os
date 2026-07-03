import { api } from "./api";

export interface DashboardResponse {
  success: boolean;
  data: {
    company: {
      id: string;
      name: string;
      gstNumber: string | null;
      panNumber: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      pincode: string | null;
      logo: string | null;
    };
    users: {
      total: number;
      active: number;
      inactive: number;
    };
    projects: {
      total: number;
    };
    vendors: {
      total: number;
    };
    clients: {
      total: number;
    };
  };
}

export async function getDashboard() {
  return api<DashboardResponse>("/dashboard");
}