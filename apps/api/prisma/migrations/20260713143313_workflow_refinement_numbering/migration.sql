-- DropForeignKey
ALTER TABLE "public"."ProjectContractInfo" DROP CONSTRAINT "ProjectContractInfo_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProjectContractInfo" DROP CONSTRAINT "ProjectContractInfo_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."Employee" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "public"."Liability" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "public"."Partner" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "public"."Site" ADD COLUMN     "agreementDate" TIMESTAMP(3),
ADD COLUMN     "agreementNumber" TEXT,
ADD COLUMN     "clientEngineer" TEXT,
ADD COLUMN     "defectLiabilityPeriod" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "division" TEXT,
ADD COLUMN     "gstPercent" DECIMAL(5,2),
ADD COLUMN     "siteCode" TEXT,
ADD COLUMN     "subDivision" TEXT,
ADD COLUMN     "tenderAboveBelowPercent" DECIMAL(5,2),
ADD COLUMN     "tenderNumber" TEXT,
ADD COLUMN     "workOrderNumber" TEXT;

-- DropTable
DROP TABLE "public"."ProjectContractInfo";

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientCode_key" ON "public"."Client"("clientCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_code_key" ON "public"."Employee"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Liability_code_key" ON "public"."Liability"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_code_key" ON "public"."Partner"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "public"."Project"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Site_siteCode_key" ON "public"."Site"("siteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "public"."Vendor"("vendorCode");

