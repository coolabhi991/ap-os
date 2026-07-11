import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  getCompany,
  updateCompany,
} from "../services/company.service.js";

export const getCompanyProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const company = await getCompany(req.user!.companyId);

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Company not found",
    });
  }
};

export const updateCompanyProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const company = await updateCompany(req.user!.companyId, req.body);

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Update failed",
    });
  }
};