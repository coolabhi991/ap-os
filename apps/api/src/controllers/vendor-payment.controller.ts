import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listVendorPayments,
  getVendorPaymentById,
  recordVendorPayment,
  getVendorLedger,
  getVendorProjectBreakdown,
  getVendorPaymentDashboard,
  exportVendorPaymentsToCSV,
} from "../services/vendor-payment.service.js";

const notFoundMessage = "Vendor Payment not found";

export const getVendorPayments = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, vendorId, vendorBillId, mode, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;

    const result = await listVendorPayments(companyId, {
      search: search as string,
      vendorId: vendorId as string,
      vendorBillId: vendorBillId as string,
      mode: mode as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor payments" });
  }
};

export const getVendorPayment = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const payment = await getVendorPaymentById(id, companyId);
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor payment" });
  }
};

export const createVendorPaymentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const payment = await recordVendorPayment(companyId, req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Vendor Bill not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to record vendor payment" });
  }
};

export const getVendorLedgerHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { vendorId, fromDate, toDate } = req.query;
    const ledger = await getVendorLedger(companyId, vendorId as string, {
      fromDate: fromDate as string,
      toDate: toDate as string,
    });
    res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    const is404 = error instanceof Error && (error.message === "Vendor not found" || error.message === "Vendor is required");
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor ledger" });
  }
};

export const getVendorProjectBreakdownHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const vendorId = req.query.vendorId as string;
    if (!vendorId) {
      res.status(400).json({ success: false, message: "vendorId query param is required" });
      return;
    }
    const data = await getVendorProjectBreakdown(companyId, vendorId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Vendor not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor project breakdown" });
  }
};

export const getVendorPaymentDashboardHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const summary = await getVendorPaymentDashboard(companyId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor payments dashboard" });
  }
};

export const exportVendorPaymentsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, vendorId, vendorBillId, mode, fromDate, toDate } = req.query;

    const csv = await exportVendorPaymentsToCSV(companyId, {
      search: search as string,
      vendorId: vendorId as string,
      vendorBillId: vendorBillId as string,
      mode: mode as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="vendor-payments-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export vendor payments" });
  }
};
