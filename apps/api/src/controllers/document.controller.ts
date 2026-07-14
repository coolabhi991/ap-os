import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listDocuments,
  listDocumentsBySite,
  listDocumentsByDPR,
  listDocumentsByMB,
  listDocumentsByRunningBill,
  listDocumentsByVendor,
  createDocument,
  deleteDocument,
  getDocumentFile,
} from "../services/document.service.js";
import type { UploadedFileInfo } from "../services/document.service.js";

const notFoundMessage = "Document not found";

export const getDocumentsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = req.query.projectId as string;
    const siteId = req.query.siteId as string;
    const vendorId = req.query.vendorId as string;
    const dprId = req.query.dprId as string;
    const measurementBookId = req.query.measurementBookId as string;
    const runningBillId = req.query.runningBillId as string;
    if (!projectId && !siteId && !vendorId && !dprId && !measurementBookId && !runningBillId) {
      res.status(400).json({ success: false, message: "projectId, siteId, vendorId, dprId, measurementBookId, or runningBillId query param is required" });
      return;
    }
    const data = runningBillId
      ? await listDocumentsByRunningBill(companyId, runningBillId)
      : measurementBookId
        ? await listDocumentsByMB(companyId, measurementBookId)
        : dprId
          ? await listDocumentsByDPR(companyId, dprId)
          : vendorId
            ? await listDocumentsByVendor(companyId, vendorId)
            : siteId
              ? await listDocumentsBySite(companyId, siteId)
              : await listDocuments(companyId, projectId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 =
      error instanceof Error &&
      (error.message === "Project not found" ||
        error.message === "Site not found" ||
        error.message === "Vendor not found" ||
        error.message === "DPR not found" ||
        error.message === "Measurement Book not found" ||
        error.message === "Running Bill not found");
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load documents" });
  }
};

export const createDocumentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const uploaded = req.file;
    const file: UploadedFileInfo | null = uploaded
      ? { originalName: uploaded.originalname, storedFileName: uploaded.filename, mimeType: uploaded.mimetype, sizeBytes: uploaded.size }
      : null;
    const data = await createDocument(companyId, req.body, file);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create document" });
  }
};

export const downloadDocumentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { absolutePath, fileName, mimeType } = await getDocumentFile(id, companyId);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
    res.sendFile(absolutePath);
  } catch (error) {
    const is404 = error instanceof Error && (error.message === notFoundMessage || error.message === "This document has no uploaded file" || error.message === "The uploaded file is missing from storage");
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load the file" });
  }
};

export const deleteDocumentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteDocument(id, companyId);
    res.status(200).json({ success: true, message: "Document deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete document" });
  }
};
