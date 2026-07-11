import { Router } from "express";
import {
  getDPRsHandler,
  getAutoPullPreviewHandler,
  getDPRHandler,
  createDPRHandler,
  updateDPRHandler,
  deleteDPRHandler,
  addVisitorHandler,
  removeVisitorHandler,
  addSiteProblemHandler,
  removeSiteProblemHandler,
  exportDPRPdfHandler,
  exportDPRExcelHandler,
  sendDPREmailHandler,
  getDPREmailLogsHandler,
} from "../controllers/dpr.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/auto-pull", authMiddleware, getAutoPullPreviewHandler);

router.get("/", authMiddleware, getDPRsHandler);
router.post("/", authMiddleware, createDPRHandler);
router.get("/:id", authMiddleware, getDPRHandler);
router.put("/:id", authMiddleware, updateDPRHandler);
router.delete("/:id", authMiddleware, deleteDPRHandler);

router.post("/:id/visitors", authMiddleware, addVisitorHandler);
router.delete("/:id/visitors/:visitorId", authMiddleware, removeVisitorHandler);

router.post("/:id/site-problems", authMiddleware, addSiteProblemHandler);
router.delete("/:id/site-problems/:problemId", authMiddleware, removeSiteProblemHandler);

router.get("/:id/export/pdf", authMiddleware, exportDPRPdfHandler);
router.get("/:id/export/excel", authMiddleware, exportDPRExcelHandler);

router.post("/:id/email", authMiddleware, sendDPREmailHandler);
router.get("/:id/email-logs", authMiddleware, getDPREmailLogsHandler);

export default router;
