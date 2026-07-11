import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  getFinanceDashboard,
  getLiabilitySummaryReport,
  getOutstandingReport,
  getInterestPaidReport,
  getEMISchedule,
  getCreditCardReport,
  getCCUtilizationReport,
  getLoanLedger,
  getFundingSourceReport,
  getRepaymentReport,
  getEMICalendar,
  getLiabilityTimeline,
  getBankWiseRepaymentReport,
} from "../services/finance-reports.service.js";

function fail(res: Response, error: unknown, fallback: string) {
  const is404 = error instanceof Error && error.message === "Liability not found";
  res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : fallback });
}

export const getFinanceDashboardHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getFinanceDashboard(req.user!.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load Finance dashboard");
  }
};

export const getLiabilitySummaryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getLiabilitySummaryReport(req.user!.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load Liability Summary report");
  }
};

export const getOutstandingReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getOutstandingReport(req.user!.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load Outstanding report");
  }
};

export const getInterestPaidReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    const data = await getInterestPaidReport(req.user!.companyId, { fromDate: fromDate as string, toDate: toDate as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load Interest Paid report");
  }
};

export const getEMIScheduleHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getEMISchedule(req.user!.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load EMI Schedule");
  }
};

export const getCreditCardReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getCreditCardReport(req.user!.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load Credit Card report");
  }
};

export const getCCUtilizationReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getCCUtilizationReport(req.user!.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load CC Utilization report");
  }
};

export const getLoanLedgerHandler = async (req: AuthRequest, res: Response) => {
  try {
    const liabilityId = Array.isArray(req.query.liabilityId) ? req.query.liabilityId[0] : req.query.liabilityId;
    if (!liabilityId || typeof liabilityId !== "string") {
      res.status(400).json({ success: false, message: "liabilityId is required" });
      return;
    }
    const data = await getLoanLedger(liabilityId, req.user!.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load Loan Ledger");
  }
};

export const getFundingSourceReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const liabilityId = Array.isArray(req.query.liabilityId) ? req.query.liabilityId[0] : req.query.liabilityId;
    const data = await getFundingSourceReport(req.user!.companyId, liabilityId as string | undefined);
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load Funding Source report");
  }
};

export const getRepaymentReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { fromDate, toDate, liabilityId } = req.query;
    const data = await getRepaymentReport(req.user!.companyId, {
      fromDate: fromDate as string,
      toDate: toDate as string,
      liabilityId: liabilityId as string,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load Repayment report");
  }
};

export const getEMICalendarHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getEMICalendar(req.user!.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load EMI Calendar");
  }
};

export const getLiabilityTimelineHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getLiabilityTimeline(req.user!.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load Liability Timeline");
  }
};

export const getBankWiseRepaymentReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    const data = await getBankWiseRepaymentReport(req.user!.companyId, { fromDate: fromDate as string, toDate: toDate as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    fail(res, error, "Failed to load Bank-wise Repayment report");
  }
};
