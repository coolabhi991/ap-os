import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  getSubWorkRecap,
  getSubWorkDrillDown,
  getProjectOverview,
  getBudgetVsActualReport,
  getCostBySubWorkReport,
  getMonthlyCostReport,
  getProjectCostSummaryReport,
  exportCostBySubWorkToCSV,
  CostHeadKey,
} from "../services/project-control-center.service.js";

const notFoundMessage = "Project not found";

function getProjectId(req: AuthRequest): string {
  return req.query.projectId as string;
}

export const getOverviewHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = getProjectId(req);
    const data = await getProjectOverview(projectId, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load project overview" });
  }
};

export const getBudgetVsActualHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = getProjectId(req);
    const data = await getBudgetVsActualReport(projectId, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load budget vs actual report" });
  }
};

export const getCostBySubWorkHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = getProjectId(req);
    const data = await getCostBySubWorkReport(projectId, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load cost by sub work report" });
  }
};

export const getMonthlyCostHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = getProjectId(req);
    const data = await getMonthlyCostReport(projectId, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load monthly cost report" });
  }
};

export const getProjectCostSummaryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = getProjectId(req);
    const data = await getProjectCostSummaryReport(projectId, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load project cost summary" });
  }
};

export const exportCostBySubWorkHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = getProjectId(req);
    const csv = await exportCostBySubWorkToCSV(projectId, companyId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="project-cost-summary-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export project cost summary" });
  }
};

export const getSubWorkRecapHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const subWorkId = Array.isArray(req.params.subWorkId) ? req.params.subWorkId[0] : req.params.subWorkId;
    const data = await getSubWorkRecap(subWorkId, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Sub Work not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load recapitulation sheet" });
  }
};

const VALID_HEADS: CostHeadKey[] = ["material", "labour", "machinery", "fuel", "vendorBills", "siteExpenses", "other"];

export const getSubWorkDrillDownHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const subWorkId = Array.isArray(req.params.subWorkId) ? req.params.subWorkId[0] : req.params.subWorkId;
    const head = req.params.head as CostHeadKey;
    if (!VALID_HEADS.includes(head)) {
      res.status(400).json({ success: false, message: `Invalid cost head. Must be one of ${VALID_HEADS.join(", ")}` });
      return;
    }
    const data = await getSubWorkDrillDown(subWorkId, companyId, head);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Sub Work not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load drill-down" });
  }
};
