import path from "path";
import fs from "fs";
import prisma from "../config/prisma.js";
import { UPLOAD_DIR } from "../middleware/upload.middleware.js";
import type { Prisma } from "@prisma/client";

/**
 * Work Order Extension History (Project Executive Dashboard milestone) — a Site's original
 * Work Order End Date (Site.completionDate) is never overwritten here; every extension is its
 * own permanent row. "Previous Completion Date" is always derived (the latest existing
 * extension's newCompletionDate, or the Site's original completionDate if this is the first
 * extension) — never asked of the user, so it can never be entered inconsistently with history.
 */

export interface WorkOrderExtensionFormInput {
  siteId: string;
  extensionOrderNumber: string;
  extensionOrderDate: string;
  newCompletionDate: string;
  reason: string;
  remarks?: string;
}

export interface UploadedFileInfo {
  originalName: string;
  storedFileName: string;
  mimeType: string;
  sizeBytes: number;
}

const include = {
  createdBy: { select: { id: true, name: true } },
};

type ExtensionRow = Prisma.WorkOrderExtensionGetPayload<{ include: typeof include }>;

function toDTO(e: ExtensionRow) {
  return {
    id: e.id,
    companyId: e.companyId,
    siteId: e.siteId,
    extensionOrderNumber: e.extensionOrderNumber,
    extensionOrderDate: e.extensionOrderDate.toISOString().slice(0, 10),
    previousCompletionDate: e.previousCompletionDate.toISOString().slice(0, 10),
    newCompletionDate: e.newCompletionDate.toISOString().slice(0, 10),
    reason: e.reason,
    remarks: e.remarks ?? "",
    hasFile: !!e.letterFilePath,
    letterFileName: e.letterFileName ?? "",
    letterMimeType: e.letterMimeType ?? "",
    letterFileSizeBytes: e.letterFileSizeBytes,
    createdById: e.createdById,
    createdBy: e.createdBy,
    createdAt: e.createdAt.toISOString(),
  };
}

export async function listWorkOrderExtensions(companyId: string, siteId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, companyId } });
  if (!site) throw new Error("Site not found");

  const rows = await prisma.workOrderExtension.findMany({
    where: { companyId, siteId },
    include,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDTO);
}

/** Latest Extension Till Date for a Site — null if the Site has never been extended. Used by the Project Executive Dashboard; never a stored/duplicated column on Site. */
export async function getLatestExtensionTillDateBySite(companyId: string, siteIds: string[]): Promise<Map<string, string>> {
  if (siteIds.length === 0) return new Map();
  const rows = await prisma.workOrderExtension.findMany({
    where: { companyId, siteId: { in: siteIds } },
    select: { siteId: true, newCompletionDate: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const byLatest = new Map<string, string>();
  for (const r of rows) {
    byLatest.set(r.siteId, r.newCompletionDate.toISOString().slice(0, 10));
  }
  return byLatest;
}

export async function createWorkOrderExtension(
  companyId: string,
  createdById: string,
  input: WorkOrderExtensionFormInput,
  file: UploadedFileInfo | null
) {
  if (!input.siteId?.trim()) throw new Error("Site is required");
  const site = await prisma.site.findFirst({ where: { id: input.siteId, companyId } });
  if (!site) throw new Error("Site not found");

  if (!input.extensionOrderNumber?.trim()) throw new Error("Extension Order Number is required");
  if (!input.extensionOrderDate) throw new Error("Extension Order Date is required");
  if (!input.newCompletionDate) throw new Error("New Completion Date is required");
  if (!input.reason?.trim()) throw new Error("Reason for Change is required");

  const latest = await prisma.workOrderExtension.findFirst({
    where: { companyId, siteId: input.siteId },
    orderBy: { createdAt: "desc" },
  });
  const previousCompletionDate = latest ? latest.newCompletionDate : site.completionDate;
  if (!previousCompletionDate) {
    throw new Error("This Site has no Work Order End Date set yet — set one on the Work Order Details tab before recording an extension");
  }

  const newCompletionDate = new Date(input.newCompletionDate);
  if (newCompletionDate.getTime() <= previousCompletionDate.getTime()) {
    throw new Error("New Completion Date must be after the current Completion Date");
  }

  const created = await prisma.workOrderExtension.create({
    data: {
      companyId,
      siteId: input.siteId,
      extensionOrderNumber: input.extensionOrderNumber.trim(),
      extensionOrderDate: new Date(input.extensionOrderDate),
      previousCompletionDate,
      newCompletionDate,
      reason: input.reason.trim(),
      remarks: input.remarks || null,
      letterFileName: file?.originalName || null,
      letterFilePath: file?.storedFileName || null,
      letterMimeType: file?.mimeType || null,
      letterFileSizeBytes: file?.sizeBytes || null,
      createdById,
    },
    include,
  });
  return toDTO(created);
}

export async function getWorkOrderExtensionFile(id: string, companyId: string) {
  const ext = await prisma.workOrderExtension.findFirst({ where: { id, companyId } });
  if (!ext) throw new Error("Work Order Extension not found");
  if (!ext.letterFilePath) throw new Error("This Extension has no uploaded letter");

  const absolutePath = path.join(UPLOAD_DIR, ext.letterFilePath);
  if (!fs.existsSync(absolutePath)) throw new Error("The uploaded file is missing from storage");

  return { absolutePath, fileName: ext.letterFileName || "extension-letter", mimeType: ext.letterMimeType || "application/octet-stream" };
}
