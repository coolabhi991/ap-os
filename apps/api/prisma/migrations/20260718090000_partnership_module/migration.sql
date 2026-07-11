-- CreateEnum
CREATE TYPE "public"."PartnerType" AS ENUM ('OWNER', 'PARTNER');

-- CreateEnum
CREATE TYPE "public"."SettlementType" AS ENUM ('PROFIT_SHARE', 'INVESTMENT_RETURN', 'OTHER');

-- AlterEnum
ALTER TYPE "public"."AllocationType" ADD VALUE 'PARTNER_SETTLEMENT';

-- AlterTable
ALTER TABLE "public"."TransactionAllocation" ADD COLUMN     "partnerInvestmentId" TEXT,
ADD COLUMN     "partnerSettlementId" TEXT;

-- CreateTable
CREATE TABLE "public"."Partner" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partnerType" "public"."PartnerType" NOT NULL DEFAULT 'PARTNER',
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "panNumber" TEXT,
    "sharePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartnerInvestment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "investmentNumber" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "investmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL,
    "companyBankAccountId" TEXT,
    "referenceNumber" TEXT,
    "remarks" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartnerSettlement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "settlementNumber" TEXT NOT NULL,
    "settlementType" "public"."SettlementType" NOT NULL DEFAULT 'OTHER',
    "amount" DECIMAL(14,2) NOT NULL,
    "settlementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL,
    "companyBankAccountId" TEXT,
    "referenceNumber" TEXT,
    "remarks" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Partner_companyId_idx" ON "public"."Partner"("companyId");

-- CreateIndex
CREATE INDEX "Partner_partnerType_idx" ON "public"."Partner"("partnerType");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerInvestment_investmentNumber_key" ON "public"."PartnerInvestment"("investmentNumber");

-- CreateIndex
CREATE INDEX "PartnerInvestment_companyId_idx" ON "public"."PartnerInvestment"("companyId");

-- CreateIndex
CREATE INDEX "PartnerInvestment_partnerId_idx" ON "public"."PartnerInvestment"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerSettlement_settlementNumber_key" ON "public"."PartnerSettlement"("settlementNumber");

-- CreateIndex
CREATE INDEX "PartnerSettlement_companyId_idx" ON "public"."PartnerSettlement"("companyId");

-- CreateIndex
CREATE INDEX "PartnerSettlement_partnerId_idx" ON "public"."PartnerSettlement"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionAllocation_partnerInvestmentId_key" ON "public"."TransactionAllocation"("partnerInvestmentId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionAllocation_partnerSettlementId_key" ON "public"."TransactionAllocation"("partnerSettlementId");

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_partnerInvestmentId_fkey" FOREIGN KEY ("partnerInvestmentId") REFERENCES "public"."PartnerInvestment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_partnerSettlementId_fkey" FOREIGN KEY ("partnerSettlementId") REFERENCES "public"."PartnerSettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Partner" ADD CONSTRAINT "Partner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerInvestment" ADD CONSTRAINT "PartnerInvestment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerInvestment" ADD CONSTRAINT "PartnerInvestment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerInvestment" ADD CONSTRAINT "PartnerInvestment_companyBankAccountId_fkey" FOREIGN KEY ("companyBankAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerInvestment" ADD CONSTRAINT "PartnerInvestment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerSettlement" ADD CONSTRAINT "PartnerSettlement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerSettlement" ADD CONSTRAINT "PartnerSettlement_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerSettlement" ADD CONSTRAINT "PartnerSettlement_companyBankAccountId_fkey" FOREIGN KEY ("companyBankAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerSettlement" ADD CONSTRAINT "PartnerSettlement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

