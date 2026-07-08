import { Router } from "express";
import {
  createPurchaseOrder,
  createPurchaseRequisition,
  getPurchaseOrders,
  getPurchaseRequisitions,
} from "../controllers/purchase.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/requisitions", authMiddleware, getPurchaseRequisitions);
router.post("/requisitions", authMiddleware, createPurchaseRequisition);
router.get("/orders", authMiddleware, getPurchaseOrders);
router.post("/orders", authMiddleware, createPurchaseOrder);

export default router;
