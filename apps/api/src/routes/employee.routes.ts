import { Router } from "express";
import {
  getEmployees,
  getEmployee,
  createEmployeeHandler,
  updateEmployeeHandler,
  deleteEmployeeHandler,
} from "../controllers/employee.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getEmployees);
router.get("/:id", authMiddleware, getEmployee);
router.post("/", authMiddleware, createEmployeeHandler);
router.put("/:id", authMiddleware, updateEmployeeHandler);
router.delete("/:id", authMiddleware, deleteEmployeeHandler);

export default router;
