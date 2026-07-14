import api from "./api";

export interface WorkOrderExtension {
  id: string;
  companyId: string;
  siteId: string;
  extensionOrderNumber: string;
  extensionOrderDate: string;
  previousCompletionDate: string;
  newCompletionDate: string;
  reason: string;
  remarks: string;
  hasFile: boolean;
  letterFileName: string;
  letterMimeType: string;
  letterFileSizeBytes: number | null;
  createdById: string;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface WorkOrderExtensionParams {
  siteId: string;
  extensionOrderNumber: string;
  extensionOrderDate: string;
  newCompletionDate: string;
  reason: string;
  remarks?: string;
}

export async function getWorkOrderExtensions(siteId: string): Promise<WorkOrderExtension[]> {
  const response = await api.get<{ success: boolean; data: WorkOrderExtension[] }>("/work-order-extensions", { params: { siteId } });
  return response.data.data;
}

/** File upload is optional — createWorkOrderExtension always uses multipart/form-data so a letter can be attached in the same request. */
export async function createWorkOrderExtension(file: File | null, params: WorkOrderExtensionParams): Promise<WorkOrderExtension> {
  const formData = new FormData();
  if (file) formData.append("file", file);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") formData.append(key, value);
  });
  const response = await api.post<{ success: boolean; data: WorkOrderExtension }>("/work-order-extensions", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

async function fetchExtensionFileBlob(id: string): Promise<Blob> {
  const response = await api.get(`/work-order-extensions/${id}/file`, { responseType: "blob" });
  return response.data;
}

export async function previewWorkOrderExtensionFile(id: string): Promise<void> {
  const blob = await fetchExtensionFileBlob(id);
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

export async function downloadWorkOrderExtensionFile(id: string, fileName: string): Promise<void> {
  const blob = await fetchExtensionFileBlob(id);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName || "extension-letter");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
