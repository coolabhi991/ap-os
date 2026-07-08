import { Router } from "express";
import { getLabourWageRates, createLabourWageRateHandler } from "../controllers/labour-wage-rate.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getLabourWageRates); // ?labourId= required
router.post("/", authMiddleware, createLabourWageRateHandler);

export default router;
