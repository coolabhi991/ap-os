import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../services/project.service.js";

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, clientId, projectTypeId, page, limit, sortBy, sortOrder } = req.query;

    const result = await listProjects(companyId, {
      search: search as string,
      status: status as string,
      clientId: clientId as string,
      projectTypeId: projectTypeId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load projects" });
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const project = await getProjectById(id, companyId);
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Project not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load project" });
  }
};

export const createProjectHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    if (!req.body.name?.trim()) {
      return res.status(400).json({ success: false, message: "Project name is required" });
    }

    const project = await createProject(companyId, req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create project" });
  }
};

export const updateProjectHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!req.body.name?.trim()) {
      return res.status(400).json({ success: false, message: "Project name is required" });
    }

    const project = await updateProject(id, companyId, req.body);
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Project not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update project" });
  }
};

export const deleteProjectHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteProject(id, companyId);
    res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Project not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete project" });
  }
};
