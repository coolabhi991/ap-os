import { Router } from "express";
import {
  getPOs,
  getPO,
  createPOHandler,
  updatePOHandler,
  deletePOHandler,
  getApprovedPRsHandler,
} from "../controllers/purchase-order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Utility route — must come before /:id
router.get("/approved-prs", authMiddleware, getApprovedPRsHandler);

router.get("/", authMiddleware, getPOs);
router.get("/:id", authMiddleware, getPO);
router.post("/", authMiddleware, createPOHandler);
router.put("/:id", authMiddleware, updatePOHandler);
router.delete("/:id", authMiddleware, deletePOHandler);

export default router;
