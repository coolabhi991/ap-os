import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listBankAccountMasters,
  getBankAccountMasterById,
  createBankAccountMaster,
  updateBankAccountMaster,
  deleteBankAccountMaster,
} from "../services/bank-account-master.service.js";

const notFoundMessage = "Bank account not found";

export const getBankAccountMasters = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { ownerType, ownerId, status, page, limit } = req.query;

    const result = await listBankAccountMasters(companyId, {
      ownerType: ownerType as string,
      ownerId: ownerId as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load bank accounts" });
  }
};

export const getBankAccountMaster = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const account = await getBankAccountMasterById(id, companyId);
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load bank account" });
  }
};

export const createBankAccountMasterHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const account = await createBankAccountMaster(companyId, req.body);
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create bank account" });
  }
};

export const updateBankAccountMasterHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const account = await updateBankAccountMaster(id, companyId, req.body);
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update bank account" });
  }
};

export const deleteBankAccountMasterHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteBankAccountMaster(id, companyId);
    res.status(200).json({ success: true, message: "Bank account deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete bank account" });
  }
};
