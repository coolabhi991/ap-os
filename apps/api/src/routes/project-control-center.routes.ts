import { Router } from "express";
import {
  getOverviewHandler,
  getBudgetVsActualHandler,
  getCostBySubWorkHandler,
  getMonthlyCostHandler,
  getProjectCostSummaryHandler,
  exportCostBySubWorkHandler,
  getSubWorkRecapHandler,
  getSubWorkDrillDownHandler,
} from "../controllers/project-control-center.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/overview", authMiddleware, getOverviewHandler);
router.get("/reports/budget-vs-actual", authMiddleware, getBudgetVsActualHandler);
router.get("/reports/cost-by-sub-work", authMiddleware, getCostBySubWorkHandler);
router.get("/reports/monthly-cost", authMiddleware, getMonthlyCostHandler);
router.get("/reports/cost-summary", authMiddleware, getProjectCostSummaryHandler);
router.get("/reports/export", authMiddleware, exportCostBySubWorkHandler);

router.get("/sub-works/:subWorkId/recap", authMiddleware, getSubWorkRecapHandler);
router.get("/sub-works/:subWorkId/drill-down/:head", authMiddleware, getSubWorkDrillDownHandler);

export default router;
