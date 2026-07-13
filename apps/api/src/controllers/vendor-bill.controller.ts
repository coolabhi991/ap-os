import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listVendorBills,
  getVendorBillById,
  createVendorBill,
  updateVendorBill,
  recordVendorBillPayment,
  cancelVendorBill,
  deleteVendorBill,
  getVendorBillDashboard,
  exportVendorBillsToCSV,
} from "../services/vendor-bill.service.js";

const notFoundMessage = "Vendor Bill not found";

export const getVendorBills = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, vendorId, projectId, siteId, fromDate, toDate, overdue, page, limit, sortBy, sortOrder } = req.query;

    const result = await listVendorBills(companyId, {
      search: search as string,
      status: status as string,
      vendorId: vendorId as string,
      projectId: projectId as string,
      siteId: siteId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      overdue: overdue === "true",
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor bills" });
  }
};

export const getVendorBill = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const bill = await getVendorBillById(id, companyId);
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor bill" });
  }
};

export const createVendorBillHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const bill = await createVendorBill(companyId, req.body);
    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create vendor bill" });
  }
};

export const updateVendorBillHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const bill = await updateVendorBill(id, companyId, req.body);
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update vendor bill" });
  }
};

export const recordPaymentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const bill = await recordVendorBillPayment(id, companyId, req.body);
    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to record payment" });
  }
};

export const getPaymentHistoryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const bill = await getVendorBillById(id, companyId);
    res.status(200).json({ success: true, data: bill.payments });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load payment history" });
  }
};

export const cancelVendorBillHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const bill = await cancelVendorBill(id, companyId);
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to cancel vendor bill" });
  }
};

export const deleteVendorBillHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteVendorBill(id, companyId);
    res.status(200).json({ success: true, message: "Vendor bill deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete vendor bill" });
  }
};

export const getVendorBillDashboardHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const summary = await getVendorBillDashboard(companyId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor bills dashboard" });
  }
};

export const exportVendorBillsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, vendorId, projectId, fromDate, toDate } = req.query;

    const csv = await exportVendorBillsToCSV(companyId, {
      search: search as string,
      status: status as string,
      vendorId: vendorId as string,
      projectId: projectId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="vendor-bills-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export vendor bills" });
  }
};
