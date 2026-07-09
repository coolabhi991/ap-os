import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listDocuments, createDocument, deleteDocument } from "../services/document.service.js";

const notFoundMessage = "Document not found";

export const getDocumentsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({ success: false, message: "projectId query param is required" });
      return;
    }
    const data = await listDocuments(companyId, projectId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Project not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load documents" });
  }
};

export const createDocumentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await createDocument(companyId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create document" });
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
