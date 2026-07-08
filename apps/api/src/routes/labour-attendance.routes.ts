import { Router } from "express";
import {
  getLabourAttendanceList,
  getLabourAttendance,
  markAttendanceHandler,
  bulkMarkAttendanceHandler,
  updateLabourAttendanceHandler,
  deleteLabourAttendanceHandler,
  exportLabourAttendanceHandler,
} from "../controllers/labour-attendance.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Static sub-routes — must come before /:id
router.get("/export", authMiddleware, exportLabourAttendanceHandler);
router.post("/bulk", authMiddleware, bulkMarkAttendanceHandler);

router.get("/", authMiddleware, getLabourAttendanceList);
router.get("/:id", authMiddleware, getLabourAttendance);
router.post("/", authMiddleware, markAttendanceHandler);
router.put("/:id", authMiddleware, updateLabourAttendanceHandler);
router.delete("/:id", authMiddleware, deleteLabourAttendanceHandler);

export default router;
