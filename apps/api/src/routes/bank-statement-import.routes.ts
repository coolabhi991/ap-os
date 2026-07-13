import { Router } from "express";
import {
  getImportedStatementsHandler,
  getStatementSummaryHandler,
  deleteStatementHandler,
  restoreStatementHandler,
} from "../controllers/bank-statement-import.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getImportedStatementsHandler);
router.get("/:id/summary", authMiddleware, getStatementSummaryHandler);
router.delete("/:id", authMiddleware, deleteStatementHandler);
router.post("/:id/restore", authMiddleware, restoreStatementHandler);

export default router;
