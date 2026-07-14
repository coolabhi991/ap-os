import api from "./api";

export interface ProjectDocument {
  id: string;
  companyId: string;
  projectId: string;
  siteId: string;
  vendorId: string;
  dprId: string;
  measurementBookId: string;
  runningBillId: string;
  documentType: string;
  documentNumber: string;
  fileName: string;
  hasFile: boolean;
  mimeType: string;
  fileSizeBytes: number;
  notes: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentUploadParams {
  projectId?: string;
  siteId?: string;
  vendorId?: string;
  dprId?: string;
  measurementBookId?: string;
  runningBillId?: string;
  documentType: string;
  notes: string;
}

export const DOCUMENT_TYPE_OPTIONS = [
  "CONTRACT", "DRAWING", "INVOICE", "PHOTO", "REPORT", "OTHER",
  "PROGRESS_PHOTO", "SITE_PHOTO", "SCANNED_MB", "ABSTRACT_SHEET", "TEST_REPORT", "GOVERNMENT_LETTER",
  "WORK_ORDER", "AGREEMENT", "BOQ", "TECHNICAL_SANCTION", "ADMINISTRATIVE_APPROVAL",
];

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CONTRACT: "Contract",
  DRAWING: "Drawing",
  INVOICE: "Invoice",
  PHOTO: "Photo",
  REPORT: "Report",
  OTHER: "Other",
  PROGRESS_PHOTO: "Progress Photo",
  SITE_PHOTO: "Site Photo",
  SCANNED_MB: "Scanned MB",
  ABSTRACT_SHEET: "Abstract Sheet",
  TEST_REPORT: "Test Report",
  GOVERNMENT_LETTER: "Government Letter",
  WORK_ORDER: "Work Order",
  AGREEMENT: "Agreement",
  BOQ: "BOQ",
  TECHNICAL_SANCTION: "Technical Sanction",
  ADMINISTRATIVE_APPROVAL: "Administrative Approval",
};

/** DPR Photos & Attachments use these 4 types specifically. */
export const DPR_ATTACHMENT_TYPE_OPTIONS = ["PROGRESS_PHOTO", "SITE_PHOTO", "DRAWING", "OTHER"];

/** Measurement Book Photos & Attachments use these 5 types specifically. */
export const MB_ATTACHMENT_TYPE_OPTIONS = ["SCANNED_MB", "ABSTRACT_SHEET", "DRAWING", "TEST_REPORT", "OTHER"];

/** Running Bill Photos & Attachments — government letters plus the usual generic types. */
export const RUNNING_BILL_ATTACHMENT_TYPE_OPTIONS = ["GOVERNMENT_LETTER", "CONTRACT", "INVOICE", "REPORT", "OTHER"];

/** Project Contract Information's master-record uploads. */
export const CONTRACT_INFO_ATTACHMENT_TYPE_OPTIONS = ["WORK_ORDER", "AGREEMENT", "BOQ", "DRAWING", "TECHNICAL_SANCTION", "ADMINISTRATIVE_APPROVAL", "OTHER"];

/** Vendor Ledger's Documents tab. */
export const VENDOR_ATTACHMENT_TYPE_OPTIONS = ["CONTRACT", "AGREEMENT", "INVOICE", "GOVERNMENT_LETTER", "OTHER"];

/** Accepted upload formats for the Documents module (Form 58 redesign) — no more manually-typed URLs. */
export const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png";

export async function getDocuments(projectId: string): Promise<ProjectDocument[]> {
  const response = await api.get<{ success: boolean; data: ProjectDocument[] }>("/documents", { params: { projectId } });
  return response.data.data;
}

export async function getDocumentsBySite(siteId: string): Promise<ProjectDocument[]> {
  const response = await api.get<{ success: boolean; data: ProjectDocument[] }>("/documents", { params: { siteId } });
  return response.data.data;
}

export async function getDocumentsByDPR(dprId: string): Promise<ProjectDocument[]> {
  const response = await api.get<{ success: boolean; data: ProjectDocument[] }>("/documents", { params: { dprId } });
  return response.data.data;
}

export async function getDocumentsByMB(measurementBookId: string): Promise<ProjectDocument[]> {
  const response = await api.get<{ success: boolean; data: ProjectDocument[] }>("/documents", { params: { measurementBookId } });
  return response.data.data;
}

export async function getDocumentsByRunningBill(runningBillId: string): Promise<ProjectDocument[]> {
  const response = await api.get<{ success: boolean; data: ProjectDocument[] }>("/documents", { params: { runningBillId } });
  return response.data.data;
}

export async function getDocumentsByVendor(vendorId: string): Promise<ProjectDocument[]> {
  const response = await api.get<{ success: boolean; data: ProjectDocument[] }>("/documents", { params: { vendorId } });
  return response.data.data;
}

/** Uploads a file directly (PDF/JPEG/PNG) — replaces the old fileName+fileUrl text-entry flow. */
export async function uploadDocument(file: File, params: DocumentUploadParams): Promise<ProjectDocument> {
  const formData = new FormData();
  formData.append("file", file);
  if (params.projectId) formData.append("projectId", params.projectId);
  if (params.siteId) formData.append("siteId", params.siteId);
  if (params.vendorId) formData.append("vendorId", params.vendorId);
  if (params.dprId) formData.append("dprId", params.dprId);
  if (params.measurementBookId) formData.append("measurementBookId", params.measurementBookId);
  if (params.runningBillId) formData.append("runningBillId", params.runningBillId);
  formData.append("documentType", params.documentType);
  formData.append("notes", params.notes);

  const response = await api.post<{ success: boolean; data: ProjectDocument }>("/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

/** Fetches a Document's file as a blob (authenticated — the download route requires the same Bearer token as every other API call, so a plain <a href> can't be used). */
async function fetchDocumentBlob(documentId: string): Promise<Blob> {
  const response = await api.get(`/documents/${documentId}/file`, { responseType: "blob" });
  return response.data;
}

export async function previewDocument(documentId: string): Promise<void> {
  const blob = await fetchDocumentBlob(documentId);
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

export async function downloadDocument(documentId: string, fileName: string): Promise<void> {
  const blob = await fetchDocumentBlob(documentId);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName || "document");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}
