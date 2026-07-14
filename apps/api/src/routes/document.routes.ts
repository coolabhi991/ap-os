import { Router, Request, Response, NextFunction } from "express";
import { getDocumentsHandler, createDocumentHandler, downloadDocumentHandler, deleteDocumentHandler } from "../controllers/document.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { uploadDocument } from "../middleware/upload.middleware.js";

const router = Router();

// This app has no global Express error-handling middleware (see app.ts) — multer reports
// rejected uploads (bad file type, too large) via a callback error, not a thrown exception a
// route handler's try/catch would see, so it must be adapted into the app's usual JSON envelope
// here rather than falling through to Express's default HTML error page.
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

router.get("/", authMiddleware, getDocumentsHandler);
router.get("/:id/file", authMiddleware, downloadDocumentHandler);
router.post("/", authMiddleware, handleUpload, createDocumentHandler);
router.delete("/:id", authMiddleware, deleteDocumentHandler);

export default router;
