import { Router } from "express";
import { getBankDirectoryHandler } from "../controllers/bank-directory.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getBankDirectoryHandler);

export default router;
