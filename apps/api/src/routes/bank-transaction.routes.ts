import { Router } from "express";
import {
  getBankAccountsWithBalancesHandler,
  getBankTransactionsHandler,
  getBankTransactionHandler,
  createBankTransactionHandler,
  updateBankTransactionHandler,
  deleteBankTransactionHandler,
  matchBankTransactionHandler,
  unmatchBankTransactionHandler,
  autoReconcileHandler,
  getUnmatchedRunningBillPaymentsHandler,
  getUnmatchedVendorPaymentsHandler,
  importBankTransactionsHandler,
  exportBankTransactionsHandler,
} from "../controllers/bank-transaction.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/accounts", authMiddleware, getBankAccountsWithBalancesHandler);
router.get("/unmatched/running-bill-payments", authMiddleware, getUnmatchedRunningBillPaymentsHandler);
router.get("/unmatched/vendor-payments", authMiddleware, getUnmatchedVendorPaymentsHandler);
router.post("/reconcile/auto", authMiddleware, autoReconcileHandler);
router.post("/import", authMiddleware, importBankTransactionsHandler);
router.get("/export", authMiddleware, exportBankTransactionsHandler);

router.get("/", authMiddleware, getBankTransactionsHandler);
router.post("/", authMiddleware, createBankTransactionHandler);
router.get("/:id", authMiddleware, getBankTransactionHandler);
router.put("/:id", authMiddleware, updateBankTransactionHandler);
router.delete("/:id", authMiddleware, deleteBankTransactionHandler);

router.post("/:id/match", authMiddleware, matchBankTransactionHandler);
router.post("/:id/unmatch", authMiddleware, unmatchBankTransactionHandler);

export default router;
