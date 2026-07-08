import { Router } from "express";
import {
  getCompanyBankAccounts,
  getCompanyBankAccount,
  createCompanyBankAccountHandler,
  updateCompanyBankAccountHandler,
  deleteCompanyBankAccountHandler,
} from "../controllers/company-bank-account.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getCompanyBankAccounts);
router.get("/:id", authMiddleware, getCompanyBankAccount);
router.post("/", authMiddleware, createCompanyBankAccountHandler);
router.put("/:id", authMiddleware, updateCompanyBankAccountHandler);
router.delete("/:id", authMiddleware, deleteCompanyBankAccountHandler);

export default router;
