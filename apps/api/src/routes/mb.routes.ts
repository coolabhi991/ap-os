import { Router } from "express";
import {
  getMBsHandler,
  getMBHandler,
  createMBHandler,
  updateMBHandler,
  deleteMBHandler,
  getMBRegisterReportHandler,
  getAbstractRegisterReportHandler,
  getItemWiseQuantityReportHandler,
  getSubWorkQuantityReportHandler,
  getPendingMBReportHandler,
  exportAbstractRegisterHandler,
  exportMBPdfHandler,
  exportMBExcelHandler,
  sendMBEmailHandler,
  getMBEmailLogsHandler,
} from "../controllers/mb.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/reports/register", authMiddleware, getMBRegisterReportHandler);
router.get("/reports/abstract-register", authMiddleware, getAbstractRegisterReportHandler);
router.get("/reports/item-wise-quantity", authMiddleware, getItemWiseQuantityReportHandler);
router.get("/reports/sub-work-quantity", authMiddleware, getSubWorkQuantityReportHandler);
router.get("/reports/pending", authMiddleware, getPendingMBReportHandler);
router.get("/reports/export", authMiddleware, exportAbstractRegisterHandler);

router.get("/", authMiddleware, getMBsHandler);
router.post("/", authMiddleware, createMBHandler);
router.get("/:id", authMiddleware, getMBHandler);
router.put("/:id", authMiddleware, updateMBHandler);
router.delete("/:id", authMiddleware, deleteMBHandler);

router.get("/:id/export/pdf", authMiddleware, exportMBPdfHandler);
router.get("/:id/export/excel", authMiddleware, exportMBExcelHandler);

router.post("/:id/email", authMiddleware, sendMBEmailHandler);
router.get("/:id/email-logs", authMiddleware, getMBEmailLogsHandler);

export default router;
