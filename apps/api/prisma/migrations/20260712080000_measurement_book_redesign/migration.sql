-- CreateEnum
CREATE TYPE "public"."MeasurementBookStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."DocumentType" ADD VALUE 'SCANNED_MB';
ALTER TYPE "public"."DocumentType" ADD VALUE 'ABSTRACT_SHEET';
ALTER TYPE "public"."DocumentType" ADD VALUE 'TEST_REPORT';

-- DropForeignKey
ALTER TABLE "public"."MeasurementBook" DROP CONSTRAINT "MeasurementBook_projectId_fkey";

-- DropIndex
DROP INDEX "public"."MeasurementBook_mbNumber_key";

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "measurementBookId" TEXT;

-- AlterTable
ALTER TABLE "public"."MeasurementBook" DROP COLUMN "approvedBy",
DROP COLUMN "boqItem",
DROP COLUMN "boqRate",
DROP COLUMN "checkedBy",
DROP COLUMN "currentAmount",
DROP COLUMN "currentQuantity",
DROP COLUMN "extraItemRate",
DROP COLUMN "itemDescription",
DROP COLUMN "measuredBy",
DROP COLUMN "pageNumber",
DROP COLUMN "previousAmount",
DROP COLUMN "previousQuantity",
DROP COLUMN "totalAmount",
DROP COLUMN "totalQuantity",
DROP COLUMN "unit",
DROP COLUMN "verifiedBy",
ADD COLUMN     "contractorId" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "engineerId" TEXT,
ADD COLUMN     "site" TEXT,
ADD COLUMN     "subWorkId" TEXT,
ALTER COLUMN "projectId" SET NOT NULL,
ALTER COLUMN "mbDate" SET NOT NULL,
ALTER COLUMN "mbDate" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."MeasurementBookStatus" NOT NULL DEFAULT 'DRAFT';

-- DropEnum
DROP TYPE "public"."MeasurementStatus";

-- CreateTable
CREATE TABLE "public"."MeasurementBookItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "measurementBookId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "boqItemNo" TEXT NOT NULL,
    "boqDescription" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "length" DECIMAL(12,4),
    "breadth" DECIMAL(12,4),
    "height" DECIMAL(12,4),
    "quantity" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "boqRate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentPercent" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "effectiveRate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasurementBookItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeasurementBookItem_companyId_idx" ON "public"."MeasurementBookItem"("companyId");

-- CreateIndex
CREATE INDEX "MeasurementBookItem_measurementBookId_idx" ON "public"."MeasurementBookItem"("measurementBookId");

-- CreateIndex
CREATE INDEX "Document_measurementBookId_idx" ON "public"."Document"("measurementBookId");

-- CreateIndex
CREATE INDEX "MeasurementBook_subWorkId_idx" ON "public"."MeasurementBook"("subWorkId");

-- CreateIndex
CREATE INDEX "MeasurementBook_status_idx" ON "public"."MeasurementBook"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementBook_companyId_mbNumber_key" ON "public"."MeasurementBook"("companyId", "mbNumber");

-- AddForeignKey
ALTER TABLE "public"."MeasurementBook" ADD CONSTRAINT "MeasurementBook_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementBook" ADD CONSTRAINT "MeasurementBook_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementBook" ADD CONSTRAINT "MeasurementBook_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementBook" ADD CONSTRAINT "MeasurementBook_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementBook" ADD CONSTRAINT "MeasurementBook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementBookItem" ADD CONSTRAINT "MeasurementBookItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementBookItem" ADD CONSTRAINT "MeasurementBookItem_measurementBookId_fkey" FOREIGN KEY ("measurementBookId") REFERENCES "public"."MeasurementBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_measurementBookId_fkey" FOREIGN KEY ("measurementBookId") REFERENCES "public"."MeasurementBook"("id") ON DELETE SET NULL ON UPDATE CASCADE;

