import { Router } from "express";
import {
  getSiteWiseDeductionsHandler,
  getClientWiseDeductionsHandler,
  getSDPendingReportHandler,
  getRecoveryLedgerHandler,
} from "../controllers/deduction-ledger.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/site-wise", authMiddleware, getSiteWiseDeductionsHandler);
router.get("/client-wise", authMiddleware, getClientWiseDeductionsHandler);
router.get("/sd-pending", authMiddleware, getSDPendingReportHandler);
router.get("/recovery-ledger", authMiddleware, getRecoveryLedgerHandler);

export default router;
