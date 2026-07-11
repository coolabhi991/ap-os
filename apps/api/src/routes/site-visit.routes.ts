import { Router } from "express";
import {
  getSiteVisits,
  getSiteVisit,
  createSiteVisitHandler,
  updateSiteVisitHandler,
  deleteSiteVisitHandler,
} from "../controllers/site-visit.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getSiteVisits);
router.get("/:id", authMiddleware, getSiteVisit);
router.post("/", authMiddleware, createSiteVisitHandler);
router.put("/:id", authMiddleware, updateSiteVisitHandler);
router.delete("/:id", authMiddleware, deleteSiteVisitHandler);

export default router;
