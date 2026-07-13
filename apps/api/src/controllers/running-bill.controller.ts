import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listRunningBills,
  getRunningBillById,
  listBillableMeasurementBooks,
  getNextRABillDraft,
  createRunningBillFromForm58,
  createRunningBill,
  updateRunningBill,
  deleteRunningBill,
  submitRunningBill,
  passRunningBill,
  recordRunningBillPayment,
  listRunningBillPayments,
  getRunningBillRegisterReport,
  getOutstandingBillsReport,
  getPaymentRegisterReport,
  getRecoveryRegisterReport,
  getProjectBillingSummaryReport,
  exportRunningBillRegisterToCSV,
} from "../services/running-bill.service.js";
import { generateRunningBillPdf, generateRunningBillExcel } from "../services/running-bill-export.service.js";
import { sendRunningBillEmail, listRunningBillEmailLogs } from "../services/running-bill-email.service.js";
import { getCompany } from "../services/company.service.js";

const notFoundMessage = "Running Bill not found";

function parseListQuery(req: AuthRequest) {
  const { search, projectId, siteId, subWorkId, status, billType, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    projectId: projectId as string,
    siteId: siteId as string,
    subWorkId: subWorkId as string,
    status: status as string,
    billType: billType as string,
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
    fromDate: req.query.fromDate as string,
    toDate: req.query.toDate as string,
    status: req.query.status as string,
  };
}

export const getRunningBillsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const result = await listRunningBills(companyId, parseListQuery(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Running Bills" });
  }
};

export const getBillableMBsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = req.query.projectId as string;
    const data = await listBillableMeasurementBooks(companyId, projectId || undefined);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load billable Measurement Books" });
  }
};

export const getRunningBillHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getRunningBillById(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Running Bill" });
  }
};

export const getNextRABillDraftHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const siteId = req.query.siteId as string;
    if (!siteId) {
      res.status(400).json({ success: false, message: "siteId query param is required" });
      return;
    }
    const data = await getNextRABillDraft(siteId, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load next RA Bill draft" });
  }
};

export const createRunningBillFromForm58Handler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const data = await createRunningBillFromForm58(companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create RA Bill" });
  }
};

export const createRunningBillHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const data = await createRunningBill(companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create Running Bill" });
  }
};

export const updateRunningBillHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await updateRunningBill(id, companyId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update Running Bill" });
  }
};

export const deleteRunningBillHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteRunningBill(id, companyId);
    res.status(200).json({ success: true, message: "Running Bill deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete Running Bill" });
  }
};

export const submitRunningBillHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await submitRunningBill(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit Running Bill";
    const is404 = message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message });
  }
};

export const passRunningBillHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await passRunningBill(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to pass Running Bill";
    const is404 = message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message });
  }
};

export const recordRunningBillPaymentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await recordRunningBillPayment(id, companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record payment";
    const is404 = message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message });
  }
};

export const getRunningBillPaymentsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await listRunningBillPayments(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load payments" });
  }
};

export const getRunningBillRegisterReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getRunningBillRegisterReport(companyId, parseReportQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Running Bill Register" });
  }
};

export const getOutstandingBillsReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getOutstandingBillsReport(companyId, { projectId: req.query.projectId as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Outstanding Bills report" });
  }
};

export const getPaymentRegisterReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getPaymentRegisterReport(companyId, parseReportQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Payment Register" });
  }
};

export const getRecoveryRegisterReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getRecoveryRegisterReport(companyId, parseReportQuery(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Recovery Register" });
  }
};

export const getProjectBillingSummaryReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getProjectBillingSummaryReport(companyId, { projectId: req.query.projectId as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Project Billing Summary" });
  }
};

export const exportRunningBillRegisterHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportRunningBillRegisterToCSV(companyId, parseReportQuery(req));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="running-bill-register-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Running Bill Register" });
  }
};

export const exportRunningBillPdfHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const bill = await getRunningBillById(id, companyId);
    const company = await getCompany(companyId);
    const pdf = await generateRunningBillPdf(bill, company.name);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${bill.billNumber}.pdf"`);
    res.status(200).send(pdf);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Running Bill PDF" });
  }
};

export const exportRunningBillExcelHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const bill = await getRunningBillById(id, companyId);
    const excel = await generateRunningBillExcel(bill);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${bill.billNumber}.xlsx"`);
    res.status(200).send(excel);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Running Bill Excel" });
  }
};

export const sendRunningBillEmailHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const sentById = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const bill = await getRunningBillById(id, companyId);
    const company = await getCompany(companyId);
    const data = await sendRunningBillEmail(id, companyId, sentById, req.body, bill, company.name);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to send Running Bill email" });
  }
};

export const getRunningBillEmailLogsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await listRunningBillEmailLogs(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load email logs" });
  }
};
