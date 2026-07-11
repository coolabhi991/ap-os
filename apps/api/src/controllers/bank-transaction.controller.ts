import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listBankAccountsWithBalances,
  listBankTransactions,
  getBankTransactionById,
  createBankTransaction,
  updateBankTransaction,
  deleteBankTransaction,
  matchBankTransaction,
  unmatchBankTransaction,
  autoReconcile,
  listUnmatchedRunningBillPayments,
  listUnmatchedVendorPayments,
  importBankTransactions,
  exportBankTransactionsToCSV,
} from "../services/bank-transaction.service.js";

const notFoundMessage = "Bank Transaction not found";

function parseListQuery(req: AuthRequest) {
  const { search, companyBankAccountId, projectId, reconciliationStatus, source, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    companyBankAccountId: companyBankAccountId as string,
    projectId: projectId as string,
    reconciliationStatus: reconciliationStatus as string,
    source: source as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string,
    sortOrder: (sortOrder as "asc" | "desc") || undefined,
  };
}

export const getBankAccountsWithBalancesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await listBankAccountsWithBalances(companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load bank accounts" });
  }
};

export const getBankTransactionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const result = await listBankTransactions(companyId, parseListQuery(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load bank transactions" });
  }
};

export const getBankTransactionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getBankTransactionById(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load bank transaction" });
  }
};

export const createBankTransactionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const data = await createBankTransaction(companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create bank transaction" });
  }
};

export const updateBankTransactionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await updateBankTransaction(id, companyId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update bank transaction" });
  }
};

export const deleteBankTransactionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteBankTransaction(id, companyId);
    res.status(200).json({ success: true, message: "Bank Transaction deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete bank transaction" });
  }
};

export const matchBankTransactionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await matchBankTransaction(id, companyId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to match bank transaction" });
  }
};

export const unmatchBankTransactionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await unmatchBankTransaction(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to unmatch bank transaction" });
  }
};

export const autoReconcileHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const companyBankAccountId = req.query.companyBankAccountId as string;
    const data = await autoReconcile(companyId, companyBankAccountId || undefined);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to run auto-reconciliation" });
  }
};

export const getUnmatchedRunningBillPaymentsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const companyBankAccountId = req.query.companyBankAccountId as string;
    const data = await listUnmatchedRunningBillPayments(companyId, companyBankAccountId || undefined);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load unmatched Running Bill payments" });
  }
};

export const getUnmatchedVendorPaymentsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const companyBankAccountId = req.query.companyBankAccountId as string;
    const data = await listUnmatchedVendorPayments(companyId, companyBankAccountId || undefined);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load unmatched Vendor payments" });
  }
};

export const importBankTransactionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const data = await importBankTransactions(companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to import bank transactions" });
  }
};

export const exportBankTransactionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportBankTransactionsToCSV(companyId, parseListQuery(req));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="bank-transactions-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export bank transactions" });
  }
};
