import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import projectRoutes from "./routes/project.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import clientRoutes from "./routes/client.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import prRoutes from "./routes/purchase-requisition.routes.js";
import poRoutes from "./routes/purchase-order.routes.js";
import mrRoutes from "./routes/material-receipt.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import vendorBillRoutes from "./routes/vendor-bill.routes.js";
import vendorPaymentRoutes from "./routes/vendor-payment.routes.js";
import vendorBankAccountRoutes from "./routes/vendor-bank-account.routes.js";
import companyBankAccountRoutes from "./routes/company-bank-account.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    application: "AP OS",
    version: "0.1.0",
    message: "API is running successfully",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/purchase", purchaseRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/vendors", vendorRoutes);
app.use("/api/v1/purchase-requisitions", prRoutes);
app.use("/api/v1/purchase-orders", poRoutes);
app.use("/api/v1/material-receipts", mrRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/vendor-bills", vendorBillRoutes);
app.use("/api/v1/vendor-payments", vendorPaymentRoutes);
app.use("/api/v1/vendor-bank-accounts", vendorBankAccountRoutes);
app.use("/api/v1/company-bank-accounts", companyBankAccountRoutes);

export default app;