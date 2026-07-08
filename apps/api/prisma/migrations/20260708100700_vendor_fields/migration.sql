-- Migration 10: Add extended fields to Vendor table
ALTER TABLE "public"."Vendor" ADD COLUMN "vendorCode"    TEXT;
ALTER TABLE "public"."Vendor" ADD COLUMN "city"          TEXT;
ALTER TABLE "public"."Vendor" ADD COLUMN "state"         TEXT;
ALTER TABLE "public"."Vendor" ADD COLUMN "pincode"       TEXT;
ALTER TABLE "public"."Vendor" ADD COLUMN "bankName"      TEXT;
ALTER TABLE "public"."Vendor" ADD COLUMN "accountNumber" TEXT;
ALTER TABLE "public"."Vendor" ADD COLUMN "ifscCode"      TEXT;
ALTER TABLE "public"."Vendor" ADD COLUMN "notes"         TEXT;

CREATE INDEX "Vendor_companyId_idx" ON "public"."Vendor"("companyId");
CREATE INDEX "Vendor_status_idx"    ON "public"."Vendor"("status");
CREATE INDEX "Vendor_category_idx"  ON "public"."Vendor"("category");
