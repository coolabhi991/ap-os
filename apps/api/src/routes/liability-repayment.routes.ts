import { Router } from "express";
import { getLiabilityRepayments } from "../controllers/liability-repayment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Read-only — see liability-repayment.controller.ts for why there is no POST route here.
router.get("/", authMiddleware, getLiabilityRepayments);

export default router;
