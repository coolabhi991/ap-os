-- AlterTable
ALTER TABLE "public"."VendorBill" ADD COLUMN     "siteId" TEXT;

-- CreateIndex
CREATE INDEX "VendorBill_siteId_idx" ON "public"."VendorBill"("siteId");

-- AddForeignKey
ALTER TABLE "public"."VendorBill" ADD CONSTRAINT "VendorBill_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

