import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listSiteBoqItems, getSiteBoqItemById, createSiteBoqItem, updateSiteBoqItem, deleteSiteBoqItem } from "../services/site-boq-item.service.js";

const notFoundMessage = "BOQ Item not found";

export const getSiteBoqItemsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { siteId } = req.query;
    if (!siteId) {
      res.status(400).json({ success: false, message: "siteId query param is required" });
      return;
    }
    const data = await listSiteBoqItems(siteId as string, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load BOQ items" });
  }
};

export const getSiteBoqItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getSiteBoqItemById(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load BOQ item" });
  }
};

export const createSiteBoqItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const createdById = req.user!.id;
    const data = await createSiteBoqItem(companyId, createdById, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create BOQ item" });
  }
};

export const updateSiteBoqItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await updateSiteBoqItem(id, companyId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update BOQ item" });
  }
};

export const deleteSiteBoqItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteSiteBoqItem(id, companyId);
    res.status(200).json({ success: true, message: "BOQ Item deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete BOQ item" });
  }
};
