-- DropIndex
DROP INDEX "public"."Client_clientCode_key";

-- DropIndex
DROP INDEX "public"."Employee_code_key";

-- DropIndex
DROP INDEX "public"."Liability_code_key";

-- DropIndex
DROP INDEX "public"."Partner_code_key";

-- DropIndex
DROP INDEX "public"."Project_code_key";

-- DropIndex
DROP INDEX "public"."Site_siteCode_key";

-- DropIndex
DROP INDEX "public"."Vendor_vendorCode_key";

-- CreateIndex
CREATE UNIQUE INDEX "Client_companyId_clientCode_key" ON "public"."Client"("companyId", "clientCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_code_key" ON "public"."Employee"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Liability_companyId_code_key" ON "public"."Liability"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_companyId_code_key" ON "public"."Partner"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Project_companyId_code_key" ON "public"."Project"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Site_companyId_siteCode_key" ON "public"."Site"("companyId", "siteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_companyId_vendorCode_key" ON "public"."Vendor"("companyId", "vendorCode");

