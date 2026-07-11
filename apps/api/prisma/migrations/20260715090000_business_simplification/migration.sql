-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."DocumentType" ADD VALUE 'WORK_ORDER';
ALTER TYPE "public"."DocumentType" ADD VALUE 'AGREEMENT';
ALTER TYPE "public"."DocumentType" ADD VALUE 'BOQ';
ALTER TYPE "public"."DocumentType" ADD VALUE 'TECHNICAL_SANCTION';
ALTER TYPE "public"."DocumentType" ADD VALUE 'ADMINISTRATIVE_APPROVAL';

-- AlterTable
ALTER TABLE "public"."VendorPayment" ADD COLUMN     "paidToName" TEXT,
ADD COLUMN     "paidToOtherParty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paidToReason" TEXT;

-- CreateTable
CREATE TABLE "public"."ProjectContractInfo" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workOrderNumber" TEXT,
    "workOrderDate" TIMESTAMP(3),
    "agreementNumber" TEXT,
    "agreementDate" TIMESTAMP(3),
    "tenderNumber" TEXT,
    "department" TEXT,
    "division" TEXT,
    "subDivision" TEXT,
    "clientEngineer" TEXT,
    "estimateAmount" DECIMAL(14,2),
    "workStartDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "defectLiabilityPeriod" TEXT,
    "securityDepositPercent" DECIMAL(5,2),
    "performanceGuaranteePercent" DECIMAL(5,2),
    "gstPercent" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectContractInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectContractInfo_projectId_key" ON "public"."ProjectContractInfo"("projectId");

-- CreateIndex
CREATE INDEX "ProjectContractInfo_companyId_idx" ON "public"."ProjectContractInfo"("companyId");

-- AddForeignKey
ALTER TABLE "public"."ProjectContractInfo" ADD CONSTRAINT "ProjectContractInfo_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectContractInfo" ADD CONSTRAINT "ProjectContractInfo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

