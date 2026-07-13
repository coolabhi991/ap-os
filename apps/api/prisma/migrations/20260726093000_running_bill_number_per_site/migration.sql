-- DropIndex
DROP INDEX "public"."RunningBill_companyId_billNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "RunningBill_siteId_billNumber_key" ON "public"."RunningBill"("siteId", "billNumber");

