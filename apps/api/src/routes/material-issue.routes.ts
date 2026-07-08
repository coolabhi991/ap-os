import { Router } from "express";
import {
  getMaterialIssues,
  getMaterialIssue,
  createMaterialIssueHandler,
  updateMaterialIssueHandler,
  deleteMaterialIssueHandler,
  getMaterialIssueDashboardHandler,
  getProjectConsumptionReportHandler,
  getMaterialConsumptionReportHandler,
  getMonthlyConsumptionReportHandler,
  getStockMovementReportHandler,
  exportMaterialIssuesHandler,
} from "../controllers/material-issue.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/export", authMiddleware, exportMaterialIssuesHandler);
router.get("/dashboard", authMiddleware, getMaterialIssueDashboardHandler);
router.get("/reports/project-consumption", authMiddleware, getProjectConsumptionReportHandler);
router.get("/reports/material-consumption", authMiddleware, getMaterialConsumptionReportHandler);
router.get("/reports/monthly-consumption", authMiddleware, getMonthlyConsumptionReportHandler);
router.get("/reports/stock-movement", authMiddleware, getStockMovementReportHandler);

router.get("/", authMiddleware, getMaterialIssues);
router.get("/:id", authMiddleware, getMaterialIssue);
router.post("/", authMiddleware, createMaterialIssueHandler);
router.put("/:id", authMiddleware, updateMaterialIssueHandler);
router.delete("/:id", authMiddleware, deleteMaterialIssueHandler);

export default router;
