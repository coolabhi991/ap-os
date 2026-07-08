import { Router } from "express";
import {
  getVendorBankAccounts,
  getVendorBankAccount,
  createVendorBankAccountHandler,
  updateVendorBankAccountHandler,
  deleteVendorBankAccountHandler,
} from "../controllers/vendor-bank-account.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getVendorBankAccounts); // ?vendorId= required
router.get("/:id", authMiddleware, getVendorBankAccount);
router.post("/", authMiddleware, createVendorBankAccountHandler);
router.put("/:id", authMiddleware, updateVendorBankAccountHandler);
router.delete("/:id", authMiddleware, deleteVendorBankAccountHandler);

export default router;
