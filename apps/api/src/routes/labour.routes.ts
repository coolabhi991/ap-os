import { Router } from "express";
import {
  getLabours,
  getLabour,
  createLabourHandler,
  updateLabourHandler,
  deleteLabourHandler,
  exportLabourHandler,
} from "../controllers/labour.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/export", authMiddleware, exportLabourHandler);

router.get("/", authMiddleware, getLabours);
router.get("/:id", authMiddleware, getLabour);
router.post("/", authMiddleware, createLabourHandler);
router.put("/:id", authMiddleware, updateLabourHandler);
router.delete("/:id", authMiddleware, deleteLabourHandler);

export default router;
