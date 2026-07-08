import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listLabour,
  getLabourById,
  createLabour,
  updateLabour,
  deleteLabour,
  exportLabourToCSV,
} from "../services/labour.service.js";

const notFoundMessage = "Labour not found";

function parseListQuery(req: AuthRequest) {
  const { search, projectId, contractorId, groupId, category, status, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    projectId: projectId as string,
    contractorId: contractorId as string,
    groupId: groupId as string,
    category: category as string,
    status: status as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string,
    sortOrder: (sortOrder as "asc" | "desc") || undefined,
  };
}

export const getLabours = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const result = await listLabour(companyId, parseListQuery(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load labour" });
  }
};

export const getLabour = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const labour = await getLabourById(id, companyId);
    res.status(200).json({ success: true, data: labour });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load labour" });
  }
};

export const createLabourHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const labour = await createLabour(companyId, createdById, req.body);
    res.status(201).json({ success: true, data: labour });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create labour" });
  }
};

export const updateLabourHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const labour = await updateLabour(id, companyId, req.body);
    res.status(200).json({ success: true, data: labour });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update labour" });
  }
};

export const deleteLabourHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteLabour(id, companyId);
    res.status(200).json({ success: true, message: "Labour deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete labour" });
  }
};

export const exportLabourHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportLabourToCSV(companyId, parseListQuery(req));

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="labour-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export labour" });
  }
};
