import prisma from "../config/prisma.js";
import { DocumentType } from "@prisma/client";

export interface DocumentFormInput {
  projectId: string;
  documentType?: string;
  fileName?: string;
  fileUrl?: string;
  notes?: string;
}

export const DOCUMENT_TYPES = ["CONTRACT", "DRAWING", "INVOICE", "PHOTO", "REPORT", "OTHER"];

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CONTRACT: "Contract",
  DRAWING: "Drawing",
  INVOICE: "Invoice",
  PHOTO: "Photo",
  REPORT: "Report",
  OTHER: "Other",
};

function parseDocumentType(t: string | undefined): DocumentType {
  const upper = (t ?? "").trim().toUpperCase();
  return DOCUMENT_TYPES.includes(upper) ? (upper as DocumentType) : "OTHER";
}

function autoNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `DOC-${y}${m}-${rand}`;
}

function toDTO(d: {
  id: string;
  companyId: string;
  projectId: string | null;
  documentType: DocumentType;
  documentNumber: string;
  fileName: string | null;
  fileUrl: string | null;
  notes: string | null;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: d.id,
    companyId: d.companyId,
    projectId: d.projectId ?? "",
    documentType: d.documentType,
    documentNumber: d.documentNumber,
    fileName: d.fileName ?? "",
    fileUrl: d.fileUrl ?? "",
    notes: d.notes ?? "",
    uploadedAt: d.uploadedAt.toISOString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export async function listDocuments(companyId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new Error("Project not found");

  const documents = await prisma.document.findMany({
    where: { companyId, projectId },
    orderBy: { uploadedAt: "desc" },
  });
  return documents.map(toDTO);
}

export async function createDocument(companyId: string, input: DocumentFormInput) {
  if (!input.projectId?.trim()) throw new Error("Project is required");
  const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
  if (!project) throw new Error("Project not found");

  if (!input.fileName?.trim() && !input.fileUrl?.trim()) {
    throw new Error("Either a file name or file URL is required");
  }

  const document = await prisma.document.create({
    data: {
      companyId,
      projectId: input.projectId,
      documentType: parseDocumentType(input.documentType),
      documentNumber: autoNumber(),
      fileName: input.fileName || null,
      fileUrl: input.fileUrl || null,
      notes: input.notes || null,
    },
  });

  return toDTO(document);
}

export async function deleteDocument(id: string, companyId: string) {
  const existing = await prisma.document.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Document not found");
  await prisma.document.delete({ where: { id } });
}
