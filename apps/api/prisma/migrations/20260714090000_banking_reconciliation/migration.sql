-- CreateEnum
CREATE TYPE "public"."BankAccountType" AS ENUM ('BANK', 'CASH');

-- CreateEnum
CREATE TYPE "public"."ReconciliationStatus" AS ENUM ('UNMATCHED', 'PARTIALLY_MATCHED', 'MATCHED');

-- CreateEnum
CREATE TYPE "public"."BankTransactionSource" AS ENUM ('MANUAL', 'IMPORTED');

-- AlterTable
ALTER TABLE "public"."CompanyBankAccount" ADD COLUMN     "accountType" "public"."BankAccountType" NOT NULL DEFAULT 'BANK',
ADD COLUMN     "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."BankTransaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyBankAccountId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "deposit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "withdrawal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "referenceNumber" TEXT,
    "description" TEXT,
    "category" TEXT,
    "projectId" TEXT,
    "runningBillPaymentId" TEXT,
    "vendorPaymentId" TEXT,
    "reconciliationStatus" "public"."ReconciliationStatus" NOT NULL DEFAULT 'UNMATCHED',
    "source" "public"."BankTransactionSource" NOT NULL DEFAULT 'MANUAL',
    "importBatchId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_runningBillPaymentId_key" ON "public"."BankTransaction"("runningBillPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_vendorPaymentId_key" ON "public"."BankTransaction"("vendorPaymentId");

-- CreateIndex
CREATE INDEX "BankTransaction_companyId_idx" ON "public"."BankTransaction"("companyId");

-- CreateIndex
CREATE INDEX "BankTransaction_companyBankAccountId_idx" ON "public"."BankTransaction"("companyBankAccountId");

-- CreateIndex
CREATE INDEX "BankTransaction_transactionDate_idx" ON "public"."BankTransaction"("transactionDate");

-- CreateIndex
CREATE INDEX "BankTransaction_reconciliationStatus_idx" ON "public"."BankTransaction"("reconciliationStatus");

-- CreateIndex
CREATE INDEX "BankTransaction_projectId_idx" ON "public"."BankTransaction"("projectId");

-- CreateIndex
CREATE INDEX "BankTransaction_importBatchId_idx" ON "public"."BankTransaction"("importBatchId");

-- AddForeignKey
ALTER TABLE "public"."BankTransaction" ADD CONSTRAINT "BankTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankTransaction" ADD CONSTRAINT "BankTransaction_companyBankAccountId_fkey" FOREIGN KEY ("companyBankAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankTransaction" ADD CONSTRAINT "BankTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankTransaction" ADD CONSTRAINT "BankTransaction_runningBillPaymentId_fkey" FOREIGN KEY ("runningBillPaymentId") REFERENCES "public"."RunningBillPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankTransaction" ADD CONSTRAINT "BankTransaction_vendorPaymentId_fkey" FOREIGN KEY ("vendorPaymentId") REFERENCES "public"."VendorPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankTransaction" ADD CONSTRAINT "BankTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

