import { Router } from "express";
import {
  getRunningBillsHandler,
  getBillableMBsHandler,
  getRunningBillHandler,
  createRunningBillHandler,
  updateRunningBillHandler,
  deleteRunningBillHandler,
  submitRunningBillHandler,
  passRunningBillHandler,
  recordRunningBillPaymentHandler,
  getRunningBillPaymentsHandler,
  getRunningBillRegisterReportHandler,
  getOutstandingBillsReportHandler,
  getPaymentRegisterReportHandler,
  getRecoveryRegisterReportHandler,
  getProjectBillingSummaryReportHandler,
  exportRunningBillRegisterHandler,
  exportRunningBillPdfHandler,
  exportRunningBillExcelHandler,
  sendRunningBillEmailHandler,
  getRunningBillEmailLogsHandler,
} from "../controllers/running-bill.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/billable-mbs", authMiddleware, getBillableMBsHandler);
router.get("/reports/register", authMiddleware, getRunningBillRegisterReportHandler);
router.get("/reports/outstanding", authMiddleware, getOutstandingBillsReportHandler);
router.get("/reports/payment-register", authMiddleware, getPaymentRegisterReportHandler);
router.get("/reports/recovery-register", authMiddleware, getRecoveryRegisterReportHandler);
router.get("/reports/project-billing-summary", authMiddleware, getProjectBillingSummaryReportHandler);
router.get("/reports/export", authMiddleware, exportRunningBillRegisterHandler);

router.get("/", authMiddleware, getRunningBillsHandler);
router.post("/", authMiddleware, createRunningBillHandler);
router.get("/:id", authMiddleware, getRunningBillHandler);
router.put("/:id", authMiddleware, updateRunningBillHandler);
router.delete("/:id", authMiddleware, deleteRunningBillHandler);

router.post("/:id/submit", authMiddleware, submitRunningBillHandler);
router.post("/:id/pass", authMiddleware, passRunningBillHandler);

router.get("/:id/payments", authMiddleware, getRunningBillPaymentsHandler);
router.post("/:id/payments", authMiddleware, recordRunningBillPaymentHandler);

router.get("/:id/export/pdf", authMiddleware, exportRunningBillPdfHandler);
router.get("/:id/export/excel", authMiddleware, exportRunningBillExcelHandler);

router.post("/:id/email", authMiddleware, sendRunningBillEmailHandler);
router.get("/:id/email-logs", authMiddleware, getRunningBillEmailLogsHandler);

export default router;
