import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listMBs,
  getMBById,
  createMB,
  updateMB,
  deleteMB,
  getMBRegisterReport,
  getAbstractRegisterReport,
  getItemWiseQuantityReport,
  getSubWorkQuantityReport,
  getPendingMBReport,
  exportAbstractRegisterToCSV,
} from "../services/measurement-book.service.js";
import { generateMBPdf, generateMBExcel } from "../services/mb-export.service.js";
import { sendMBEmail, listMBEmailLogs } from "../services/mb-email.service.js";
import { getCompany } from "../services/company.service.js";

const notFoundMessage = "Measurement Book not found";

function parseListQuery(req: AuthRequest) {
  const { search, projectId, siteId, subWorkId, status, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    projectId: projectId as string,
    siteId: siteId as string,
    subWorkId: subWorkId as string,
    status: status as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string,
    sortOrder: (sortOrder as "asc" | "desc") || undefined,
  };
}

function parseReportQuery(req: AuthRequest) {
  return {
    projectId: req.query.projectId as string,
    subWorkId: req.query.subWorkId as string,
    fromDate: req.query.fromDate as string,
    toDate: req.query.toDate as string,
  };
}

export const getMBsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const result = await listMBs(companyId, parseListQuery(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Measurement Books" });
  }
};

export const getMBHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getMBById(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Measurement Book" });
  }
};

export const createMBHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const data = await createMB(companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create Measurement Book" });
  }
};

export const updateMBHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await updateMB(id, companyId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update Measurement Book" });
  }
};

export const deleteMBHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteMB(id, companyId);
    res.status(200).json({ success: true, message: "Measurement Book deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete Measurement Book" });
  }
};

export const getMBRegisterReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getMBRegisterReport(companyId, parseReportQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load MB Register" });
  }
};

export const getAbstractRegisterReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getAbstractRegisterReport(companyId, parseReportQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Abstract Register" });
  }
};

export const getItemWiseQuantityReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getItemWiseQuantityReport(companyId, parseReportQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Item-wise Quantity report" });
  }
};

export const getSubWorkQuantityReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getSubWorkQuantityReport(companyId, parseReportQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Sub Work Quantity report" });
  }
};

export const getPendingMBReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getPendingMBReport(companyId, parseReportQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Pending MB report" });
  }
};

export const exportAbstractRegisterHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportAbstractRegisterToCSV(companyId, parseReportQuery(req));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="abstract-register-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Abstract Register" });
  }
};

export const exportMBPdfHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const mb = await getMBById(id, companyId);
    const company = await getCompany(companyId);
    const pdf = await generateMBPdf(mb, company.name);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${mb.mbNumber}.pdf"`);
    res.status(200).send(pdf);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Measurement Book PDF" });
  }
};

export const exportMBExcelHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const mb = await getMBById(id, companyId);
    const excel = await generateMBExcel(mb);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${mb.mbNumber}.xlsx"`);
    res.status(200).send(excel);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Measurement Book Excel" });
  }
};

export const sendMBEmailHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const sentById = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const mb = await getMBById(id, companyId);
    const company = await getCompany(companyId);
    const data = await sendMBEmail(id, companyId, sentById, req.body, mb, company.name);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to send Measurement Book email" });
  }
};

export const getMBEmailLogsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await listMBEmailLogs(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load email logs" });
  }
};
