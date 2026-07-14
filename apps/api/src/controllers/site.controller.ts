import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listSites, getSiteById, createSite, updateSite, deleteSite, getTenderPercentChangeLog } from "../services/site.service.js";

export const getSites = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { projectId, search, siteType, status, page, limit, sortBy, sortOrder } = req.query;

    const result = await listSites(companyId, {
      projectId: projectId as string,
      search: search as string,
      siteType: siteType as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load sites" });
  }
};

export const getSite = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const site = await getSiteById(id, companyId);
    res.status(200).json({ success: true, data: site });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load site" });
  }
};

export const createSiteHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const site = await createSite(companyId, req.body);
    res.status(201).json({ success: true, data: site });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create site" });
  }
};

export const updateSiteHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const site = await updateSite(id, companyId, req.body, req.user!.id);
    res.status(200).json({ success: true, data: site });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update site" });
  }
};

export const getTenderPercentChangeLogHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getTenderPercentChangeLog(id, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load tender percent change log" });
  }
};

export const deleteSiteHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteSite(id, companyId);
    res.status(200).json({ success: true, message: "Site deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete site" });
  }
};
