import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listSubWorks,
  getSubWorkById,
  createSubWork,
  updateSubWork,
  deleteSubWork,
  reorderSubWorks,
} from "../services/sub-work.service.js";

const notFoundMessage = "Sub Work not found";

export const getSubWorksHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({ success: false, message: "projectId query param is required" });
      return;
    }
    const data = await listSubWorks(companyId, projectId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Project not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load sub works" });
  }
};

export const getSubWorkHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getSubWorkById(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load sub work" });
  }
};

export const createSubWorkHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await createSubWork(companyId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create sub work" });
  }
};

export const updateSubWorkHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await updateSubWork(id, companyId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update sub work" });
  }
};

export const deleteSubWorkHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteSubWork(id, companyId);
    res.status(200).json({ success: true, message: "Sub Work deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete sub work" });
  }
};

export const reorderSubWorksHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { projectId, order } = req.body as { projectId: string; order: { id: string; sortOrder: number }[] };
    const data = await reorderSubWorks(companyId, projectId, order ?? []);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to reorder sub works" });
  }
};
