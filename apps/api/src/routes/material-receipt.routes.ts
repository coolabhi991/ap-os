import { Router } from "express";
import {
  getMRs,
  getMR,
  createMRHandler,
  updateMRHandler,
  deleteMRHandler,
  getReceivablePOsHandler,
} from "../controllers/material-receipt.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/receivable-pos", authMiddleware, getReceivablePOsHandler);
router.get("/", authMiddleware, getMRs);
router.get("/:id", authMiddleware, getMR);
router.post("/", authMiddleware, createMRHandler);
router.put("/:id", authMiddleware, updateMRHandler);
router.delete("/:id", authMiddleware, deleteMRHandler);

export default router;
