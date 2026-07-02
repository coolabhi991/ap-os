import { Router } from "express";
import {
  health,
  register,
  login,
  profile,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/health", health);
router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, profile);

export default router;