import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listClients,
  getClientById,
  getClientLedger,
  createClient,
  updateClient,
  deleteClient,
} from "../services/client.service.js";

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, page, limit, sortBy, sortOrder } = req.query;

    const result = await listClients(companyId, {
      search: search as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load clients" });
  }
};

export const getClient = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const client = await getClientById(id, companyId);
    res.status(200).json({ success: true, data: client });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Client not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load client" });
  }
};

export const getClientLedgerHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ledger = await getClientLedger(id, companyId);
    res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Client not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load client ledger" });
  }
};

export const createClientHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const client = await createClient(companyId, req.body);
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create client" });
  }
};

export const updateClientHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const client = await updateClient(id, companyId, req.body);
    res.status(200).json({ success: true, data: client });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Client not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update client" });
  }
};

export const deleteClientHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteClient(id, companyId);
    if (result.deleted) {
      res.status(200).json({ success: true, message: "Client deleted" });
    } else {
      res.status(200).json({ success: true, message: "Client has projects on file — deactivated instead of deleted", data: result.data });
    }
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Client not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete client" });
  }
};
