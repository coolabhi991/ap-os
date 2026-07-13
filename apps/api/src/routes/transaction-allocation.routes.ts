import { Router } from "express";
import { getAllocationsHandler, createAllocationsHandler, deleteAllocationHandler } from "../controllers/transaction-allocation.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getAllocationsHandler);
router.post("/", authMiddleware, createAllocationsHandler);
router.delete("/:id", authMiddleware, deleteAllocationHandler);

export default router;
