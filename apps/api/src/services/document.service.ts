import prisma from "../config/prisma.js";
import { DocumentType } from "@prisma/client";
import path from "path";
import fs from "fs";
import { UPLOAD_DIR } from "../middleware/upload.middleware.js";

export interface DocumentFormInput {
  projectId?: string;
  siteId?: string;
  vendorId?: string;
  dprId?: string;
  measurementBookId?: string;
  runningBillId?: string;
  documentType?: string;
  notes?: string;
}

export interface UploadedFileInfo {
  originalName: string;
  storedFileName: string;
  mimeType: string;
  sizeBytes: number;
}

export const DOCUMENT_TYPES = [
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

/** Measurement Book Photos & Attachments use these 5 types specifically. */
export const MB_ATTACHMENT_TYPE_OPTIONS = ["SCANNED_MB", "ABSTRACT_SHEET", "DRAWING", "TEST_REPORT", "OTHER"];

/** Running Bill Photos & Attachments — government letters plus the usual generic types. */
export const RUNNING_BILL_ATTACHMENT_TYPE_OPTIONS = ["GOVERNMENT_LETTER", "CONTRACT", "INVOICE", "REPORT", "OTHER"];

/** Project Contract Information's master-record uploads. */
export const CONTRACT_INFO_ATTACHMENT_TYPE_OPTIONS = ["WORK_ORDER", "AGREEMENT", "BOQ", "DRAWING", "TECHNICAL_SANCTION", "ADMINISTRATIVE_APPROVAL", "OTHER"];

/** Vendor Ledger's Documents tab. */
export const VENDOR_ATTACHMENT_TYPE_OPTIONS = ["CONTRACT", "AGREEMENT", "INVOICE", "GOVERNMENT_LETTER", "OTHER"];

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
  siteId: string | null;
  vendorId: string | null;
  dprId: string | null;
  measurementBookId: string | null;
  runningBillId: string | null;
  documentType: DocumentType;
  documentNumber: string;
  fileName: string | null;
  filePath: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  notes: string | null;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: d.id,
    companyId: d.companyId,
    projectId: d.projectId ?? "",
    siteId: d.siteId ?? "",
    vendorId: d.vendorId ?? "",
    dprId: d.dprId ?? "",
    measurementBookId: d.measurementBookId ?? "",
    runningBillId: d.runningBillId ?? "",
    documentType: d.documentType,
    documentNumber: d.documentNumber,
    fileName: d.fileName ?? "",
    hasFile: !!d.filePath,
    mimeType: d.mimeType ?? "",
    fileSizeBytes: d.fileSizeBytes ?? 0,
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

/** Site Workspace's Documents tab — scoped to a single Site rather than the whole Project. */
export async function listDocumentsBySite(companyId: string, siteId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, companyId } });
  if (!site) throw new Error("Site not found");

  const documents = await prisma.document.findMany({
    where: { companyId, siteId },
    orderBy: { uploadedAt: "desc" },
  });
  return documents.map(toDTO);
}

/** Photos & Attachments for a single DPR — reuses the Document model rather than a separate attachment table. */
export async function listDocumentsByDPR(companyId: string, dprId: string) {
  const dpr = await prisma.dailyProgressReport.findFirst({ where: { id: dprId, companyId } });
  if (!dpr) throw new Error("DPR not found");

  const documents = await prisma.document.findMany({
    where: { companyId, dprId },
    orderBy: { uploadedAt: "desc" },
  });
  return documents.map(toDTO);
}

/** Photos & Attachments for a single Measurement Book — reuses the Document model rather than a separate attachment table. */
export async function listDocumentsByMB(companyId: string, measurementBookId: string) {
  const mb = await prisma.measurementBook.findFirst({ where: { id: measurementBookId, companyId } });
  if (!mb) throw new Error("Measurement Book not found");

  const documents = await prisma.document.findMany({
    where: { companyId, measurementBookId },
    orderBy: { uploadedAt: "desc" },
  });
  return documents.map(toDTO);
}

/** Photos & Attachments (Running Bill PDF, Government Letters, ...) for a single Running Bill — reuses the Document model rather than a separate attachment table. */
export async function listDocumentsByRunningBill(companyId: string, runningBillId: string) {
  const bill = await prisma.runningBill.findFirst({ where: { id: runningBillId, companyId } });
  if (!bill) throw new Error("Running Bill not found");

  const documents = await prisma.document.findMany({
    where: { companyId, runningBillId },
    orderBy: { uploadedAt: "desc" },
  });
  return documents.map(toDTO);
}

/** Documents attached directly to a Vendor (contracts, agreements, government letters, ...) — reuses the Document model rather than a separate attachment table. */
export async function listDocumentsByVendor(companyId: string, vendorId: string) {
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, companyId } });
  if (!vendor) throw new Error("Vendor not found");

  const documents = await prisma.document.findMany({
    where: { companyId, vendorId },
    orderBy: { uploadedAt: "desc" },
  });
  return documents.map(toDTO);
}

export async function createDocument(companyId: string, input: DocumentFormInput, file: UploadedFileInfo | null) {
  if (!input.projectId?.trim() && !input.vendorId?.trim()) {
    throw new Error("Either a Project or a Vendor is required");
  }

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

  if (input.siteId) {
    const site = await prisma.site.findFirst({ where: { id: input.siteId, companyId } });
    if (!site) throw new Error("Site not found");
  }

  if (input.vendorId) {
    const vendor = await prisma.vendor.findFirst({ where: { id: input.vendorId, companyId } });
    if (!vendor) throw new Error("Vendor not found");
  }

  if (input.dprId) {
    const dpr = await prisma.dailyProgressReport.findFirst({ where: { id: input.dprId, companyId, projectId: input.projectId } });
    if (!dpr) throw new Error("DPR not found");
  }

  if (input.measurementBookId) {
    const mb = await prisma.measurementBook.findFirst({ where: { id: input.measurementBookId, companyId, projectId: input.projectId } });
    if (!mb) throw new Error("Measurement Book not found");
  }

  if (input.runningBillId) {
    const bill = await prisma.runningBill.findFirst({ where: { id: input.runningBillId, companyId, projectId: input.projectId } });
    if (!bill) throw new Error("Running Bill not found");
  }

  if (!file) {
    throw new Error("A file is required");
  }

  const document = await prisma.document.create({
    data: {
      companyId,
      projectId: input.projectId || null,
      siteId: input.siteId || null,
      vendorId: input.vendorId || null,
      dprId: input.dprId || null,
      measurementBookId: input.measurementBookId || null,
      runningBillId: input.runningBillId || null,
      documentType: parseDocumentType(input.documentType),
      documentNumber: autoNumber(),
      fileName: file.originalName,
      filePath: file.storedFileName,
      mimeType: file.mimeType,
      fileSizeBytes: file.sizeBytes,
      notes: input.notes || null,
    },
  });

  return toDTO(document);
}

/** Resolves a Document to its on-disk path + display metadata for the authenticated download/preview route — never a public static path. */
export async function getDocumentFile(id: string, companyId: string) {
  const doc = await prisma.document.findFirst({ where: { id, companyId } });
  if (!doc) throw new Error("Document not found");
  if (!doc.filePath) throw new Error("This document has no uploaded file");

  const absolutePath = path.join(UPLOAD_DIR, doc.filePath);
  if (!fs.existsSync(absolutePath)) throw new Error("The uploaded file is missing from storage");

  return { absolutePath, fileName: doc.fileName || doc.filePath, mimeType: doc.mimeType || "application/octet-stream" };
}

export async function deleteDocument(id: string, companyId: string) {
  const existing = await prisma.document.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Document not found");
  await prisma.document.delete({ where: { id } });
  if (existing.filePath) {
    const absolutePath = path.join(UPLOAD_DIR, existing.filePath);
    fs.unlink(absolutePath, () => {});
  }
}
