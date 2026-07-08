import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listLabourAdvances,
  getLabourAdvanceById,
  createLabourAdvance,
  deleteLabourAdvance,
  exportLabourAdvancesToCSV,
} from "../services/labour-advance.service.js";

const notFoundMessage = "Advance not found";

function parseListQuery(req: AuthRequest) {
  const { search, labourId, projectId, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    labourId: labourId as string,
    projectId: projectId as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string,
    sortOrder: (sortOrder as "asc" | "desc") || undefined,
  };
}

export const getLabourAdvances = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const result = await listLabourAdvances(companyId, parseListQuery(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load advances" });
  }
};

export const getLabourAdvance = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const advance = await getLabourAdvanceById(id, companyId);
    res.status(200).json({ success: true, data: advance });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load advance" });
  }
};

export const createLabourAdvanceHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const advance = await createLabourAdvance(companyId, createdById, req.body);
    res.status(201).json({ success: true, data: advance });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create advance" });
  }
};

export const deleteLabourAdvanceHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteLabourAdvance(id, companyId);
    res.status(200).json({ success: true, message: "Advance deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete advance" });
  }
};

export const exportLabourAdvancesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportLabourAdvancesToCSV(companyId, parseListQuery(req));

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="labour-advances-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export advances" });
  }
};
