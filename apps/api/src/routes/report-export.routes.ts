import { Router } from "express";
import { exportReportHandler } from "../controllers/report-export.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/export", authMiddleware, exportReportHandler);

export default router;
