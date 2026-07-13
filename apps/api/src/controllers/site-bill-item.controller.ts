import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listSiteBillItems, getSiteBillItemById, createSiteBillItem, updateSiteBillItem, deleteSiteBillItem } from "../services/site-bill-item.service.js";

const notFoundMessage = "Bill Item not found";

export const getSiteBillItemsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { siteId, includeInactive } = req.query;
    if (!siteId) {
      res.status(400).json({ success: false, message: "siteId query param is required" });
      return;
    }
    const data = await listSiteBillItems(siteId as string, companyId, includeInactive === "true");
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load bill items" });
  }
};

export const getSiteBillItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getSiteBillItemById(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load bill item" });
  }
};

export const createSiteBillItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const data = await createSiteBillItem(companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create bill item" });
  }
};

export const updateSiteBillItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await updateSiteBillItem(id, companyId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update bill item" });
  }
};

export const deleteSiteBillItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteSiteBillItem(id, companyId);
    res.status(200).json({ success: true, message: "Bill Item deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete bill item" });
  }
};
