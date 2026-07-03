import { Request, Response } from "express";
import { getDashboard } from "../services/dashboard.service.js";

export const dashboard = async (_req: Request, res: Response) => {
  try {
    const data = await getDashboard();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to load dashboard",
    });
  }
};