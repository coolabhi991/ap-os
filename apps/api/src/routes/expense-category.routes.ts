import { Router } from "express";
import {
  getExpenseCategories,
  createExpenseCategoryHandler,
  updateExpenseCategoryHandler,
  deleteExpenseCategoryHandler,
} from "../controllers/expense-category.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getExpenseCategories);
router.post("/", authMiddleware, createExpenseCategoryHandler);
router.put("/:id", authMiddleware, updateExpenseCategoryHandler);
router.delete("/:id", authMiddleware, deleteExpenseCategoryHandler);

export default router;
