import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listLabourWageRates, createLabourWageRate } from "../services/labour-wage-rate.service.js";

export const getLabourWageRates = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const labourId = req.query.labourId as string;
    if (!labourId) {
      res.status(400).json({ success: false, message: "labourId is required" });
      return;
    }
    const rates = await listLabourWageRates(companyId, labourId);
    res.status(200).json({ success: true, data: rates });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Labour not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load wage rates" });
  }
};

export const createLabourWageRateHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { labourId, ...input } = req.body;
    if (!labourId) {
      res.status(400).json({ success: false, message: "labourId is required" });
      return;
    }
    const rate = await createLabourWageRate(companyId, labourId, input);
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Labour not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create wage rate" });
  }
};
