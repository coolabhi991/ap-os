import { Router } from "express";
import { getAllocationsHandler, createAllocationsHandler } from "../controllers/transaction-allocation.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getAllocationsHandler);
router.post("/", authMiddleware, createAllocationsHandler);

export default router;
