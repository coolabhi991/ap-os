import { Router } from "express";
import {
  getSiteBoqItemsHandler,
  getSiteBoqItemHandler,
  createSiteBoqItemHandler,
  updateSiteBoqItemHandler,
  deleteSiteBoqItemHandler,
} from "../controllers/site-boq-item.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getSiteBoqItemsHandler);
router.post("/", authMiddleware, createSiteBoqItemHandler);
router.get("/:id", authMiddleware, getSiteBoqItemHandler);
router.put("/:id", authMiddleware, updateSiteBoqItemHandler);
router.delete("/:id", authMiddleware, deleteSiteBoqItemHandler);

export default router;
