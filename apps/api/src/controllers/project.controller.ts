import { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getProjects = async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string | undefined;
    const projects = await prisma.project.findMany({
      where: companyId ? { companyId } : {},
      include: {
        client: true,
        projectType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load projects" });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.create({ data: req.body });
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create project" });
  }
};
