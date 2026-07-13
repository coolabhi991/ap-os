import { Router } from "express";
import { getBankStatementMappingHandler, saveBankStatementMappingHandler } from "../controllers/bank-statement-mapping.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getBankStatementMappingHandler);
router.post("/", authMiddleware, saveBankStatementMappingHandler);

export default router;
