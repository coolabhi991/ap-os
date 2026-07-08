import { Router } from "express";
import {
  getProjects,
  getProject,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from "../controllers/project.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getProjects);
router.get("/:id", authMiddleware, getProject);
router.post("/", authMiddleware, createProjectHandler);
router.put("/:id", authMiddleware, updateProjectHandler);
router.delete("/:id", authMiddleware, deleteProjectHandler);

export default router;
