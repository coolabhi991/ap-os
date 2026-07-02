import { Request, Response } from "express";
import {
  getCompany,
  updateCompany,
} from "../services/company.service.js";

export const getCompanyProfile = async (
  _req: Request,
  res: Response
) => {
  try {
    const company = await getCompany();

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
  req: Request,
  res: Response
) => {
  try {
    const company = await updateCompany(req.body);

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