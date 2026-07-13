import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { getBankStatementMapping, saveBankStatementMapping } from "../services/bank-statement-mapping.service.js";

export const getBankStatementMappingHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const signature = Array.isArray(req.query.signature) ? req.query.signature[0] : req.query.signature;
    if (!signature || typeof signature !== "string") {
      res.status(400).json({ success: false, message: "Signature query param is required" });
      return;
    }
    const mapping = await getBankStatementMapping(companyId, signature);
    res.status(200).json({ success: true, data: mapping });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load bank statement mapping" });
  }
};

export const saveBankStatementMappingHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const mapping = await saveBankStatementMapping(companyId, req.body);
    res.status(201).json({ success: true, data: mapping });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to save bank statement mapping" });
  }
};
