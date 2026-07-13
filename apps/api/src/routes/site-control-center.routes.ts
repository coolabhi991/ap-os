import { Router } from "express";
import {
  getSiteOverviewHandler,
  getSiteRecapLiveHandler,
  getRecapitulationDraftHandler,
  createSiteRecapRevisionHandler,
  listSiteRecapRevisionsHandler,
  getCurrentSiteRecapRevisionHandler,
  getSiteRecapRevisionHandler,
  addRecapItemHandler,
  updateRecapItemHandler,
  deleteRecapItemHandler,
  reorderRecapItemsHandler,
  updateRecapChargesHandler,
  getSiteBudgetVsActualHandler,
  getSiteCostBySubWorkHandler,
  getSiteSubWorkFinancialSummaryHandler,
  getSiteMonthlyCostHandler,
  getSiteCostSummaryHandler,
  exportSiteCostBySubWorkHandler,
  getSiteWalletHandler,
  getSiteBillReceivedHandler,
  getSiteVendorBillsHandler,
  getSiteMoneyFlowHandler,
  getSiteFinancialSummaryHandler,
} from "../controllers/site-control-center.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/overview", authMiddleware, getSiteOverviewHandler);
router.get("/wallet", authMiddleware, getSiteWalletHandler);
router.get("/bill-received", authMiddleware, getSiteBillReceivedHandler);
router.get("/vendor-bills", authMiddleware, getSiteVendorBillsHandler);
router.get("/money-flow", authMiddleware, getSiteMoneyFlowHandler);
router.get("/financial-summary", authMiddleware, getSiteFinancialSummaryHandler);

router.get("/recap/live", authMiddleware, getSiteRecapLiveHandler);
router.get("/recap/draft", authMiddleware, getRecapitulationDraftHandler);
router.get("/recap/revisions", authMiddleware, listSiteRecapRevisionsHandler);
router.get("/recap/revisions/current", authMiddleware, getCurrentSiteRecapRevisionHandler);
router.get("/recap/revisions/:revisionId", authMiddleware, getSiteRecapRevisionHandler);
router.post("/recap/revisions", authMiddleware, createSiteRecapRevisionHandler);

router.put("/recap/charges", authMiddleware, updateRecapChargesHandler);
router.put("/recap/items/reorder", authMiddleware, reorderRecapItemsHandler);
router.post("/recap/items", authMiddleware, addRecapItemHandler);
router.put("/recap/items/:itemId", authMiddleware, updateRecapItemHandler);
router.delete("/recap/items/:itemId", authMiddleware, deleteRecapItemHandler);

router.get("/reports/budget-vs-actual", authMiddleware, getSiteBudgetVsActualHandler);
router.get("/reports/cost-by-sub-work", authMiddleware, getSiteCostBySubWorkHandler);
router.get("/reports/sub-work-financial-summary", authMiddleware, getSiteSubWorkFinancialSummaryHandler);
router.get("/reports/monthly-cost", authMiddleware, getSiteMonthlyCostHandler);
router.get("/reports/cost-summary", authMiddleware, getSiteCostSummaryHandler);
router.get("/reports/export", authMiddleware, exportSiteCostBySubWorkHandler);

export default router;
