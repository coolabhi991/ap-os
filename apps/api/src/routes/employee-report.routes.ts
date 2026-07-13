import { Router } from "express";
import { getEmployeeReportHandler } from "../controllers/employee-report.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getEmployeeReportHandler);

export default router;
