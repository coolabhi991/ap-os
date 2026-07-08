import { Router } from "express";
import {
  getVendors,
  getVendor,
  createVendorHandler,
  updateVendorHandler,
  deleteVendorHandler,
} from "../controllers/vendor.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getVendors);
router.get("/:id", authMiddleware, getVendor);
router.post("/", authMiddleware, createVendorHandler);
router.put("/:id", authMiddleware, updateVendorHandler);
router.delete("/:id", authMiddleware, deleteVendorHandler);

export default router;
