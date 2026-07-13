import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { getBankDirectory } from "../services/bank-directory.service.js";

export const getBankDirectoryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getBankDirectory(companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load bank directory" });
  }
};
