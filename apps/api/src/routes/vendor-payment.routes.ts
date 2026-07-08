import { Router } from "express";
import {
  getVendorPayments,
  getVendorPayment,
  createVendorPaymentHandler,
  getVendorLedgerHandler,
  getVendorPaymentDashboardHandler,
  exportVendorPaymentsHandler,
} from "../controllers/vendor-payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/export", authMiddleware, exportVendorPaymentsHandler);
router.get("/dashboard", authMiddleware, getVendorPaymentDashboardHandler);
router.get("/ledger", authMiddleware, getVendorLedgerHandler);

router.get("/", authMiddleware, getVendorPayments);
router.get("/:id", authMiddleware, getVendorPayment);
router.post("/", authMiddleware, createVendorPaymentHandler);

export default router;
