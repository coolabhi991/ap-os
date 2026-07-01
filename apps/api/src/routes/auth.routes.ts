import { Router } from "express";
import {
  health,
  register,
  login,
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/health", health);
router.post("/register", register);
router.post("/login", login);

export default router;