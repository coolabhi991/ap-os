import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { answerQuery, AI_INTENTS } from "../services/ai-query.service.js";

export const askAIHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const message = typeof req.body?.message === "string" ? req.body.message : "";
    const data = await answerQuery(companyId, message);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to answer the question" });
  }
};

export const getSuggestedQuestionsHandler = async (_req: AuthRequest, res: Response) => {
  const data = AI_INTENTS.map(({ id, label, example, category }) => ({ id, label, example, category }));
  res.status(200).json({ success: true, data });
};
