import { Router } from "express";
import {
  getPRs,
  getPR,
  createPRHandler,
  updatePRHandler,
  deletePRHandler,
} from "../controllers/purchase-requisition.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getPRs);
router.get("/:id", authMiddleware, getPR);
router.post("/", authMiddleware, createPRHandler);
router.put("/:id", authMiddleware, updatePRHandler);
router.delete("/:id", authMiddleware, deletePRHandler);

export default router;
