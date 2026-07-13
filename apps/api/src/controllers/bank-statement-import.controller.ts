import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listImportedStatements, getStatementSummary, deleteStatement, restoreStatement } from "../services/bank-statement-import.service.js";

const notFoundMessage = "Bank Statement Import not found";

export const getImportedStatementsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { companyBankAccountId, status, page, limit } = req.query;
    const result = await listImportedStatements(companyId, {
      companyBankAccountId: companyBankAccountId as string,
      status: status as "active" | "deleted" | "all" | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load imported statements" });
  }
};

export const getStatementSummaryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getStatementSummary(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load statement summary" });
  }
};

export const deleteStatementHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const performedById = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteStatement(id, companyId, performedById);
    res.status(200).json({ success: true, message: "Bank Statement deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete bank statement" });
  }
};

export const restoreStatementHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const performedById = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await restoreStatement(id, companyId, performedById);
    res.status(200).json({ success: true, message: "Bank Statement restored" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to restore bank statement" });
  }
};
