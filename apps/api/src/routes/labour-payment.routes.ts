import { Router } from "express";
import {
  getLabourPayments,
  getLabourPayment,
  createLabourPaymentHandler,
  deleteLabourPaymentHandler,
  exportLabourPaymentsHandler,
} from "../controllers/labour-payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/export", authMiddleware, exportLabourPaymentsHandler);

router.get("/", authMiddleware, getLabourPayments);
router.get("/:id", authMiddleware, getLabourPayment);
router.post("/", authMiddleware, createLabourPaymentHandler);
router.delete("/:id", authMiddleware, deleteLabourPaymentHandler);

export default router;
