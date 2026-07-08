import { Router } from "express";
import {
  getVendorBills,
  getVendorBill,
  createVendorBillHandler,
  updateVendorBillHandler,
  recordPaymentHandler,
  getPaymentHistoryHandler,
  cancelVendorBillHandler,
  deleteVendorBillHandler,
  getVendorBillDashboardHandler,
  exportVendorBillsHandler,
} from "../controllers/vendor-bill.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/export", authMiddleware, exportVendorBillsHandler);
router.get("/dashboard", authMiddleware, getVendorBillDashboardHandler);

router.get("/", authMiddleware, getVendorBills);
router.get("/:id", authMiddleware, getVendorBill);
router.post("/", authMiddleware, createVendorBillHandler);
router.put("/:id", authMiddleware, updateVendorBillHandler);
router.post("/:id/payments", authMiddleware, recordPaymentHandler);
router.get("/:id/payments", authMiddleware, getPaymentHistoryHandler);
router.post("/:id/cancel", authMiddleware, cancelVendorBillHandler);
router.delete("/:id", authMiddleware, deleteVendorBillHandler);

export default router;
