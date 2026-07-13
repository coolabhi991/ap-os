import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { getEmployeeReport } from "../services/employee-report.service.js";

export const getEmployeeReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { employeeId, fromDate, toDate } = req.query;
    const result = await getEmployeeReport(companyId, {
      employeeId: employeeId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load employee report" });
  }
};
