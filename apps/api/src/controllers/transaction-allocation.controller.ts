import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listAllocationsForTransaction, createAllocations } from "../services/transaction-allocation.service.js";

export const getAllocationsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const bankTransactionId = req.query.bankTransactionId as string;
    if (!bankTransactionId) {
      res.status(400).json({ success: false, message: "bankTransactionId query param is required" });
      return;
    }
    const data = await listAllocationsForTransaction(bankTransactionId, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Bank Transaction not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load allocations" });
  }
};

export const createAllocationsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const { bankTransactionId, rows } = req.body as { bankTransactionId: string; rows: unknown[] };
    const result = await createAllocations(companyId, createdById, bankTransactionId, rows as Parameters<typeof createAllocations>[3]);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Bank Transaction not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to save allocations" });
  }
};
