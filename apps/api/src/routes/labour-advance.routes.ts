import { Router } from "express";
import {
  getLabourAdvances,
  getLabourAdvance,
  createLabourAdvanceHandler,
  deleteLabourAdvanceHandler,
  exportLabourAdvancesHandler,
} from "../controllers/labour-advance.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/export", authMiddleware, exportLabourAdvancesHandler);

router.get("/", authMiddleware, getLabourAdvances);
router.get("/:id", authMiddleware, getLabourAdvance);
router.post("/", authMiddleware, createLabourAdvanceHandler);
router.delete("/:id", authMiddleware, deleteLabourAdvanceHandler);

export default router;
