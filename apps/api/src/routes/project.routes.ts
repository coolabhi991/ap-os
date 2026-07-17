import { Router } from "express";
import {
  getProjects,
  getProject,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  getProjectExecutiveDashboardHandler,
  getProjectOverviewHandler,
  getProjectSitesOverviewHandler,
  getProjectFinanceHandler,
  getProjectTimelineHandler,
} from "../controllers/project.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getProjects);
router.get("/dashboard", authMiddleware, getProjectExecutiveDashboardHandler);
router.get("/:id/overview", authMiddleware, getProjectOverviewHandler);
router.get("/:id/sites-overview", authMiddleware, getProjectSitesOverviewHandler);
router.get("/:id/finance", authMiddleware, getProjectFinanceHandler);
router.get("/:id/timeline", authMiddleware, getProjectTimelineHandler);
router.get("/:id", authMiddleware, getProject);
router.post("/", authMiddleware, createProjectHandler);
router.put("/:id", authMiddleware, updateProjectHandler);
router.delete("/:id", authMiddleware, deleteProjectHandler);

export default router;
