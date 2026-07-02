import { Router } from "express";
import {
  create,
  list,
  getById,
  update,
  updateStatus,
} from "../controllers/user.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| User Management
|--------------------------------------------------------------------------
*/

// ADMIN only
router.post("/", authMiddleware, adminMiddleware, create);

// Any logged-in user
router.get("/", authMiddleware, list);

// Any logged-in user
router.get("/:id", authMiddleware, getById);

// ADMIN only
router.put("/:id", authMiddleware, adminMiddleware, update);

// ADMIN only
router.patch("/:id/status", authMiddleware, adminMiddleware, updateStatus);

export default router;