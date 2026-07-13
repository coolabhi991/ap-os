-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."DeductionType" ADD VALUE 'GST_STATE';
ALTER TYPE "public"."DeductionType" ADD VALUE 'GST_CENTRAL';
ALTER TYPE "public"."DeductionType" ADD VALUE 'INCOME_TAX';
ALTER TYPE "public"."DeductionType" ADD VALUE 'FINE';

-- DropForeignKey
ALTER TABLE "public"."RunningBill" DROP CONSTRAINT "RunningBill_measurementBookId_fkey";

-- AlterTable
ALTER TABLE "public"."RunningBill" ADD COLUMN     "raSequence" INTEGER,
ALTER COLUMN "measurementBookId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."RunningBillItem" ADD COLUMN     "siteBillItemId" TEXT;

-- CreateTable
CREATE TABLE "public"."SiteBillItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "subWorkId" TEXT,
    "itemNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteBillItem_companyId_idx" ON "public"."SiteBillItem"("companyId");

-- CreateIndex
CREATE INDEX "SiteBillItem_siteId_idx" ON "public"."SiteBillItem"("siteId");

-- CreateIndex
CREATE INDEX "SiteBillItem_subWorkId_idx" ON "public"."SiteBillItem"("subWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "RunningBill_siteId_raSequence_key" ON "public"."RunningBill"("siteId", "raSequence");

-- CreateIndex
CREATE INDEX "RunningBillItem_siteBillItemId_idx" ON "public"."RunningBillItem"("siteBillItemId");

-- AddForeignKey
ALTER TABLE "public"."RunningBill" ADD CONSTRAINT "RunningBill_measurementBookId_fkey" FOREIGN KEY ("measurementBookId") REFERENCES "public"."MeasurementBook"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillItem" ADD CONSTRAINT "RunningBillItem_siteBillItemId_fkey" FOREIGN KEY ("siteBillItemId") REFERENCES "public"."SiteBillItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteBillItem" ADD CONSTRAINT "SiteBillItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteBillItem" ADD CONSTRAINT "SiteBillItem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteBillItem" ADD CONSTRAINT "SiteBillItem_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteBillItem" ADD CONSTRAINT "SiteBillItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

