import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listLabourPayments,
  getLabourPaymentById,
  createLabourPayment,
  deleteLabourPayment,
  exportLabourPaymentsToCSV,
} from "../services/labour-payment.service.js";

const notFoundMessage = "Payment not found";

function parseListQuery(req: AuthRequest) {
  const { search, labourId, projectId, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query;
  return {
    search: search as string,
    labourId: labourId as string,
    projectId: projectId as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string,
    sortOrder: (sortOrder as "asc" | "desc") || undefined,
  };
}

export const getLabourPayments = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const result = await listLabourPayments(companyId, parseListQuery(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load payments" });
  }
};

export const getLabourPayment = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const payment = await getLabourPaymentById(id, companyId);
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load payment" });
  }
};

export const createLabourPaymentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const payment = await createLabourPayment(companyId, createdById, req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create payment" });
  }
};

export const deleteLabourPaymentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteLabourPayment(id, companyId);
    res.status(200).json({ success: true, message: "Payment deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete payment" });
  }
};

export const exportLabourPaymentsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const csv = await exportLabourPaymentsToCSV(companyId, parseListQuery(req));

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="labour-payments-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export payments" });
  }
};
