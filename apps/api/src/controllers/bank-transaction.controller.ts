import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listBankAccountsWithBalances,
  listBankTransactions,
  getBankTransactionById,
  createBankTransaction,
  updateBankTransaction,
  deleteBankTransaction,
  importBankTransactions,
  exportBankTransactionsToCSV,
  checkStatementImportDuplicate,
  findDuplicateBankTransactions,
  deleteDuplicateBankTransaction,
} from "../services/bank-transaction.service.js";

const notFoundMessage = "Bank Transaction not found";
const readOnlyMessages = ["Imported bank transactions are read-only — allocate it instead of editing it", "Imported bank transactions are read-only and cannot be deleted"];

function parseListQuery(req: AuthRequest) {
  const { search, companyBankAccountId, projectId, allocationStatus, source, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    companyBankAccountId: companyBankAccountId as string,
    projectId: projectId as string,
    allocationStatus: allocationStatus as string,
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
    const isReadOnly = error instanceof Error && readOnlyMessages.includes(error.message);
    res.status(is404 ? 404 : isReadOnly ? 403 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update bank transaction" });
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
    const isReadOnly = error instanceof Error && readOnlyMessages.includes(error.message);
    res.status(is404 ? 404 : isReadOnly ? 403 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete bank transaction" });
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

export const checkStatementImportDuplicateHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { companyBankAccountId, fileHash } = req.body;
    const result = await checkStatementImportDuplicate(companyId, companyBankAccountId, fileHash);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to check for a duplicate statement import" });
  }
};

export const getDuplicateBankTransactionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { companyBankAccountId } = req.query;
    const data = await findDuplicateBankTransactions(companyId, companyBankAccountId as string);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load duplicate bank transactions" });
  }
};

export const deleteDuplicateBankTransactionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const confirmAllocated = req.body?.confirmAllocated === true;
    await deleteDuplicateBankTransaction(id, companyId, confirmAllocated);
    res.status(200).json({ success: true, message: "Duplicate transaction deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete duplicate transaction" });
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
