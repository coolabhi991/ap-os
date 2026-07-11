/*
  Warnings:

  - You are about to drop the column `reconciliationStatus` on the `BankTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `runningBillPaymentId` on the `BankTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `vendorPaymentId` on the `BankTransaction` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."AllocationStatus" AS ENUM ('UNALLOCATED', 'PARTIALLY_ALLOCATED', 'FULLY_ALLOCATED');

-- CreateEnum
CREATE TYPE "public"."AllocationType" AS ENUM ('RUNNING_BILL_RECEIPT', 'VENDOR_PAYMENT', 'LABOUR', 'SITE_EXPENSE', 'INTERNAL_TRANSFER', 'OWNER_INVESTMENT', 'PARTNER_INVESTMENT', 'GST', 'LOAN', 'OFFICE_EXPENSE', 'OTHER');

-- DropForeignKey
ALTER TABLE "public"."BankTransaction" DROP CONSTRAINT "BankTransaction_runningBillPaymentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BankTransaction" DROP CONSTRAINT "BankTransaction_vendorPaymentId_fkey";

-- DropIndex
DROP INDEX "public"."BankTransaction_reconciliationStatus_idx";

-- DropIndex
DROP INDEX "public"."BankTransaction_runningBillPaymentId_key";

-- DropIndex
DROP INDEX "public"."BankTransaction_vendorPaymentId_key";

-- AlterTable
ALTER TABLE "public"."BankTransaction" DROP COLUMN "reconciliationStatus",
DROP COLUMN "runningBillPaymentId",
DROP COLUMN "vendorPaymentId",
ADD COLUMN     "allocationStatus" "public"."AllocationStatus" NOT NULL DEFAULT 'UNALLOCATED';

-- DropEnum
DROP TYPE "public"."ReconciliationStatus";

-- CreateTable
CREATE TABLE "public"."TransactionAllocation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankTransactionId" TEXT NOT NULL,
    "allocationType" "public"."AllocationType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "siteId" TEXT,
    "partyName" TEXT,
    "notes" TEXT,
    "runningBillPaymentId" TEXT,
    "vendorPaymentId" TEXT,
    "labourPaymentId" TEXT,
    "expenseId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionAllocation_runningBillPaymentId_key" ON "public"."TransactionAllocation"("runningBillPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionAllocation_vendorPaymentId_key" ON "public"."TransactionAllocation"("vendorPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionAllocation_labourPaymentId_key" ON "public"."TransactionAllocation"("labourPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionAllocation_expenseId_key" ON "public"."TransactionAllocation"("expenseId");

-- CreateIndex
CREATE INDEX "TransactionAllocation_companyId_idx" ON "public"."TransactionAllocation"("companyId");

-- CreateIndex
CREATE INDEX "TransactionAllocation_bankTransactionId_idx" ON "public"."TransactionAllocation"("bankTransactionId");

-- CreateIndex
CREATE INDEX "TransactionAllocation_siteId_idx" ON "public"."TransactionAllocation"("siteId");

-- CreateIndex
CREATE INDEX "TransactionAllocation_allocationType_idx" ON "public"."TransactionAllocation"("allocationType");

-- CreateIndex
CREATE INDEX "BankTransaction_allocationStatus_idx" ON "public"."BankTransaction"("allocationStatus");

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "public"."BankTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_runningBillPaymentId_fkey" FOREIGN KEY ("runningBillPaymentId") REFERENCES "public"."RunningBillPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_vendorPaymentId_fkey" FOREIGN KEY ("vendorPaymentId") REFERENCES "public"."VendorPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_labourPaymentId_fkey" FOREIGN KEY ("labourPaymentId") REFERENCES "public"."LabourPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
