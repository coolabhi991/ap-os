import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listMRs,
  getMRById,
  createMR,
  updateMR,
  deleteMR,
  getReceivablePOs,
} from "../services/material-receipt.service.js";

export const getMRs = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, projectId, vendorId, purchaseOrderId, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;

    const result = await listMRs(companyId, {
      search: search as string,
      status: status as string,
      projectId: projectId as string,
      vendorId: vendorId as string,
      purchaseOrderId: purchaseOrderId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load receipts" });
  }
};

export const getMR = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const mr = await getMRById(id, companyId);
    res.status(200).json({ success: true, data: mr });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Material Receipt not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load receipt" });
  }
};

export const createMRHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const mr = await createMR(companyId, req.body);
    res.status(201).json({ success: true, data: mr });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create receipt" });
  }
};

export const updateMRHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const mr = await updateMR(id, companyId, req.body);
    res.status(200).json({ success: true, data: mr });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Material Receipt not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update receipt" });
  }
};

export const deleteMRHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteMR(id, companyId);
    res.status(200).json({ success: true, message: "Receipt deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Material Receipt not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete receipt" });
  }
};

export const getReceivablePOsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const pos = await getReceivablePOs(companyId);
    res.status(200).json({ success: true, data: pos });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load purchase orders" });
  }
};
