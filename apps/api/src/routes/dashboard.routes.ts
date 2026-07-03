import { Router } from "express";
import { dashboard } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, dashboard);

export default router;