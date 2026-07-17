import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "../services/expense-category.service.js";

const notFoundMessage = "Expense category not found";

export const getExpenseCategories = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const includeInactive = req.query.includeInactive !== "false";
    const allocationType = req.query.allocationType as string | undefined;
    const categories = await listExpenseCategories(companyId, includeInactive, allocationType);
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load expense categories" });
  }
};

export const createExpenseCategoryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const category = await createExpenseCategory(companyId, req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create expense category" });
  }
};

export const updateExpenseCategoryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const category = await updateExpenseCategory(id, companyId, req.body);
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update expense category" });
  }
};

export const deleteExpenseCategoryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteExpenseCategory(id, companyId);
    if (result.deleted) {
      res.status(200).json({ success: true, message: "Expense category deleted" });
    } else {
      res.status(200).json({ success: true, message: "Category is in use — deactivated instead of deleted", data: result.data });
    }
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete expense category" });
  }
};
