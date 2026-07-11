import { Router } from "express";
import {
  getBankAccountsWithBalancesHandler,
  getBankTransactionsHandler,
  getBankTransactionHandler,
  createBankTransactionHandler,
  updateBankTransactionHandler,
  deleteBankTransactionHandler,
  importBankTransactionsHandler,
  exportBankTransactionsHandler,
} from "../controllers/bank-transaction.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/accounts", authMiddleware, getBankAccountsWithBalancesHandler);
router.post("/import", authMiddleware, importBankTransactionsHandler);
router.get("/export", authMiddleware, exportBankTransactionsHandler);

router.get("/", authMiddleware, getBankTransactionsHandler);
router.post("/", authMiddleware, createBankTransactionHandler);
router.get("/:id", authMiddleware, getBankTransactionHandler);
router.put("/:id", authMiddleware, updateBankTransactionHandler);
router.delete("/:id", authMiddleware, deleteBankTransactionHandler);

export default router;
