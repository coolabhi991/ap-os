-- CreateEnum
CREATE TYPE "public"."GstType" AS ENUM ('NONE', 'FIVE', 'TWELVE', 'EIGHTEEN', 'CUSTOM');

-- AlterTable
ALTER TABLE "public"."Liability" ADD COLUMN     "lenderMobile" TEXT,
ADD COLUMN     "loanNumber" TEXT,
ADD COLUMN     "minimumDue" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "statementDate" INTEGER;

-- AlterTable
ALTER TABLE "public"."MeasurementBook" ADD COLUMN     "abstractPdfName" TEXT,
ADD COLUMN     "abstractPdfUrl" TEXT,
ADD COLUMN     "raBillNumber" TEXT,
ADD COLUMN     "sourceRecapRevisionId" TEXT;

-- AlterTable
ALTER TABLE "public"."MeasurementBookItem" ADD COLUMN     "previousAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "previousQuantity" DECIMAL(14,4) NOT NULL DEFAULT 0,
ADD COLUMN     "subWorkId" TEXT,
ADD COLUMN     "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalQuantity" DECIMAL(14,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."SiteRecapRevision" ADD COLUMN     "administrationCharges" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "grandTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gstType" "public"."GstType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "otherCharges" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "subTotal" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."RecapitulationItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteRecapRevisionId" TEXT NOT NULL,
    "subWorkId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "particular" TEXT NOT NULL,
    "qty" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "rate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "RecapitulationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MeasurementItemFieldAudit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "measurementBookId" TEXT NOT NULL,
    "boqItemNo" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeasurementItemFieldAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecapitulationItem_companyId_idx" ON "public"."RecapitulationItem"("companyId");

-- CreateIndex
CREATE INDEX "RecapitulationItem_siteRecapRevisionId_idx" ON "public"."RecapitulationItem"("siteRecapRevisionId");

-- CreateIndex
CREATE INDEX "RecapitulationItem_subWorkId_idx" ON "public"."RecapitulationItem"("subWorkId");

-- CreateIndex
CREATE INDEX "MeasurementItemFieldAudit_companyId_idx" ON "public"."MeasurementItemFieldAudit"("companyId");

-- CreateIndex
CREATE INDEX "MeasurementItemFieldAudit_measurementBookId_idx" ON "public"."MeasurementItemFieldAudit"("measurementBookId");

-- CreateIndex
CREATE INDEX "MeasurementBook_sourceRecapRevisionId_idx" ON "public"."MeasurementBook"("sourceRecapRevisionId");

-- CreateIndex
CREATE INDEX "MeasurementBookItem_subWorkId_idx" ON "public"."MeasurementBookItem"("subWorkId");

-- AddForeignKey
ALTER TABLE "public"."RecapitulationItem" ADD CONSTRAINT "RecapitulationItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecapitulationItem" ADD CONSTRAINT "RecapitulationItem_siteRecapRevisionId_fkey" FOREIGN KEY ("siteRecapRevisionId") REFERENCES "public"."SiteRecapRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecapitulationItem" ADD CONSTRAINT "RecapitulationItem_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementBook" ADD CONSTRAINT "MeasurementBook_sourceRecapRevisionId_fkey" FOREIGN KEY ("sourceRecapRevisionId") REFERENCES "public"."SiteRecapRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementBookItem" ADD CONSTRAINT "MeasurementBookItem_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementItemFieldAudit" ADD CONSTRAINT "MeasurementItemFieldAudit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementItemFieldAudit" ADD CONSTRAINT "MeasurementItemFieldAudit_measurementBookId_fkey" FOREIGN KEY ("measurementBookId") REFERENCES "public"."MeasurementBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementItemFieldAudit" ADD CONSTRAINT "MeasurementItemFieldAudit_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

