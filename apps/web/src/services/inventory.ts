import api from "./api";

export interface InventoryItem {
  id: string;
  companyId: string;
  projectId: string;
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  openingBalance: string;
  receiptsQuantity: string;
  issuesQuantity: string;
  currentStock: string;
  reservedStock: string;
  availableStock: string;
  reorderLevel: string;
  minStock: string;
  maxStock: string;
  warehouse: string;
  rackLocation: string;
  batchNumber: string;
  supplierId: string;
  supplier: { id: string; name: string } | null;
  lastReceiptDate: string;
  lastIssueDate: string;
  location: string;
  status: "HEALTHY" | "LOW" | "CRITICAL" | "OUT_OF_STOCK";
  project: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryFormData {
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  projectId: string;
  openingBalance: number;
  reservedStock: number;
  reorderLevel: number;
  minStock: number;
  maxStock: number;
  warehouse: string;
  rackLocation: string;
  batchNumber: string;
  supplierId: string;
  location: string;
}

export interface InventoryListQuery {
  search?: string;
  status?: string;
  category?: string;
  warehouse?: string;
  projectId?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface InventoryListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: InventoryItem[];
}

export interface StockAdjustmentInput {
  quantity: number;
  direction: "IN" | "OUT";
  remarks?: string;
}

export interface StockLedgerEntry {
  id: string;
  inventoryId: string;
  item: { id: string; itemCode: string | null; itemName: string; unit: string | null } | null;
  movementType: "OPENING" | "RECEIPT" | "ISSUE" | "ADJUSTMENT";
  quantity: string;
  balanceAfter: string;
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  remarks: string;
  movementDate: string;
}

export interface StockLedgerQuery {
  inventoryId?: string;
  movementType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface StockLedgerResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: StockLedgerEntry[];
}

export interface InventoryDashboardSummary {
  totalItems: number;
  healthyCount: number;
  lowCount: number;
  criticalCount: number;
  outOfStockCount: number;
  totalCurrentStock: string;
  totalReservedStock: string;
  recentMovements: Array<{
    id: string;
    item: { id: string; itemCode: string | null; itemName: string; unit: string | null } | null;
    movementType: string;
    quantity: string;
    balanceAfter: string;
    referenceNumber: string;
    movementDate: string;
  }>;
}

export const INVENTORY_STATUS_LABELS: Record<string, string> = {
  HEALTHY: "Healthy",
  LOW: "Low",
  CRITICAL: "Critical",
  OUT_OF_STOCK: "Out of Stock",
};

export const INVENTORY_STATUS_COLORS: Record<string, string> = {
  HEALTHY: "bg-emerald-100 text-emerald-700",
  LOW: "bg-amber-100 text-amber-700",
  CRITICAL: "bg-orange-100 text-orange-700",
  OUT_OF_STOCK: "bg-red-100 text-red-700",
};

export async function getInventoryItems(query?: InventoryListQuery): Promise<InventoryListResponse> {
  const response = await api.get<InventoryListResponse>("/inventory", { params: query });
  return response.data;
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const response = await api.get<{ success: boolean; data: InventoryItem }>(`/inventory/${id}`);
  return response.data.data;
}

export async function createInventoryItem(data: InventoryFormData): Promise<InventoryItem> {
  const response = await api.post<{ success: boolean; data: InventoryItem }>("/inventory", data);
  return response.data.data;
}

export async function updateInventoryItem(id: string, data: InventoryFormData): Promise<InventoryItem> {
  const response = await api.put<{ success: boolean; data: InventoryItem }>(`/inventory/${id}`, data);
  return response.data.data;
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await api.delete(`/inventory/${id}`);
}

export async function adjustInventoryStock(id: string, data: StockAdjustmentInput): Promise<InventoryItem> {
  const response = await api.post<{ success: boolean; data: InventoryItem }>(`/inventory/${id}/adjust`, data);
  return response.data.data;
}

export async function getStockLedger(query?: StockLedgerQuery): Promise<StockLedgerResponse> {
  const response = await api.get<StockLedgerResponse>("/inventory/ledger", { params: query });
  return response.data;
}

export async function getLowStockAlerts(): Promise<InventoryItem[]> {
  const response = await api.get<{ success: boolean; data: InventoryItem[] }>("/inventory/low-stock");
  return response.data.data;
}

export async function getInventoryDashboard(): Promise<InventoryDashboardSummary> {
  const response = await api.get<{ success: boolean; data: InventoryDashboardSummary }>("/inventory/dashboard");
  return response.data.data;
}

/** Triggers a browser download of the (optionally filtered) inventory as CSV. */
export async function exportInventoryCSV(query?: InventoryListQuery): Promise<void> {
  const response = await api.get("/inventory/export", { params: query, responseType: "blob" });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
