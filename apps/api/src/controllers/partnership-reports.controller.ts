import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { getAllocationLedger, getPartnerCapitalSummary, getProfitSharingReport } from "../services/partnership-reports.service.js";

export const getAllocationLedgerHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { allocationType, siteId, fromDate, toDate, page, limit } = req.query;
    const result = await getAllocationLedger(companyId, {
      allocationType: allocationType as string,
      siteId: siteId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load allocation ledger" });
  }
};

export const getPartnerCapitalSummaryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getPartnerCapitalSummary(companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load partner capital summary" });
  }
};

export const getProfitSharingReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { fromDate, toDate } = req.query;
    const data = await getProfitSharingReport(companyId, { fromDate: fromDate as string, toDate: toDate as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load profit sharing report" });
  }
};
