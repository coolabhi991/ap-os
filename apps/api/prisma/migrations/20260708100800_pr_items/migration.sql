-- Migration 11: Add items JSON column + indexes to PurchaseRequisition
ALTER TABLE "public"."PurchaseRequisition" ADD COLUMN "items" JSONB;

CREATE INDEX "PurchaseRequisition_companyId_idx" ON "public"."PurchaseRequisition"("companyId");
CREATE INDEX "PurchaseRequisition_projectId_idx" ON "public"."PurchaseRequisition"("projectId");
CREATE INDEX "PurchaseRequisition_status_idx"    ON "public"."PurchaseRequisition"("status");
