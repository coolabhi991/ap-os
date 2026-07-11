-- CreateEnum
CREATE TYPE "public"."LiabilityType" AS ENUM ('HOME_LOAN', 'CAR_LOAN', 'GOLD_LOAN', 'BANK_LOAN', 'CASH_CREDIT', 'OVERDRAFT', 'CREDIT_CARD', 'FRIEND_LOAN', 'RELATIVE_LOAN', 'PRIVATE_FINANCE', 'PERSONAL_LOAN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LiabilityInterestType" AS ENUM ('MONTHLY', 'ANNUAL', 'FIXED', 'FLOATING', 'NONE');

-- CreateEnum
CREATE TYPE "public"."LiabilitySecurity" AS ENUM ('HOUSE', 'GOLD', 'VEHICLE', 'NONE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LiabilityStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AllocationType" ADD VALUE 'LIABILITY_DISBURSEMENT';
ALTER TYPE "public"."AllocationType" ADD VALUE 'LIABILITY_REPAYMENT';

-- AlterTable
ALTER TABLE "public"."TransactionAllocation" ADD COLUMN     "liabilityId" TEXT,
ADD COLUMN     "liabilityRepaymentId" TEXT;

-- CreateTable
CREATE TABLE "public"."Liability" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loanName" TEXT NOT NULL,
    "liabilityType" "public"."LiabilityType" NOT NULL,
    "lenderName" TEXT,
    "bankName" TEXT,
    "branch" TEXT,
    "accountNumber" TEXT,
    "sanctionAmount" DECIMAL(14,2) NOT NULL,
    "outstandingAmount" DECIMAL(14,2) NOT NULL,
    "interestType" "public"."LiabilityInterestType" NOT NULL DEFAULT 'NONE',
    "interestRate" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "emiAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "emiDate" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "security" "public"."LiabilitySecurity" NOT NULL DEFAULT 'NONE',
    "status" "public"."LiabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LiabilityRepayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "liabilityId" TEXT NOT NULL,
    "repaymentNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "principalPaid" DECIMAL(12,2) NOT NULL,
    "interestPaid" DECIMAL(12,2) NOT NULL,
    "totalPaid" DECIMAL(12,2) NOT NULL,
    "companyBankAccountId" TEXT NOT NULL,
    "remarks" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiabilityRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Liability_companyId_idx" ON "public"."Liability"("companyId");

-- CreateIndex
CREATE INDEX "Liability_liabilityType_idx" ON "public"."Liability"("liabilityType");

-- CreateIndex
CREATE INDEX "Liability_status_idx" ON "public"."Liability"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LiabilityRepayment_repaymentNumber_key" ON "public"."LiabilityRepayment"("repaymentNumber");

-- CreateIndex
CREATE INDEX "LiabilityRepayment_companyId_idx" ON "public"."LiabilityRepayment"("companyId");

-- CreateIndex
CREATE INDEX "LiabilityRepayment_liabilityId_idx" ON "public"."LiabilityRepayment"("liabilityId");

-- CreateIndex
CREATE INDEX "LiabilityRepayment_paymentDate_idx" ON "public"."LiabilityRepayment"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionAllocation_liabilityRepaymentId_key" ON "public"."TransactionAllocation"("liabilityRepaymentId");

-- CreateIndex
CREATE INDEX "TransactionAllocation_liabilityId_idx" ON "public"."TransactionAllocation"("liabilityId");

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "public"."Liability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_liabilityRepaymentId_fkey" FOREIGN KEY ("liabilityRepaymentId") REFERENCES "public"."LiabilityRepayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Liability" ADD CONSTRAINT "Liability_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LiabilityRepayment" ADD CONSTRAINT "LiabilityRepayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LiabilityRepayment" ADD CONSTRAINT "LiabilityRepayment_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "public"."Liability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LiabilityRepayment" ADD CONSTRAINT "LiabilityRepayment_companyBankAccountId_fkey" FOREIGN KEY ("companyBankAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LiabilityRepayment" ADD CONSTRAINT "LiabilityRepayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

