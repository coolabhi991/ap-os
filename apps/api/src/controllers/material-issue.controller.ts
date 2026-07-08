import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listMaterialIssues,
  getMaterialIssueById,
  createMaterialIssue,
  updateMaterialIssue,
  deleteMaterialIssue,
  getMaterialIssueDashboard,
  getProjectConsumptionReport,
  getMaterialConsumptionReport,
  getMonthlyConsumptionReport,
  getStockMovementReport,
  exportMaterialIssuesToCSV,
} from "../services/material-issue.service.js";

const notFoundMessage = "Material issue not found";

function parseListQuery(req: AuthRequest) {
  const { search, projectId, inventoryId, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    projectId: projectId as string,
    inventoryId: inventoryId as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string,
    sortOrder: (sortOrder as "asc" | "desc") || undefined,
  };
}

export const getMaterialIssues = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const result = await listMaterialIssues(companyId, parseListQuery(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load material issues" });
  }
};

export const getMaterialIssue = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const issue = await getMaterialIssueById(id, companyId);
    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load material issue" });
  }
};

export const createMaterialIssueHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const issue = await createMaterialIssue(companyId, createdById, req.body);
    res.status(201).json({ success: true, data: issue });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create material issue" });
  }
};

export const updateMaterialIssueHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const issue = await updateMaterialIssue(id, companyId, req.body);
    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update material issue" });
  }
};

export const deleteMaterialIssueHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteMaterialIssue(id, companyId);
    res.status(200).json({ success: true, message: "Material issue deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete material issue" });
  }
};

export const getMaterialIssueDashboardHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const summary = await getMaterialIssueDashboard(companyId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load material issue dashboard" });
  }
};

function parseDateQuery(req: AuthRequest) {
  return { fromDate: req.query.fromDate as string, toDate: req.query.toDate as string };
}

export const getProjectConsumptionReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getProjectConsumptionReport(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load project consumption report" });
  }
};

export const getMaterialConsumptionReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getMaterialConsumptionReport(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load material consumption report" });
  }
};

export const getMonthlyConsumptionReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getMonthlyConsumptionReport(companyId, parseDateQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load monthly consumption report" });
  }
};

export const getStockMovementReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { inventoryId, movementType, fromDate, toDate, page, limit } = req.query;
    const data = await getStockMovementReport(companyId, {
      inventoryId: inventoryId as string,
      movementType: movementType as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load stock movement report" });
  }
};

export const exportMaterialIssuesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportMaterialIssuesToCSV(companyId, parseListQuery(req));

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="material-issues-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export material issues" });
  }
};
