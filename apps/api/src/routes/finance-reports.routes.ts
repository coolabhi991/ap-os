import { Router } from "express";
import {
  getFinanceDashboardHandler,
  getLiabilitySummaryHandler,
  getOutstandingReportHandler,
  getInterestPaidReportHandler,
  getEMIScheduleHandler,
  getCreditCardReportHandler,
  getCCUtilizationReportHandler,
  getLoanLedgerHandler,
  getFundingSourceReportHandler,
  getRepaymentReportHandler,
} from "../controllers/finance-reports.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/dashboard", authMiddleware, getFinanceDashboardHandler);
router.get("/liability-summary", authMiddleware, getLiabilitySummaryHandler);
router.get("/outstanding", authMiddleware, getOutstandingReportHandler);
router.get("/interest-paid", authMiddleware, getInterestPaidReportHandler);
router.get("/emi-schedule", authMiddleware, getEMIScheduleHandler);
router.get("/credit-card", authMiddleware, getCreditCardReportHandler);
router.get("/cc-utilization", authMiddleware, getCCUtilizationReportHandler);
router.get("/loan-ledger", authMiddleware, getLoanLedgerHandler);
router.get("/funding-source", authMiddleware, getFundingSourceReportHandler);
router.get("/repayments", authMiddleware, getRepaymentReportHandler);

export default router;
