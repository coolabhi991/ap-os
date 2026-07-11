import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  markAttendance,
  bulkMarkAttendance,
  listLabourAttendance,
  getLabourAttendanceById,
  updateLabourAttendance,
  deleteLabourAttendance,
  exportLabourAttendanceToCSV,
} from "../services/labour-attendance.service.js";

const notFoundMessage = "Attendance record not found";

function parseListQuery(req: AuthRequest) {
  const { search, projectId, siteId, labourId, groupId, status, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    projectId: projectId as string,
    siteId: siteId as string,
    labourId: labourId as string,
    groupId: groupId as string,
    status: status as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string,
    sortOrder: (sortOrder as "asc" | "desc") || undefined,
  };
}

export const getLabourAttendanceList = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const result = await listLabourAttendance(companyId, parseListQuery(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load attendance" });
  }
};

export const getLabourAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const entry = await getLabourAttendanceById(id, companyId);
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load attendance record" });
  }
};

export const markAttendanceHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const entry = await markAttendance(companyId, createdById, req.body);
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to mark attendance" });
  }
};

export const bulkMarkAttendanceHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const result = await bulkMarkAttendance(companyId, createdById, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to mark attendance" });
  }
};

export const updateLabourAttendanceHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const entry = await updateLabourAttendance(id, companyId, req.body);
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update attendance" });
  }
};

export const deleteLabourAttendanceHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteLabourAttendance(id, companyId);
    res.status(200).json({ success: true, message: "Attendance record deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete attendance record" });
  }
};

export const exportLabourAttendanceHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportLabourAttendanceToCSV(companyId, parseListQuery(req));

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="labour-attendance-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export attendance" });
  }
};
