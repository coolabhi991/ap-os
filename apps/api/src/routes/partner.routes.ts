import { Router } from "express";
import { getPartners, getPartner, createPartnerHandler, updatePartnerHandler, deletePartnerHandler } from "../controllers/partner.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getPartners);
router.get("/:id", authMiddleware, getPartner);
router.post("/", authMiddleware, createPartnerHandler);
router.put("/:id", authMiddleware, updatePartnerHandler);
router.delete("/:id", authMiddleware, deletePartnerHandler);

export default router;
