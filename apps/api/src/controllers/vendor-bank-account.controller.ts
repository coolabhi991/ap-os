import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listVendorBankAccounts,
  getVendorBankAccountById,
  createVendorBankAccount,
  updateVendorBankAccount,
  deleteVendorBankAccount,
} from "../services/vendor-bank-account.service.js";

const notFoundMessage = "Vendor bank account not found";

export const getVendorBankAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const vendorId = req.query.vendorId as string;
    if (!vendorId) {
      res.status(400).json({ success: false, message: "vendorId is required" });
      return;
    }
    const accounts = await listVendorBankAccounts(companyId, vendorId);
    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Vendor not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor bank accounts" });
  }
};

export const getVendorBankAccount = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const account = await getVendorBankAccountById(id, companyId);
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor bank account" });
  }
};

export const createVendorBankAccountHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { vendorId, ...input } = req.body;
    if (!vendorId) {
      res.status(400).json({ success: false, message: "vendorId is required" });
      return;
    }
    const account = await createVendorBankAccount(companyId, vendorId, input);
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Vendor not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create vendor bank account" });
  }
};

export const updateVendorBankAccountHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const account = await updateVendorBankAccount(id, companyId, req.body);
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update vendor bank account" });
  }
};

export const deleteVendorBankAccountHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteVendorBankAccount(id, companyId);
    if (result.deleted) {
      res.status(200).json({ success: true, message: "Vendor bank account deleted" });
    } else {
      res.status(200).json({ success: true, message: "Account has payment history — deactivated instead of deleted", data: result.data });
    }
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete vendor bank account" });
  }
};
