import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { getSiteWiseDeductions, getClientWiseDeductions, getSDPendingReport, getRecoveryLedger } from "../services/deduction-ledger.service.js";

function parseQuery(req: AuthRequest) {
  const { projectId, siteId, fromDate, toDate } = req.query;
  return {
    projectId: projectId as string,
    siteId: siteId as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
  };
}

export const getSiteWiseDeductionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteWiseDeductions(companyId, parseQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load site-wise deductions" });
  }
};

export const getClientWiseDeductionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getClientWiseDeductions(companyId, parseQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load client-wise deductions" });
  }
};

export const getSDPendingReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSDPendingReport(companyId, parseQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load SD pending report" });
  }
};

export const getRecoveryLedgerHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { type } = req.query;
    const data = await getRecoveryLedger(companyId, { ...parseQuery(req), type: type as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load recovery ledger" });
  }
};
