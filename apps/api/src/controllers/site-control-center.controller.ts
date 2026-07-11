import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  getSiteOverview,
  getSiteRecapLive,
  getRecapitulationDraft,
  createSiteRecapRevision,
  listSiteRecapRevisions,
  getCurrentSiteRecapRevision,
  getSiteRecapRevisionById,
  getSiteBudgetVsActualReport,
  getSiteCostBySubWorkReport,
  getSiteMonthlyCostReport,
  getSiteCostSummaryReport,
  exportSiteCostBySubWorkToCSV,
  getSiteWallet,
  getSiteBillReceivedReport,
  getSiteVendorBillsReport,
  getSiteMoneyFlow,
} from "../services/site-control-center.service.js";

const notFoundMessage = "Site not found";

function getSiteId(req: AuthRequest): string {
  return req.query.siteId as string;
}

export const getSiteOverviewHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteOverview(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load site overview" });
  }
};

export const getSiteRecapLiveHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteRecapLive(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load recapitulation sheet" });
  }
};

export const getRecapitulationDraftHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getRecapitulationDraft(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load recapitulation draft" });
  }
};

export const createSiteRecapRevisionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const data = await createSiteRecapRevision(getSiteId(req), companyId, userId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to save recap revision" });
  }
};

export const listSiteRecapRevisionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await listSiteRecapRevisions(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load recap revisions" });
  }
};

export const getCurrentSiteRecapRevisionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getCurrentSiteRecapRevision(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load current recap revision" });
  }
};

export const getSiteRecapRevisionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.revisionId) ? req.params.revisionId[0] : req.params.revisionId;
    const data = await getSiteRecapRevisionById(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Recap revision not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load recap revision" });
  }
};

export const getSiteBudgetVsActualHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteBudgetVsActualReport(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load budget vs actual report" });
  }
};

export const getSiteCostBySubWorkHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteCostBySubWorkReport(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load cost by sub work report" });
  }
};

export const getSiteMonthlyCostHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteMonthlyCostReport(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load monthly cost report" });
  }
};

export const getSiteCostSummaryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteCostSummaryReport(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load site cost summary" });
  }
};

export const exportSiteCostBySubWorkHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportSiteCostBySubWorkToCSV(getSiteId(req), companyId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="site-cost-summary-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export site cost summary" });
  }
};

export const getSiteWalletHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteWallet(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load site wallet" });
  }
};

export const getSiteBillReceivedHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteBillReceivedReport(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load bill received report" });
  }
};

export const getSiteVendorBillsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteVendorBillsReport(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor bills report" });
  }
};

export const getSiteMoneyFlowHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSiteMoneyFlow(getSiteId(req), companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load money flow" });
  }
};
