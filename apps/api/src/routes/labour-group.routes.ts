import { Router } from "express";
import {
  getLabourGroups,
  createLabourGroupHandler,
  updateLabourGroupHandler,
  deleteLabourGroupHandler,
} from "../controllers/labour-group.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getLabourGroups);
router.post("/", authMiddleware, createLabourGroupHandler);
router.put("/:id", authMiddleware, updateLabourGroupHandler);
router.delete("/:id", authMiddleware, deleteLabourGroupHandler);

export default router;
