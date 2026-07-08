import api from "./api";

export interface PRItem {
  description: string;
  quantity: number;
  unit: string;
  estimatedRate: number;
  amount: number;
}

export interface PurchaseRequisition {
  id: string;
  companyId: string;
  requisitionNumber: string;
  title: string;
  description: string;
  items: PRItem[];
  requiredDate: string;
  status: string;
  totalAmount: string;
  notes: string;
  projectId: string;
  vendorId: string;
  project: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PRFormData {
  requisitionNumber: string;
  title: string;
  description: string;
  projectId: string;
  vendorId: string;
  requiredDate: string;
  status: string;
  items: PRItem[];
  notes: string;
}

export interface PRListQuery {
  search?: string;
  status?: string;
  projectId?: string;
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PRListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: PurchaseRequisition[];
}

export const PR_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ORDERED: "Ordered",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CLOSED: "Closed",
};

export async function getPurchaseRequisitions(query?: PRListQuery): Promise<PRListResponse> {
  const response = await api.get<PRListResponse>("/purchase-requisitions", { params: query });
  return response.data;
}

export async function getPurchaseRequisition(id: string): Promise<PurchaseRequisition> {
  const response = await api.get<{ success: boolean; data: PurchaseRequisition }>(`/purchase-requisitions/${id}`);
  return response.data.data;
}

export async function createPurchaseRequisition(data: PRFormData): Promise<PurchaseRequisition> {
  const response = await api.post<{ success: boolean; data: PurchaseRequisition }>("/purchase-requisitions", data);
  return response.data.data;
}

export async function updatePurchaseRequisition(id: string, data: PRFormData): Promise<PurchaseRequisition> {
  const response = await api.put<{ success: boolean; data: PurchaseRequisition }>(`/purchase-requisitions/${id}`, data);
  return response.data.data;
}

export async function deletePurchaseRequisition(id: string): Promise<void> {
  await api.delete(`/purchase-requisitions/${id}`);
}
