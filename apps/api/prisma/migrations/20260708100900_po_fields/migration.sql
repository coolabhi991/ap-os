-- Migration 12: Extend PurchaseOrder table
ALTER TABLE "public"."PurchaseOrder" ADD COLUMN "deliveryAddress" TEXT;
ALTER TABLE "public"."PurchaseOrder" ADD COLUMN "paymentTerms"    TEXT;
ALTER TABLE "public"."PurchaseOrder" ADD COLUMN "items"           JSONB;
ALTER TABLE "public"."PurchaseOrder" ADD COLUMN "discount"        DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "public"."PurchaseOrder" ADD COLUMN "gstAmount"       DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE INDEX "PurchaseOrder_companyId_idx"     ON "public"."PurchaseOrder"("companyId");
CREATE INDEX "PurchaseOrder_projectId_idx"     ON "public"."PurchaseOrder"("projectId");
CREATE INDEX "PurchaseOrder_status_idx"        ON "public"."PurchaseOrder"("status");
CREATE INDEX "PurchaseOrder_requisitionId_idx" ON "public"."PurchaseOrder"("requisitionId");
