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
  fileUrl: string;
  notes: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFormData {
  projectId?: string;
  siteId?: string;
  vendorId?: string;
  dprId?: string;
  measurementBookId?: string;
  runningBillId?: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
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

export async function createDocument(data: DocumentFormData): Promise<ProjectDocument> {
  const response = await api.post<{ success: boolean; data: ProjectDocument }>("/documents", data);
  return response.data.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}
