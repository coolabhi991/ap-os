import api from "./api";

export interface ProjectDocument {
  id: string;
  companyId: string;
  projectId: string;
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
  projectId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  notes: string;
}

export const DOCUMENT_TYPE_OPTIONS = ["CONTRACT", "DRAWING", "INVOICE", "PHOTO", "REPORT", "OTHER"];

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CONTRACT: "Contract",
  DRAWING: "Drawing",
  INVOICE: "Invoice",
  PHOTO: "Photo",
  REPORT: "Report",
  OTHER: "Other",
};

export async function getDocuments(projectId: string): Promise<ProjectDocument[]> {
  const response = await api.get<{ success: boolean; data: ProjectDocument[] }>("/documents", { params: { projectId } });
  return response.data.data;
}

export async function createDocument(data: DocumentFormData): Promise<ProjectDocument> {
  const response = await api.post<{ success: boolean; data: ProjectDocument }>("/documents", data);
  return response.data.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}
