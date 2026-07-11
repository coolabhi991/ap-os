import { Router } from "express";
import {
  getPartnerSettlements,
  getPartnerSettlement,
  createPartnerSettlementHandler,
  deletePartnerSettlementHandler,
} from "../controllers/partner-settlement.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getPartnerSettlements);
router.get("/:id", authMiddleware, getPartnerSettlement);
router.post("/", authMiddleware, createPartnerSettlementHandler);
router.delete("/:id", authMiddleware, deletePartnerSettlementHandler);

export default router;
