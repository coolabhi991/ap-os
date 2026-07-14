-- AlterEnum
ALTER TYPE "public"."DeductionType" ADD VALUE 'MSEB';

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "filePath" TEXT,
ADD COLUMN     "fileSizeBytes" INTEGER,
ADD COLUMN     "mimeType" TEXT;

-- AlterTable
ALTER TABLE "public"."RunningBill" ADD COLUMN     "adjustedTotal" DECIMAL(14,2),
ADD COLUMN     "billSubmittedDate" TIMESTAMP(3),
ADD COLUMN     "finalBillAmount" DECIMAL(14,2),
ADD COLUMN     "grossBillAmount" DECIMAL(14,2),
ADD COLUMN     "gstAmount" DECIMAL(14,2),
ADD COLUMN     "gstPercent" DECIMAL(5,2),
ADD COLUMN     "roundOff" DECIMAL(14,2),
ADD COLUMN     "tenderAboveBelowPercent" DECIMAL(5,2),
ADD COLUMN     "tenderAdjustmentAmount" DECIMAL(14,2);

-- CreateTable
CREATE TABLE "public"."SiteTenderPercentChangeLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "previousPercent" DECIMAL(5,2),
    "newPercent" DECIMAL(5,2),
    "reason" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteTenderPercentChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteTenderPercentChangeLog_companyId_idx" ON "public"."SiteTenderPercentChangeLog"("companyId");

-- CreateIndex
CREATE INDEX "SiteTenderPercentChangeLog_siteId_idx" ON "public"."SiteTenderPercentChangeLog"("siteId");

-- AddForeignKey
ALTER TABLE "public"."SiteTenderPercentChangeLog" ADD CONSTRAINT "SiteTenderPercentChangeLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteTenderPercentChangeLog" ADD CONSTRAINT "SiteTenderPercentChangeLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteTenderPercentChangeLog" ADD CONSTRAINT "SiteTenderPercentChangeLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

