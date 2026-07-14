import { Router, Request, Response, NextFunction } from "express";
import {
  getWorkOrderExtensionsHandler,
  createWorkOrderExtensionHandler,
  downloadWorkOrderExtensionFileHandler,
} from "../controllers/work-order-extension.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { uploadDocument } from "../middleware/upload.middleware.js";

const router = Router();

// Reuses the same multer instance as the Documents module (PDF/JPEG/PNG, 10MB) — an Extension
// Letter is just another authenticated-download disk upload, no separate config needed. See
// document.routes.ts for why multer's callback-style error must be adapted here (no global
// Express error middleware exists in this app).
function handleUpload(req: Request, res: Response, next: NextFunction) {
  uploadDocument(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : "Failed to upload file";
      res.status(400).json({ success: false, message });
      return;
    }
    next();
  });
}

router.get("/", authMiddleware, getWorkOrderExtensionsHandler);
router.get("/:id/file", authMiddleware, downloadWorkOrderExtensionFileHandler);
router.post("/", authMiddleware, handleUpload, createWorkOrderExtensionHandler);

export default router;
