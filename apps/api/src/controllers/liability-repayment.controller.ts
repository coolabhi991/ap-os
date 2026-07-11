import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listLiabilityRepayments } from "../services/liability-repayment.service.js";

// Read-only by design — repayments are only ever created via Bank Statement → Transaction
// Allocation (transaction-allocation.controller.ts), never through this route.
export const getLiabilityRepayments = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { liabilityId, liabilityType, fromDate, toDate, page, limit } = req.query;
    const result = await listLiabilityRepayments(companyId, {
      liabilityId: liabilityId as string,
      liabilityType: liabilityType as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load repayment history" });
  }
};
