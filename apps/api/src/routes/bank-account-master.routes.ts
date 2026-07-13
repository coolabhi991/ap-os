import { Router } from "express";
import {
  getBankAccountMasters,
  getBankAccountMaster,
  createBankAccountMasterHandler,
  updateBankAccountMasterHandler,
  deleteBankAccountMasterHandler,
} from "../controllers/bank-account-master.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getBankAccountMasters);
router.get("/:id", authMiddleware, getBankAccountMaster);
router.post("/", authMiddleware, createBankAccountMasterHandler);
router.put("/:id", authMiddleware, updateBankAccountMasterHandler);
router.delete("/:id", authMiddleware, deleteBankAccountMasterHandler);

export default router;
