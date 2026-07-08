-- Migration 13: Extend MaterialReceipt with GRN fields, multi-item support, vendor FK
ALTER TABLE "public"."MaterialReceipt" ADD COLUMN "vendorId"               TEXT;
ALTER TABLE "public"."MaterialReceipt" ADD COLUMN "items"                  JSONB;
ALTER TABLE "public"."MaterialReceipt" ADD COLUMN "challanNumber"          TEXT;
ALTER TABLE "public"."MaterialReceipt" ADD COLUMN "supplierInvoiceNumber"  TEXT;
ALTER TABLE "public"."MaterialReceipt" ADD COLUMN "vehicleNumber"          TEXT;
ALTER TABLE "public"."MaterialReceipt" ADD COLUMN "receivedBy"             TEXT;
ALTER TABLE "public"."MaterialReceipt" ADD COLUMN "supplierRepresentative" TEXT;
ALTER TABLE "public"."MaterialReceipt" ADD COLUMN "qualityStatus"          TEXT;
ALTER TABLE "public"."MaterialReceipt" ADD COLUMN "remarks"                TEXT;

ALTER TABLE "public"."MaterialReceipt"
    ADD CONSTRAINT "MaterialReceipt_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "MaterialReceipt_companyId_idx"     ON "public"."MaterialReceipt"("companyId");
CREATE INDEX "MaterialReceipt_purchaseOrderId_idx" ON "public"."MaterialReceipt"("purchaseOrderId");
CREATE INDEX "MaterialReceipt_projectId_idx"     ON "public"."MaterialReceipt"("projectId");
CREATE INDEX "MaterialReceipt_status_idx"        ON "public"."MaterialReceipt"("status");
