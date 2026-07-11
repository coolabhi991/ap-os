import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listDPRs,
  getDPRById,
  getAutoPullPreview,
  createDPR,
  updateDPR,
  deleteDPR,
  addVisitor,
  removeVisitor,
  addSiteProblem,
  removeSiteProblem,
} from "../services/dpr.service.js";
import { generateDPRPdf, generateDPRExcel } from "../services/dpr-export.service.js";
import { sendDPREmail, listDPREmailLogs } from "../services/dpr-email.service.js";
import { getCompany } from "../services/company.service.js";

const notFoundMessage = "DPR not found";

function parseListQuery(req: AuthRequest) {
  const { search, projectId, siteId, subWorkId, shift, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    projectId: projectId as string,
    siteId: siteId as string,
    subWorkId: subWorkId as string,
    shift: shift as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string,
    sortOrder: (sortOrder as "asc" | "desc") || undefined,
  };
}

export const getDPRsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const result = await listDPRs(companyId, parseListQuery(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load DPRs" });
  }
};

export const getAutoPullPreviewHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = req.query.projectId as string;
    const subWorkId = req.query.subWorkId as string | undefined;
    const reportDate = req.query.reportDate as string;
    if (!projectId) {
      res.status(400).json({ success: false, message: "projectId query param is required" });
      return;
    }
    const data = await getAutoPullPreview(companyId, projectId, reportDate, subWorkId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to load auto-pull preview" });
  }
};

export const getDPRHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getDPRById(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load DPR" });
  }
};

export const createDPRHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const data = await createDPR(companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create DPR" });
  }
};

export const updateDPRHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await updateDPR(id, companyId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update DPR" });
  }
};

export const deleteDPRHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteDPR(id, companyId);
    res.status(200).json({ success: true, message: "DPR deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete DPR" });
  }
};

export const addVisitorHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const dprId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await addVisitor(dprId, companyId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to add visitor" });
  }
};

export const removeVisitorHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const dprId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const visitorId = Array.isArray(req.params.visitorId) ? req.params.visitorId[0] : req.params.visitorId;
    await removeVisitor(dprId, visitorId, companyId);
    res.status(200).json({ success: true, message: "Visitor removed" });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to remove visitor" });
  }
};

export const addSiteProblemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const dprId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await addSiteProblem(dprId, companyId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to add site problem" });
  }
};

export const removeSiteProblemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const dprId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const problemId = Array.isArray(req.params.problemId) ? req.params.problemId[0] : req.params.problemId;
    await removeSiteProblem(dprId, problemId, companyId);
    res.status(200).json({ success: true, message: "Site problem removed" });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to remove site problem" });
  }
};

export const exportDPRPdfHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dpr = await getDPRById(id, companyId);
    const company = await getCompany(companyId);
    const pdf = await generateDPRPdf(dpr, company.name);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${dpr.dprNumber}.pdf"`);
    res.status(200).send(pdf);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export DPR PDF" });
  }
};

export const exportDPRExcelHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dpr = await getDPRById(id, companyId);
    const excel = await generateDPRExcel(dpr);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${dpr.dprNumber}.xlsx"`);
    res.status(200).send(excel);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export DPR Excel" });
  }
};

export const sendDPREmailHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const sentById = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dpr = await getDPRById(id, companyId);
    const company = await getCompany(companyId);
    const data = await sendDPREmail(id, companyId, sentById, req.body, dpr, company.name);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to send DPR email" });
  }
};

export const getDPREmailLogsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await listDPREmailLogs(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load email logs" });
  }
};
