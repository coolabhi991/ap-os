import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listPartnerInvestments, getPartnerInvestmentById, createPartnerInvestment, deletePartnerInvestment } from "../services/partner-investment.service.js";

const notFoundMessage = "Partner Investment not found";

export const getPartnerInvestments = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, partnerId, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
    const result = await listPartnerInvestments(companyId, {
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
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load partner investments" });
  }
};

export const getPartnerInvestment = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getPartnerInvestmentById(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load partner investment" });
  }
};

export const createPartnerInvestmentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const data = await createPartnerInvestment(companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create partner investment" });
  }
};

export const deletePartnerInvestmentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deletePartnerInvestment(id, companyId);
    res.status(200).json({ success: true, message: "Partner investment deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete partner investment" });
  }
};
