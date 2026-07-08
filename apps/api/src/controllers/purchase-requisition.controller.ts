import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listPRs,
  getPRById,
  createPR,
  updatePR,
  deletePR,
} from "../services/purchase-requisition.service.js";

export const getPRs = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, projectId, vendorId, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;

    const result = await listPRs(companyId, {
      search: search as string,
      status: status as string,
      projectId: projectId as string,
      vendorId: vendorId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load requisitions" });
  }
};

export const getPR = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const pr = await getPRById(id, companyId);
    res.status(200).json({ success: true, data: pr });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Purchase Requisition not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load requisition" });
  }
};

export const createPRHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const pr = await createPR(companyId, req.body);
    res.status(201).json({ success: true, data: pr });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create requisition" });
  }
};

export const updatePRHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const pr = await updatePR(id, companyId, req.body);
    res.status(200).json({ success: true, data: pr });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Purchase Requisition not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update requisition" });
  }
};

export const deletePRHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deletePR(id, companyId);
    res.status(200).json({ success: true, message: "Requisition deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Purchase Requisition not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete requisition" });
  }
};
