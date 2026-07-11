-- CreateEnum
CREATE TYPE "public"."DeductionType" AS ENUM ('SECURITY_DEPOSIT', 'GST', 'LABOUR_CESS', 'ROYALTY', 'TDS', 'MOBILIZATION_RECOVERY', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."BillStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'PASSED', 'PARTLY_PAID', 'FULLY_PAID');
ALTER TABLE "public"."RunningBill" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."RunningBill" ALTER COLUMN "status" TYPE "public"."BillStatus_new" USING ("status"::text::"public"."BillStatus_new");
ALTER TYPE "public"."BillStatus" RENAME TO "BillStatus_old";
ALTER TYPE "public"."BillStatus_new" RENAME TO "BillStatus";
DROP TYPE "public"."BillStatus_old";
ALTER TABLE "public"."RunningBill" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
ALTER TYPE "public"."DocumentType" ADD VALUE 'GOVERNMENT_LETTER';

-- DropForeignKey
ALTER TABLE "public"."RunningBill" DROP CONSTRAINT "RunningBill_measurementBookId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RunningBill" DROP CONSTRAINT "RunningBill_projectId_fkey";

-- DropIndex
DROP INDEX "public"."RunningBill_billNumber_key";

-- DropIndex
DROP INDEX "public"."RunningBill_measurementBookId_idx";

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "runningBillId" TEXT;

-- AlterTable
ALTER TABLE "public"."RunningBill" DROP COLUMN "approvalDate",
DROP COLUMN "approvedBy",
DROP COLUMN "checkedBy",
DROP COLUMN "grossAmount",
DROP COLUMN "gstAmount",
DROP COLUMN "mobilizationRecovery",
DROP COLUMN "otherRecovery",
DROP COLUMN "paymentDate",
DROP COLUMN "royaltyRecovery",
DROP COLUMN "securityDeposit",
DROP COLUMN "submissionDate",
DROP COLUMN "submittedBy",
ADD COLUMN     "billDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "passedAt" TIMESTAMP(3),
ADD COLUMN     "site" TEXT,
ADD COLUMN     "subWorkId" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "totalDeductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
ALTER COLUMN "projectId" SET NOT NULL,
ALTER COLUMN "measurementBookId" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."RunningBillItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "runningBillId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "boqItemNo" TEXT NOT NULL,
    "boqDescription" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "previousQuantity" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "currentQuantity" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalQuantity" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "boqRate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentPercent" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "effectiveRate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "previousAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunningBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RunningBillDeduction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "runningBillId" TEXT NOT NULL,
    "type" "public"."DeductionType" NOT NULL DEFAULT 'OTHER',
    "label" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunningBillDeduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RunningBillPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "runningBillId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "companyBankAccountId" TEXT,
    "paymentNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(14,2) NOT NULL,
    "mode" TEXT,
    "referenceNumber" TEXT,
    "remarks" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunningBillPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RunningBillEmailLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "runningBillId" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "includedExcel" BOOLEAN NOT NULL DEFAULT false,
    "sentById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,

    CONSTRAINT "RunningBillEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RunningBillItem_companyId_idx" ON "public"."RunningBillItem"("companyId");

-- CreateIndex
CREATE INDEX "RunningBillItem_runningBillId_idx" ON "public"."RunningBillItem"("runningBillId");

-- CreateIndex
CREATE INDEX "RunningBillItem_boqItemNo_idx" ON "public"."RunningBillItem"("boqItemNo");

-- CreateIndex
CREATE INDEX "RunningBillDeduction_companyId_idx" ON "public"."RunningBillDeduction"("companyId");

-- CreateIndex
CREATE INDEX "RunningBillDeduction_runningBillId_idx" ON "public"."RunningBillDeduction"("runningBillId");

-- CreateIndex
CREATE UNIQUE INDEX "RunningBillPayment_paymentNumber_key" ON "public"."RunningBillPayment"("paymentNumber");

-- CreateIndex
CREATE INDEX "RunningBillPayment_companyId_idx" ON "public"."RunningBillPayment"("companyId");

-- CreateIndex
CREATE INDEX "RunningBillPayment_runningBillId_idx" ON "public"."RunningBillPayment"("runningBillId");

-- CreateIndex
CREATE INDEX "RunningBillPayment_projectId_idx" ON "public"."RunningBillPayment"("projectId");

-- CreateIndex
CREATE INDEX "RunningBillPayment_companyBankAccountId_idx" ON "public"."RunningBillPayment"("companyBankAccountId");

-- CreateIndex
CREATE INDEX "RunningBillEmailLog_companyId_idx" ON "public"."RunningBillEmailLog"("companyId");

-- CreateIndex
CREATE INDEX "RunningBillEmailLog_runningBillId_idx" ON "public"."RunningBillEmailLog"("runningBillId");

-- CreateIndex
CREATE INDEX "Document_runningBillId_idx" ON "public"."Document"("runningBillId");

-- CreateIndex
CREATE UNIQUE INDEX "RunningBill_measurementBookId_key" ON "public"."RunningBill"("measurementBookId");

-- CreateIndex
CREATE INDEX "RunningBill_subWorkId_idx" ON "public"."RunningBill"("subWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "RunningBill_companyId_billNumber_key" ON "public"."RunningBill"("companyId", "billNumber");

-- AddForeignKey
ALTER TABLE "public"."RunningBill" ADD CONSTRAINT "RunningBill_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBill" ADD CONSTRAINT "RunningBill_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBill" ADD CONSTRAINT "RunningBill_measurementBookId_fkey" FOREIGN KEY ("measurementBookId") REFERENCES "public"."MeasurementBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBill" ADD CONSTRAINT "RunningBill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillItem" ADD CONSTRAINT "RunningBillItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillItem" ADD CONSTRAINT "RunningBillItem_runningBillId_fkey" FOREIGN KEY ("runningBillId") REFERENCES "public"."RunningBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillDeduction" ADD CONSTRAINT "RunningBillDeduction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillDeduction" ADD CONSTRAINT "RunningBillDeduction_runningBillId_fkey" FOREIGN KEY ("runningBillId") REFERENCES "public"."RunningBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillPayment" ADD CONSTRAINT "RunningBillPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillPayment" ADD CONSTRAINT "RunningBillPayment_runningBillId_fkey" FOREIGN KEY ("runningBillId") REFERENCES "public"."RunningBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillPayment" ADD CONSTRAINT "RunningBillPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillPayment" ADD CONSTRAINT "RunningBillPayment_companyBankAccountId_fkey" FOREIGN KEY ("companyBankAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillPayment" ADD CONSTRAINT "RunningBillPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillEmailLog" ADD CONSTRAINT "RunningBillEmailLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillEmailLog" ADD CONSTRAINT "RunningBillEmailLog_runningBillId_fkey" FOREIGN KEY ("runningBillId") REFERENCES "public"."RunningBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBillEmailLog" ADD CONSTRAINT "RunningBillEmailLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_runningBillId_fkey" FOREIGN KEY ("runningBillId") REFERENCES "public"."RunningBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

