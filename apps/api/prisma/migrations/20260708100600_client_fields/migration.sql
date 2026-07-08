-- Migration 7: Add extended fields to Client table
ALTER TABLE "public"."Client" ADD COLUMN "clientCode" TEXT;
ALTER TABLE "public"."Client" ADD COLUMN "city"        TEXT;
ALTER TABLE "public"."Client" ADD COLUMN "state"       TEXT;
ALTER TABLE "public"."Client" ADD COLUMN "pincode"     TEXT;
ALTER TABLE "public"."Client" ADD COLUMN "website"     TEXT;
ALTER TABLE "public"."Client" ADD COLUMN "notes"       TEXT;

CREATE INDEX "Client_companyId_idx" ON "public"."Client"("companyId");
CREATE INDEX "Client_status_idx"    ON "public"."Client"("status");
