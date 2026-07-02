import { Router } from "express";
import {
  getCompanyProfile,
  updateCompanyProfile,
} from "../controllers/company.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getCompanyProfile);

router.put("/", authMiddleware, updateCompanyProfile);

export default router;