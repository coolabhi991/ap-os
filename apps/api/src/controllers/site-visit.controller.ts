import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { listSiteVisits, getSiteVisitById, createSiteVisit, updateSiteVisit, deleteSiteVisit } from "../services/site-visit.service.js";

export const getSiteVisits = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { siteId, status, page, limit } = req.query;
    const result = await listSiteVisits(companyId, {
      siteId: siteId as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load site visits" });
  }
};

export const getSiteVisit = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const visit = await getSiteVisitById(id, companyId);
    res.status(200).json({ success: true, data: visit });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site visit not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load site visit" });
  }
};

export const createSiteVisitHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const visit = await createSiteVisit(companyId, userId, req.body);
    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create site visit" });
  }
};

export const updateSiteVisitHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const visit = await updateSiteVisit(id, companyId, req.body);
    res.status(200).json({ success: true, data: visit });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site visit not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update site visit" });
  }
};

export const deleteSiteVisitHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteSiteVisit(id, companyId);
    res.status(200).json({ success: true, message: "Site visit deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Site visit not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete site visit" });
  }
};
