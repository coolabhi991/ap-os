import { Router } from "express";
import { getLiabilities, getLiability, createLiabilityHandler, updateLiabilityHandler, deleteLiabilityHandler } from "../controllers/liability.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getLiabilities);
router.get("/:id", authMiddleware, getLiability);
router.post("/", authMiddleware, createLiabilityHandler);
router.put("/:id", authMiddleware, updateLiabilityHandler);
router.delete("/:id", authMiddleware, deleteLiabilityHandler);

export default router;
