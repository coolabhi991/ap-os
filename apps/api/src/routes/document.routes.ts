import { Router } from "express";
import { getDocumentsHandler, createDocumentHandler, deleteDocumentHandler } from "../controllers/document.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getDocumentsHandler);
router.post("/", authMiddleware, createDocumentHandler);
router.delete("/:id", authMiddleware, deleteDocumentHandler);

export default router;
