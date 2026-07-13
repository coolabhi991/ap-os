import { Router } from "express";
import {
  getClients,
  getClient,
  getClientLedgerHandler,
  createClientHandler,
  updateClientHandler,
  deleteClientHandler,
} from "../controllers/client.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getClients);
router.get("/:id/ledger", authMiddleware, getClientLedgerHandler);
router.get("/:id", authMiddleware, getClient);
router.post("/", authMiddleware, createClientHandler);
router.put("/:id", authMiddleware, updateClientHandler);
router.delete("/:id", authMiddleware, deleteClientHandler);

export default router;
