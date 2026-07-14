import { Router } from "express";
import { getSites, getSite, createSiteHandler, updateSiteHandler, deleteSiteHandler, getTenderPercentChangeLogHandler } from "../controllers/site.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getSites);
router.get("/:id/tender-percent-log", authMiddleware, getTenderPercentChangeLogHandler);
router.get("/:id", authMiddleware, getSite);
router.post("/", authMiddleware, createSiteHandler);
router.put("/:id", authMiddleware, updateSiteHandler);
router.delete("/:id", authMiddleware, deleteSiteHandler);

export default router;
