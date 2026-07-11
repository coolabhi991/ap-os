import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseDashboard,
  getProjectExpenseSummary,
  getCategoryExpenseSummary,
  getMonthlyExpenseSummary,
  getVendorCreditSummary,
  getMachineryCostByProjectReport,
  getMachineryCostBySiteReport,
  getVendorWiseMachineryCostReport,
  getMonthlyMachineryCostReport,
  getMachineHoursByTypeReport,
  exportExpensesToCSV,
} from "../services/expense.service.js";

const notFoundMessage = "Expense not found";

function parseListQuery(req: AuthRequest) {
  const { search, projectId, siteId, vendorId, categoryId, paymentMode, fromDate, toDate, minAmount, maxAmount, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    projectId: projectId as string,
    siteId: siteId as string,
    vendorId: vendorId as string,
    categoryId: categoryId as string,
    paymentMode: paymentMode as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string,
    sortOrder: (sortOrder as "asc" | "desc") || undefined,
  };
}

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const result = await listExpenses(companyId, parseListQuery(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load expenses" });
  }
};

export const getExpense = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const expense = await getExpenseById(id, companyId);
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load expense" });
  }
};

export const createExpenseHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const expense = await createExpense(companyId, createdById, req.body);
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create expense" });
  }
};

export const updateExpenseHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const expense = await updateExpense(id, companyId, req.body);
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update expense" });
  }
};

export const deleteExpenseHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteExpense(id, companyId);
    res.status(200).json({ success: true, message: "Expense deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete expense" });
  }
};

export const getExpenseDashboardHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const summary = await getExpenseDashboard(companyId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load expense dashboard" });
  }
};

function parseDateQuery(req: AuthRequest) {
  return { fromDate: req.query.fromDate as string, toDate: req.query.toDate as string };
}

export const getProjectExpenseSummaryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getProjectExpenseSummary(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load project expense summary" });
  }
};

export const getCategoryExpenseSummaryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getCategoryExpenseSummary(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load category expense summary" });
  }
};

export const getMonthlyExpenseSummaryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getMonthlyExpenseSummary(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load monthly expense summary" });
  }
};

export const getVendorCreditSummaryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getVendorCreditSummary(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor credit summary" });
  }
};

export const getMachineryCostByProjectReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getMachineryCostByProjectReport(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load machinery cost by project report" });
  }
};

export const getMachineryCostBySiteReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getMachineryCostBySiteReport(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load machinery cost by site report" });
  }
};

export const getVendorWiseMachineryCostReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getVendorWiseMachineryCostReport(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor-wise machinery cost report" });
  }
};

export const getMonthlyMachineryCostReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getMonthlyMachineryCostReport(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load monthly machinery cost report" });
  }
};

export const getMachineHoursByTypeReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getMachineHoursByTypeReport(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load machine hours report" });
  }
};

export const exportExpensesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportExpensesToCSV(companyId, parseListQuery(req));

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="expenses-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export expenses" });
  }
};
