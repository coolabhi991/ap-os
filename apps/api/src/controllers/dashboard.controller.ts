import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { getControlCenter } from "../services/dashboard.service.js";

export const dashboard = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getControlCenter(companyId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to load the control center",
    });
  }
};
