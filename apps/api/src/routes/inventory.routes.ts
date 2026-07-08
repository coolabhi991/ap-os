import { Router } from "express";
import {
  getInventoryItems,
  getInventoryItem,
  createInventoryItemHandler,
  updateInventoryItemHandler,
  deleteInventoryItemHandler,
  adjustInventoryStockHandler,
  getStockLedgerHandler,
  getLowStockAlertsHandler,
  getInventoryDashboardHandler,
  exportInventoryHandler,
} from "../controllers/inventory.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/export", authMiddleware, exportInventoryHandler);
router.get("/dashboard", authMiddleware, getInventoryDashboardHandler);
router.get("/low-stock", authMiddleware, getLowStockAlertsHandler);
router.get("/ledger", authMiddleware, getStockLedgerHandler);

router.get("/", authMiddleware, getInventoryItems);
router.get("/:id", authMiddleware, getInventoryItem);
router.post("/", authMiddleware, createInventoryItemHandler);
router.put("/:id", authMiddleware, updateInventoryItemHandler);
router.post("/:id/adjust", authMiddleware, adjustInventoryStockHandler);
router.delete("/:id", authMiddleware, deleteInventoryItemHandler);

export default router;
