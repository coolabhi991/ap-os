import { Router } from "express";
import {
  getSubWorksHandler,
  getSubWorkHandler,
  createSubWorkHandler,
  updateSubWorkHandler,
  deleteSubWorkHandler,
  reorderSubWorksHandler,
} from "../controllers/sub-work.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.put("/reorder", authMiddleware, reorderSubWorksHandler);

router.get("/", authMiddleware, getSubWorksHandler);
router.get("/:id", authMiddleware, getSubWorkHandler);
router.post("/", authMiddleware, createSubWorkHandler);
router.put("/:id", authMiddleware, updateSubWorkHandler);
router.delete("/:id", authMiddleware, deleteSubWorkHandler);

export default router;
