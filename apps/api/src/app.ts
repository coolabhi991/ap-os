import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import projectRoutes from "./routes/project.routes.js";
import projectContractInfoRoutes from "./routes/project-contract-info.routes.js";
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
import expenseRoutes from "./routes/expense.routes.js";
import expenseCategoryRoutes from "./routes/expense-category.routes.js";
import materialIssueRoutes from "./routes/material-issue.routes.js";
import labourGroupRoutes from "./routes/labour-group.routes.js";
import labourRoutes from "./routes/labour.routes.js";
import labourWageRateRoutes from "./routes/labour-wage-rate.routes.js";
import labourAttendanceRoutes from "./routes/labour-attendance.routes.js";
import labourAdvanceRoutes from "./routes/labour-advance.routes.js";
import labourPaymentRoutes from "./routes/labour-payment.routes.js";
import labourReportRoutes from "./routes/labour-report.routes.js";
import subWorkRoutes from "./routes/sub-work.routes.js";
import projectControlCenterRoutes from "./routes/project-control-center.routes.js";
import siteRoutes from "./routes/site.routes.js";
import siteControlCenterRoutes from "./routes/site-control-center.routes.js";
import siteVisitRoutes from "./routes/site-visit.routes.js";
import documentRoutes from "./routes/document.routes.js";
import dprRoutes from "./routes/dpr.routes.js";
import mbRoutes from "./routes/mb.routes.js";
import runningBillRoutes from "./routes/running-bill.routes.js";
import bankTransactionRoutes from "./routes/bank-transaction.routes.js";
import transactionAllocationRoutes from "./routes/transaction-allocation.routes.js";
import bankingReportsRoutes from "./routes/banking-reports.routes.js";
import partnerRoutes from "./routes/partner.routes.js";
import partnerInvestmentRoutes from "./routes/partner-investment.routes.js";
import partnerSettlementRoutes from "./routes/partner-settlement.routes.js";
import partnershipReportsRoutes from "./routes/partnership-reports.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import liabilityRoutes from "./routes/liability.routes.js";
import liabilityRepaymentRoutes from "./routes/liability-repayment.routes.js";
import financeReportsRoutes from "./routes/finance-reports.routes.js";

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
app.use("/api/v1/projects", projectContractInfoRoutes);
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
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/expense-categories", expenseCategoryRoutes);
app.use("/api/v1/material-issues", materialIssueRoutes);
app.use("/api/v1/labour-groups", labourGroupRoutes);
app.use("/api/v1/labour-wage-rates", labourWageRateRoutes);
app.use("/api/v1/labour-attendance", labourAttendanceRoutes);
app.use("/api/v1/labour-advances", labourAdvanceRoutes);
app.use("/api/v1/labour-payments", labourPaymentRoutes);
// Mounted before labourRoutes: labourReportRoutes defines /dashboard and /reports/*
// on the same "/api/v1/labour" base, which must be matched before labourRoutes' /:id
// catch-all would otherwise swallow them (e.g. "dashboard" treated as a labour id).
app.use("/api/v1/labour", labourReportRoutes);
app.use("/api/v1/labour", labourRoutes);
app.use("/api/v1/sub-works", subWorkRoutes);
app.use("/api/v1/project-control-center", projectControlCenterRoutes);
app.use("/api/v1/sites", siteRoutes);
app.use("/api/v1/site-control-center", siteControlCenterRoutes);
app.use("/api/v1/site-visits", siteVisitRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/dpr", dprRoutes);
app.use("/api/v1/measurement-books", mbRoutes);
app.use("/api/v1/running-bills", runningBillRoutes);
app.use("/api/v1/bank-transactions", bankTransactionRoutes);
app.use("/api/v1/transaction-allocations", transactionAllocationRoutes);
app.use("/api/v1/banking-reports", bankingReportsRoutes);
app.use("/api/v1/partners", partnerRoutes);
app.use("/api/v1/partner-investments", partnerInvestmentRoutes);
app.use("/api/v1/partner-settlements", partnerSettlementRoutes);
app.use("/api/v1/partnership-reports", partnershipReportsRoutes);
app.use("/api/v1/liabilities", liabilityRoutes);
app.use("/api/v1/liability-repayments", liabilityRepaymentRoutes);
app.use("/api/v1/finance-reports", financeReportsRoutes);
app.use("/api/v1/ai", aiRoutes);

export default app;