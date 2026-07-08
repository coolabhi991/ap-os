import api from "./api";

export interface ReceiptItem {
  poItemIndex: number;
  itemCode: string;
  itemName: string;
  description: string;
  unit: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  receivingQty: number;
  acceptedQty: number;
  rejectedQty: number;
  balanceQty: number;
}

export interface MaterialReceipt {
  id: string;
  companyId: string;
  projectId: string;
  vendorId: string;
  purchaseOrderId: string;
  receiptNumber: string;
  receivedDate: string;
  challanNumber: string;
  supplierInvoiceNumber: string;
  vehicleNumber: string;
  receivedBy: string;
  supplierRepresentative: string;
  items: ReceiptItem[];
  totalQty: string;
  qualityStatus: string;
  status: string;
  remarks: string;
  notes: string;
  project: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
  purchaseOrder: { id: string; poNumber: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface MRFormData {
  purchaseOrderId: string;
  projectId: string;
  vendorId: string;
  receivedDate: string;
  challanNumber: string;
  supplierInvoiceNumber: string;
  vehicleNumber: string;
  receivedBy: string;
  supplierRepresentative: string;
  qualityStatus: string;
  items: ReceiptItem[];
  status: string;
  remarks: string;
  notes: string;
}

export interface ReceivablePO {
  id: string;
  poNumber: string;
  projectId: string;
  vendorId: string;
  items: unknown;
  receivedByIndex: Record<number, number>;
}

export interface MRListQuery {
  search?: string;
  status?: string;
  projectId?: string;
  vendorId?: string;
  purchaseOrderId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface MRListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: MaterialReceipt[];
}

export const MR_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_TRANSIT: "In Transit",
  RECEIVED: "Received",
  PARTIALLY_RECEIVED: "Partially Received",
  REJECTED: "Rejected",
};

export const MR_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  IN_TRANSIT: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-teal-100 text-teal-700",
  PARTIALLY_RECEIVED: "bg-indigo-100 text-indigo-700",
  REJECTED: "bg-red-100 text-red-700",
};

export const QUALITY_STATUS_OPTIONS = ["APPROVED", "PARTIALLY_APPROVED", "REJECTED", "PENDING_INSPECTION"];

export async function getMaterialReceipts(query?: MRListQuery): Promise<MRListResponse> {
  const response = await api.get<MRListResponse>("/material-receipts", { params: query });
  return response.data;
}

export async function getMaterialReceipt(id: string): Promise<MaterialReceipt> {
  const response = await api.get<{ success: boolean; data: MaterialReceipt }>(`/material-receipts/${id}`);
  return response.data.data;
}

export async function getReceivablePOs(): Promise<ReceivablePO[]> {
  const response = await api.get<{ success: boolean; data: ReceivablePO[] }>("/material-receipts/receivable-pos");
  return response.data.data;
}

export async function createMaterialReceipt(data: MRFormData): Promise<MaterialReceipt> {
  const response = await api.post<{ success: boolean; data: MaterialReceipt }>("/material-receipts", data);
  return response.data.data;
}

export async function updateMaterialReceipt(id: string, data: MRFormData): Promise<MaterialReceipt> {
  const response = await api.put<{ success: boolean; data: MaterialReceipt }>(`/material-receipts/${id}`, data);
  return response.data.data;
}

export async function deleteMaterialReceipt(id: string): Promise<void> {
  await api.delete(`/material-receipts/${id}`);
}
