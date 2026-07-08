import { Router } from "express";
import {
  getLabourDashboardHandler,
  getWageRegisterHandler,
  getPendingWagesHandler,
  getProjectLabourCostReportHandler,
} from "../controllers/labour-report.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/dashboard", authMiddleware, getLabourDashboardHandler);
router.get("/reports/wage-register", authMiddleware, getWageRegisterHandler);
router.get("/reports/pending-wages", authMiddleware, getPendingWagesHandler);
router.get("/reports/project-cost", authMiddleware, getProjectLabourCostReportHandler);

export default router;
