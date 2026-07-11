import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { getProjectContractInfo, upsertProjectContractInfo } from "../services/project-contract-info.service.js";

const notFoundMessage = "Project not found";

export const getProjectContractInfoHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
    const data = await getProjectContractInfo(projectId, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load contract information" });
  }
};

export const upsertProjectContractInfoHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
    const data = await upsertProjectContractInfo(projectId, companyId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to save contract information" });
  }
};
