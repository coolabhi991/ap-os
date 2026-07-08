import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  getLabourDashboard,
  getWageRegister,
  getPendingWages,
  getProjectLabourCostReport,
} from "../services/labour-report.service.js";

export const getLabourDashboardHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const summary = await getLabourDashboard(companyId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load labour dashboard" });
  }
};

export const getWageRegisterHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { labourId, projectId, contractorId, fromDate, toDate } = req.query;
    const data = await getWageRegister(companyId, {
      labourId: labourId as string,
      projectId: projectId as string,
      contractorId: contractorId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load wage register" });
  }
};

export const getPendingWagesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { labourId, projectId, contractorId } = req.query;
    const data = await getPendingWages(companyId, {
      labourId: labourId as string,
      projectId: projectId as string,
      contractorId: contractorId as string,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load pending wages" });
  }
};

export const getProjectLabourCostReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { fromDate, toDate } = req.query;
    const data = await getProjectLabourCostReport(companyId, { fromDate: fromDate as string, toDate: toDate as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load project labour cost report" });
  }
};
