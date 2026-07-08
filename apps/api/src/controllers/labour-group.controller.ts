import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listLabourGroups,
  createLabourGroup,
  updateLabourGroup,
  deleteLabourGroup,
} from "../services/labour-group.service.js";

const notFoundMessage = "Labour group not found";

export const getLabourGroups = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const includeInactive = req.query.includeInactive !== "false";
    const groups = await listLabourGroups(companyId, includeInactive);
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load labour groups" });
  }
};

export const createLabourGroupHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const group = await createLabourGroup(companyId, req.body);
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create labour group" });
  }
};

export const updateLabourGroupHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const group = await updateLabourGroup(id, companyId, req.body);
    res.status(200).json({ success: true, data: group });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update labour group" });
  }
};

export const deleteLabourGroupHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteLabourGroup(id, companyId);
    if (result.deleted) {
      res.status(200).json({ success: true, message: "Labour group deleted" });
    } else {
      res.status(200).json({ success: true, message: "Group has workers assigned — deactivated instead of deleted", data: result.data });
    }
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete labour group" });
  }
};
