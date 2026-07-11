import { Router } from "express";
import {
  getAllocationLedgerHandler,
  getPartnerCapitalSummaryHandler,
  getProfitSharingReportHandler,
} from "../controllers/partnership-reports.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/allocation-ledger", authMiddleware, getAllocationLedgerHandler);
router.get("/capital-summary", authMiddleware, getPartnerCapitalSummaryHandler);
router.get("/profit-sharing", authMiddleware, getProfitSharingReportHandler);

export default router;
