import { Router } from "express";
import {
  getPartnerInvestments,
  getPartnerInvestment,
  createPartnerInvestmentHandler,
  deletePartnerInvestmentHandler,
} from "../controllers/partner-investment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getPartnerInvestments);
router.get("/:id", authMiddleware, getPartnerInvestment);
router.post("/", authMiddleware, createPartnerInvestmentHandler);
router.delete("/:id", authMiddleware, deletePartnerInvestmentHandler);

export default router;
