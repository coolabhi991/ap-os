import { Router } from "express";
import {
  getBankBookReportHandler,
  getCashBookReportHandler,
  getBankReconciliationReportHandler,
  getCashFlowReportHandler,
  getReceivablesReportHandler,
  getPayablesReportHandler,
  getOutstandingSummaryReportHandler,
  getBankChargesReportHandler,
  getTdsPaymentsReportHandler,
  getInternalTransferReportHandler,
  exportReceivablesHandler,
  exportPayablesHandler,
  exportBankBookCsvHandler,
  exportCashBookCsvHandler,
  exportBankBookPdfHandler,
  exportBankBookExcelHandler,
  exportCashBookPdfHandler,
  exportCashBookExcelHandler,
  sendBankBookEmailHandler,
  sendCashBookEmailHandler,
} from "../controllers/banking-reports.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/bank-book", authMiddleware, getBankBookReportHandler);
router.get("/bank-book/export/csv", authMiddleware, exportBankBookCsvHandler);
router.get("/bank-book/export/pdf", authMiddleware, exportBankBookPdfHandler);
router.get("/bank-book/export/excel", authMiddleware, exportBankBookExcelHandler);
router.post("/bank-book/email", authMiddleware, sendBankBookEmailHandler);

router.get("/cash-book", authMiddleware, getCashBookReportHandler);
router.get("/cash-book/export/csv", authMiddleware, exportCashBookCsvHandler);
router.get("/cash-book/export/pdf", authMiddleware, exportCashBookPdfHandler);
router.get("/cash-book/export/excel", authMiddleware, exportCashBookExcelHandler);
router.post("/cash-book/email", authMiddleware, sendCashBookEmailHandler);

router.get("/reconciliation", authMiddleware, getBankReconciliationReportHandler);
router.get("/cash-flow", authMiddleware, getCashFlowReportHandler);
router.get("/receivables", authMiddleware, getReceivablesReportHandler);
router.get("/receivables/export", authMiddleware, exportReceivablesHandler);
router.get("/payables", authMiddleware, getPayablesReportHandler);
router.get("/payables/export", authMiddleware, exportPayablesHandler);
router.get("/outstanding-summary", authMiddleware, getOutstandingSummaryReportHandler);
router.get("/bank-charges", authMiddleware, getBankChargesReportHandler);
router.get("/tds-payments", authMiddleware, getTdsPaymentsReportHandler);
router.get("/internal-transfers", authMiddleware, getInternalTransferReportHandler);

export default router;
