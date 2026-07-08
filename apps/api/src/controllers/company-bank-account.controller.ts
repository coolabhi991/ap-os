import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listCompanyBankAccounts,
  getCompanyBankAccountById,
  createCompanyBankAccount,
  updateCompanyBankAccount,
  deleteCompanyBankAccount,
} from "../services/company-bank-account.service.js";

const notFoundMessage = "Company bank account not found";

export const getCompanyBankAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const accounts = await listCompanyBankAccounts(companyId);
    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load company bank accounts" });
  }
};

export const getCompanyBankAccount = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const account = await getCompanyBankAccountById(id, companyId);
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load company bank account" });
  }
};

export const createCompanyBankAccountHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const account = await createCompanyBankAccount(companyId, req.body);
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create company bank account" });
  }
};

export const updateCompanyBankAccountHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const account = await updateCompanyBankAccount(id, companyId, req.body);
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update company bank account" });
  }
};

export const deleteCompanyBankAccountHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteCompanyBankAccount(id, companyId);
    if (result.deleted) {
      res.status(200).json({ success: true, message: "Company bank account deleted" });
    } else {
      res.status(200).json({ success: true, message: "Account has payment history — deactivated instead of deleted", data: result.data });
    }
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete company bank account" });
  }
};
