import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  getBankBookReport,
  getCashBookReport,
  getBankReconciliationReport,
  getCashFlowReport,
  getReceivablesReport,
  getPayablesReport,
  getOutstandingSummaryReport,
  getBankChargesReport,
  getInternalTransferReport,
  exportReceivablesToCSV,
  exportPayablesToCSV,
  exportBankBookToCSV,
  exportCashBookToCSV,
} from "../services/banking-reports.service.js";
import { generateBankBookPdf, generateBankBookExcel, generateCashBookPdf, generateCashBookExcel } from "../services/banking-export.service.js";
import { sendBankBookEmail, sendCashBookEmail } from "../services/banking-email.service.js";
import { getCompany } from "../services/company.service.js";

function reportQuery(req: AuthRequest) {
  return { projectId: req.query.projectId as string, fromDate: req.query.fromDate as string, toDate: req.query.toDate as string };
}

export const getBankBookReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getBankBookReport(companyId, { companyBankAccountId: req.query.companyBankAccountId as string, fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Bank Book" });
  }
};

export const getCashBookReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getCashBookReport(companyId, { fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Cash Book" });
  }
};

export const getBankReconciliationReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getBankReconciliationReport(companyId, {
      companyBankAccountId: req.query.companyBankAccountId as string,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Bank Reconciliation report" });
  }
};

export const getCashFlowReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getCashFlowReport(companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Cash Flow" });
  }
};

export const getReceivablesReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getReceivablesReport(companyId, { projectId: req.query.projectId as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Receivables report" });
  }
};

export const getPayablesReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getPayablesReport(companyId, { projectId: req.query.projectId as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Payables report" });
  }
};

export const getOutstandingSummaryReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getOutstandingSummaryReport(companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Outstanding Summary" });
  }
};

export const getBankChargesReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getBankChargesReport(companyId, {
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      companyBankAccountId: req.query.companyBankAccountId as string,
      search: req.query.search as string,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Bank Charges Report" });
  }
};

export const getInternalTransferReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const data = await getInternalTransferReport(companyId, { fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load Internal Transfer Register" });
  }
};

export const exportReceivablesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportReceivablesToCSV(companyId, reportQuery(req));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="receivables-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Receivables" });
  }
};

export const exportPayablesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportPayablesToCSV(companyId, reportQuery(req));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="payables-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Payables" });
  }
};

export const exportBankBookCsvHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportBankBookToCSV(companyId, { companyBankAccountId: req.query.companyBankAccountId as string, fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="bank-book-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Bank Book" });
  }
};

export const exportCashBookCsvHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportCashBookToCSV(companyId, { fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="cash-book-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Cash Book" });
  }
};

export const exportBankBookPdfHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const report = await getBankBookReport(companyId, { companyBankAccountId: req.query.companyBankAccountId as string, fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    const company = await getCompany(companyId);
    const pdf = await generateBankBookPdf(report, company.name);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="bank-book-${report.account.accountNumber}.pdf"`);
    res.status(200).send(pdf);
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Bank Book PDF" });
  }
};

export const exportBankBookExcelHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const report = await getBankBookReport(companyId, { companyBankAccountId: req.query.companyBankAccountId as string, fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    const excel = await generateBankBookExcel(report);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="bank-book-${report.account.accountNumber}.xlsx"`);
    res.status(200).send(excel);
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Bank Book Excel" });
  }
};

export const exportCashBookPdfHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const report = await getCashBookReport(companyId, { fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    const company = await getCompany(companyId);
    const pdf = await generateCashBookPdf(report, company.name);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="cash-book.pdf"`);
    res.status(200).send(pdf);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Cash Book PDF" });
  }
};

export const exportCashBookExcelHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const report = await getCashBookReport(companyId, { fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    const excel = await generateCashBookExcel(report);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="cash-book.xlsx"`);
    res.status(200).send(excel);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export Cash Book Excel" });
  }
};

export const sendBankBookEmailHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const report = await getBankBookReport(companyId, { companyBankAccountId: req.query.companyBankAccountId as string, fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    const company = await getCompany(companyId);
    await sendBankBookEmail(req.body, report, company.name);
    res.status(200).json({ success: true, message: "Bank Book emailed successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to email Bank Book" });
  }
};

export const sendCashBookEmailHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const report = await getCashBookReport(companyId, { fromDate: req.query.fromDate as string, toDate: req.query.toDate as string });
    const company = await getCompany(companyId);
    await sendCashBookEmail(req.body, report, company.name);
    res.status(200).json({ success: true, message: "Cash Book emailed successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to email Cash Book" });
  }
};
