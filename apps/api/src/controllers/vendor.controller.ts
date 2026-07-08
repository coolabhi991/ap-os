import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} from "../services/vendor.service.js";

export const getVendors = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, category, page, limit, sortBy, sortOrder } = req.query;

    const result = await listVendors(companyId, {
      search: search as string,
      status: status as string,
      category: category as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendors" });
  }
};

export const getVendor = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const vendor = await getVendorById(id, companyId);
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Vendor not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load vendor" });
  }
};

export const createVendorHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const vendor = await createVendor(companyId, req.body);
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create vendor" });
  }
};

export const updateVendorHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const vendor = await updateVendor(id, companyId, req.body);
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Vendor not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update vendor" });
  }
};

export const deleteVendorHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteVendor(id, companyId);
    res.status(200).json({ success: true, message: "Vendor deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Vendor not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete vendor" });
  }
};
