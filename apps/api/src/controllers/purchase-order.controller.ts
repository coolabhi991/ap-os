import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listPOs,
  getPOById,
  createPO,
  updatePO,
  deletePO,
  getApprovedPRs,
} from "../services/purchase-order.service.js";

export const getPOs = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, projectId, vendorId, requisitionId, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;

    const result = await listPOs(companyId, {
      search: search as string,
      status: status as string,
      projectId: projectId as string,
      vendorId: vendorId as string,
      requisitionId: requisitionId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load purchase orders" });
  }
};

export const getPO = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const po = await getPOById(id, companyId);
    res.status(200).json({ success: true, data: po });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Purchase Order not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load purchase order" });
  }
};

export const createPOHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const po = await createPO(companyId, req.body);
    res.status(201).json({ success: true, data: po });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create purchase order" });
  }
};

export const updatePOHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const po = await updatePO(id, companyId, req.body);
    res.status(200).json({ success: true, data: po });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Purchase Order not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update purchase order" });
  }
};

export const deletePOHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deletePO(id, companyId);
    res.status(200).json({ success: true, message: "Purchase Order deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Purchase Order not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete purchase order" });
  }
};

/** Returns approved PRs available for PO creation. */
export const getApprovedPRsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const prs = await getApprovedPRs(companyId);
    res.status(200).json({ success: true, data: prs });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load requisitions" });
  }
};
