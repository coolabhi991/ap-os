import { Router } from "express";
import { getProjectContractInfoHandler, upsertProjectContractInfoHandler } from "../controllers/project-contract-info.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/:projectId/contract-info", authMiddleware, getProjectContractInfoHandler);
router.put("/:projectId/contract-info", authMiddleware, upsertProjectContractInfoHandler);

export default router;
