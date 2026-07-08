import { Router } from "express";
import {
  getExpenses,
  getExpense,
  createExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  getExpenseDashboardHandler,
  getProjectExpenseSummaryHandler,
  getCategoryExpenseSummaryHandler,
  getMonthlyExpenseSummaryHandler,
  getVendorCreditSummaryHandler,
  exportExpensesHandler,
} from "../controllers/expense.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/export", authMiddleware, exportExpensesHandler);
router.get("/dashboard", authMiddleware, getExpenseDashboardHandler);
router.get("/reports/project-summary", authMiddleware, getProjectExpenseSummaryHandler);
router.get("/reports/category-summary", authMiddleware, getCategoryExpenseSummaryHandler);
router.get("/reports/monthly-summary", authMiddleware, getMonthlyExpenseSummaryHandler);
router.get("/reports/vendor-credit-summary", authMiddleware, getVendorCreditSummaryHandler);

router.get("/", authMiddleware, getExpenses);
router.get("/:id", authMiddleware, getExpense);
router.post("/", authMiddleware, createExpenseHandler);
router.put("/:id", authMiddleware, updateExpenseHandler);
router.delete("/:id", authMiddleware, deleteExpenseHandler);

export default router;
