import api from "./api";

export interface POItem {
  itemCode: string;
  itemName: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  gstPercent: number;
  discountPercent: number;
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  amount: number;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  projectId: string;
  vendorId: string;
  requisitionId: string;
  poNumber: string;
  orderDate: string;
  expectedDate: string;
  deliveryAddress: string;
  paymentTerms: string;
  items: POItem[];
  discount: string;
  gstAmount: string;
  amount: string;
  status: string;
  notes: string;
  project: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
  requisition: { id: string; requisitionNumber: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface POFormData {
  poNumber: string;
  requisitionId: string;
  projectId: string;
  vendorId: string;
  orderDate: string;
  expectedDate: string;
  deliveryAddress: string;
  paymentTerms: string;
  items: POItem[];
  notes: string;
  status: string;
}

export interface ApprovedPR {
  id: string;
  requisitionNumber: string;
  title: string;
  projectId: string;
  vendorId: string;
  items: unknown;
  totalAmount: string;
}

export interface POListQuery {
  search?: string;
  status?: string;
  projectId?: string;
  vendorId?: string;
  requisitionId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface POListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: PurchaseOrder[];
}

export const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  ORDERED: "Issued",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Completed",
  CLOSED: "Cancelled",
  REJECTED: "Rejected",
};

export const PO_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  ORDERED: "bg-blue-100 text-blue-700",
  PARTIALLY_RECEIVED: "bg-indigo-100 text-indigo-700",
  RECEIVED: "bg-teal-100 text-teal-700",
  CLOSED: "bg-slate-200 text-slate-500",
  REJECTED: "bg-red-100 text-red-700",
};

export async function getPurchaseOrders(query?: POListQuery): Promise<POListResponse> {
  const response = await api.get<POListResponse>("/purchase-orders", { params: query });
  return response.data;
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const response = await api.get<{ success: boolean; data: PurchaseOrder }>(`/purchase-orders/${id}`);
  return response.data.data;
}

export async function getApprovedPRsForPO(): Promise<ApprovedPR[]> {
  const response = await api.get<{ success: boolean; data: ApprovedPR[] }>("/purchase-orders/approved-prs");
  return response.data.data;
}

export async function createPurchaseOrder(data: POFormData): Promise<PurchaseOrder> {
  const response = await api.post<{ success: boolean; data: PurchaseOrder }>("/purchase-orders", data);
  return response.data.data;
}

export async function updatePurchaseOrder(id: string, data: POFormData): Promise<PurchaseOrder> {
  const response = await api.put<{ success: boolean; data: PurchaseOrder }>(`/purchase-orders/${id}`, data);
  return response.data.data;
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await api.delete(`/purchase-orders/${id}`);
}
