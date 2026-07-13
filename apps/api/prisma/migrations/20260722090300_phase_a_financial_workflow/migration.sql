-- CreateEnum
CREATE TYPE "public"."EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."BankAccountOwnerType" AS ENUM ('COMPANY', 'EMPLOYEE', 'VENDOR', 'CLIENT', 'PARTNER', 'LIABILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."BankAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AllocationType" ADD VALUE 'EMPLOYEE_SALARY';
ALTER TYPE "public"."AllocationType" ADD VALUE 'SITE_ADVANCE';
ALTER TYPE "public"."AllocationType" ADD VALUE 'PERSONAL_ADVANCE';
ALTER TYPE "public"."AllocationType" ADD VALUE 'OD_CC_INTEREST';
ALTER TYPE "public"."AllocationType" ADD VALUE 'BANK_CHARGES';
ALTER TYPE "public"."AllocationType" ADD VALUE 'INTEREST_INCOME';
ALTER TYPE "public"."AllocationType" ADD VALUE 'CAR_LOAN_EMI';
ALTER TYPE "public"."AllocationType" ADD VALUE 'HOME_LOAN_EMI';
ALTER TYPE "public"."AllocationType" ADD VALUE 'GOLD_LOAN';
ALTER TYPE "public"."AllocationType" ADD VALUE 'EMERGENCY_LOAN';
ALTER TYPE "public"."AllocationType" ADD VALUE 'OTHER_LOAN';

-- AlterTable
ALTER TABLE "public"."TransactionAllocation" ADD COLUMN     "employeeId" TEXT;

-- CreateTable
CREATE TABLE "public"."Employee" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "status" "public"."EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BankAccountMaster" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ownerType" "public"."BankAccountOwnerType" NOT NULL,
    "ownerId" TEXT,
    "ownerLabel" TEXT,
    "bankName" TEXT NOT NULL,
    "branch" TEXT,
    "accountHolder" TEXT,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "upiId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."BankAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccountMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "public"."Employee"("companyId");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "public"."Employee"("status");

-- CreateIndex
CREATE INDEX "BankAccountMaster_companyId_idx" ON "public"."BankAccountMaster"("companyId");

-- CreateIndex
CREATE INDEX "BankAccountMaster_ownerType_idx" ON "public"."BankAccountMaster"("ownerType");

-- CreateIndex
CREATE INDEX "BankAccountMaster_ownerId_idx" ON "public"."BankAccountMaster"("ownerId");

-- CreateIndex
CREATE INDEX "TransactionAllocation_employeeId_idx" ON "public"."TransactionAllocation"("employeeId");

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankAccountMaster" ADD CONSTRAINT "BankAccountMaster_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

