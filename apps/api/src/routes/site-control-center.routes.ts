import { Router } from "express";
import {
  getSiteOverviewHandler,
  getSiteRecapLiveHandler,
  createSiteRecapRevisionHandler,
  listSiteRecapRevisionsHandler,
  getCurrentSiteRecapRevisionHandler,
  getSiteRecapRevisionHandler,
  getSiteBudgetVsActualHandler,
  getSiteCostBySubWorkHandler,
  getSiteMonthlyCostHandler,
  getSiteCostSummaryHandler,
  exportSiteCostBySubWorkHandler,
  getSiteWalletHandler,
} from "../controllers/site-control-center.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/overview", authMiddleware, getSiteOverviewHandler);
router.get("/wallet", authMiddleware, getSiteWalletHandler);

router.get("/recap/live", authMiddleware, getSiteRecapLiveHandler);
router.get("/recap/revisions", authMiddleware, listSiteRecapRevisionsHandler);
router.get("/recap/revisions/current", authMiddleware, getCurrentSiteRecapRevisionHandler);
router.get("/recap/revisions/:revisionId", authMiddleware, getSiteRecapRevisionHandler);
router.post("/recap/revisions", authMiddleware, createSiteRecapRevisionHandler);

router.get("/reports/budget-vs-actual", authMiddleware, getSiteBudgetVsActualHandler);
router.get("/reports/cost-by-sub-work", authMiddleware, getSiteCostBySubWorkHandler);
router.get("/reports/monthly-cost", authMiddleware, getSiteMonthlyCostHandler);
router.get("/reports/cost-summary", authMiddleware, getSiteCostSummaryHandler);
router.get("/reports/export", authMiddleware, exportSiteCostBySubWorkHandler);

export default router;
