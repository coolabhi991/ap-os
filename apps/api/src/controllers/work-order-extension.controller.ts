import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listWorkOrderExtensions,
  createWorkOrderExtension,
  getWorkOrderExtensionFile,
} from "../services/work-order-extension.service.js";
import type { UploadedFileInfo } from "../services/work-order-extension.service.js";

export const getWorkOrderExtensionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const siteId = req.query.siteId as string;
    if (!siteId) {
      res.status(400).json({ success: false, message: "siteId query param is required" });
      return;
    }
    const data = await listWorkOrderExtensions(companyId, siteId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load extension history" });
  }
};

export const createWorkOrderExtensionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const uploaded = req.file;
    const file: UploadedFileInfo | null = uploaded
      ? { originalName: uploaded.originalname, storedFileName: uploaded.filename, mimeType: uploaded.mimetype, sizeBytes: uploaded.size }
      : null;
    const data = await createWorkOrderExtension(companyId, req.user!.id, req.body, file);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to record extension" });
  }
};

export const downloadWorkOrderExtensionFileHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { absolutePath, fileName, mimeType } = await getWorkOrderExtensionFile(id, companyId);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
    res.sendFile(absolutePath);
  } catch (error) {
    const is404 =
      error instanceof Error &&
      (error.message === "Work Order Extension not found" || error.message === "This Extension has no uploaded letter" || error.message === "The uploaded file is missing from storage");
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load the file" });
  }
};
