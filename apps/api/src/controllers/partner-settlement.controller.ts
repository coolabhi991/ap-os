import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listPartnerSettlements, getPartnerSettlementById, createPartnerSettlement, deletePartnerSettlement } from "../services/partner-settlement.service.js";

const notFoundMessage = "Partner Settlement not found";

export const getPartnerSettlements = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, partnerId, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
    const result = await listPartnerSettlements(companyId, {
      search: search as string,
      partnerId: partnerId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load partner settlements" });
  }
};

export const getPartnerSettlement = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getPartnerSettlementById(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load partner settlement" });
  }
};

export const createPartnerSettlementHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const data = await createPartnerSettlement(companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create partner settlement" });
  }
};

export const deletePartnerSettlementHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deletePartnerSettlement(id, companyId);
    res.status(200).json({ success: true, message: "Partner settlement deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete partner settlement" });
  }
};
