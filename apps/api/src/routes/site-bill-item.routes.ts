import { Router } from "express";
import {
  getSiteBillItemsHandler,
  getSiteBillItemHandler,
  createSiteBillItemHandler,
  updateSiteBillItemHandler,
  deleteSiteBillItemHandler,
} from "../controllers/site-bill-item.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getSiteBillItemsHandler);
router.post("/", authMiddleware, createSiteBillItemHandler);
router.get("/:id", authMiddleware, getSiteBillItemHandler);
router.put("/:id", authMiddleware, updateSiteBillItemHandler);
router.delete("/:id", authMiddleware, deleteSiteBillItemHandler);

export default router;
