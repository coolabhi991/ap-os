import { Router } from "express";
import { askAIHandler, getSuggestedQuestionsHandler } from "../controllers/ai.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/suggestions", authMiddleware, getSuggestedQuestionsHandler);
router.post("/query", authMiddleware, askAIHandler);

export default router;
