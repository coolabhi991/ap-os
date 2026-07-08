-- CreateTable
CREATE TABLE "public"."CompanyBankAccount" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nickname" TEXT,
    "beneficiaryName" TEXT,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "branch" TEXT,
    "upiId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorBankAccount" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "nickname" TEXT,
    "beneficiaryName" TEXT,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "branch" TEXT,
    "upiId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "projectId" TEXT,
    "vendorBillId" TEXT NOT NULL,
    "companyBankAccountId" TEXT,
    "vendorBankAccountId" TEXT,
    "paymentNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "mode" TEXT,
    "referenceNumber" TEXT,
    "attachmentFileName" TEXT,
    "attachmentFileUrl" TEXT,
    "remarks" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyBankAccount_companyId_idx" ON "public"."CompanyBankAccount"("companyId");

-- CreateIndex
CREATE INDEX "VendorBankAccount_companyId_idx" ON "public"."VendorBankAccount"("companyId");

-- CreateIndex
CREATE INDEX "VendorBankAccount_vendorId_idx" ON "public"."VendorBankAccount"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPayment_paymentNumber_key" ON "public"."VendorPayment"("paymentNumber");

-- CreateIndex
CREATE INDEX "VendorPayment_companyId_idx" ON "public"."VendorPayment"("companyId");

-- CreateIndex
CREATE INDEX "VendorPayment_vendorId_idx" ON "public"."VendorPayment"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPayment_vendorBillId_idx" ON "public"."VendorPayment"("vendorBillId");

-- CreateIndex
CREATE INDEX "VendorPayment_companyBankAccountId_idx" ON "public"."VendorPayment"("companyBankAccountId");

-- CreateIndex
CREATE INDEX "VendorPayment_vendorBankAccountId_idx" ON "public"."VendorPayment"("vendorBankAccountId");

-- CreateIndex
CREATE INDEX "VendorPayment_status_idx" ON "public"."VendorPayment"("status");

-- AddForeignKey
ALTER TABLE "public"."CompanyBankAccount" ADD CONSTRAINT "CompanyBankAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorBankAccount" ADD CONSTRAINT "VendorBankAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorBankAccount" ADD CONSTRAINT "VendorBankAccount_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorPayment" ADD CONSTRAINT "VendorPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorPayment" ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorPayment" ADD CONSTRAINT "VendorPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorPayment" ADD CONSTRAINT "VendorPayment_vendorBillId_fkey" FOREIGN KEY ("vendorBillId") REFERENCES "public"."VendorBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorPayment" ADD CONSTRAINT "VendorPayment_companyBankAccountId_fkey" FOREIGN KEY ("companyBankAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorPayment" ADD CONSTRAINT "VendorPayment_vendorBankAccountId_fkey" FOREIGN KEY ("vendorBankAccountId") REFERENCES "public"."VendorBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: preserve existing vendor-bill payments (recorded via the old generic
-- Payment table) into the new dedicated VendorPayment ledger before the old linkage
-- column is dropped. Free-text legacy mode values are normalized to the new fixed set.
INSERT INTO "public"."VendorPayment" (
    "id", "companyId", "vendorId", "projectId", "vendorBillId",
    "paymentNumber", "paymentDate", "amount", "mode", "remarks", "status",
    "createdAt", "updatedAt"
)
SELECT
    "id", "companyId", "vendorId", "projectId", "vendorBillId",
    "paymentNumber", "paymentDate", "amount",
    CASE
        WHEN "mode" ILIKE 'bank%'   THEN 'BANK'
        WHEN "mode" ILIKE 'cash%'   THEN 'CASH'
        WHEN "mode" ILIKE 'cheque%' THEN 'CHEQUE'
        WHEN "mode" ILIKE 'upi%'    THEN 'UPI'
        WHEN "mode" ILIKE 'neft%'   THEN 'NEFT'
        WHEN "mode" ILIKE 'rtgs%'   THEN 'RTGS'
        ELSE "mode"
    END,
    "remarks", "status", "createdAt", "updatedAt"
FROM "public"."Payment"
WHERE "vendorBillId" IS NOT NULL;

-- Remove the now-migrated rows from the generic Payment table to avoid duplicate records.
DELETE FROM "public"."Payment" WHERE "id" IN (SELECT "id" FROM "public"."VendorPayment");

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_vendorBillId_fkey";

-- DropIndex
DROP INDEX "public"."Payment_vendorBillId_idx";

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "vendorBillId";

-- AlterTable
ALTER TABLE "public"."Vendor" DROP COLUMN "accountNumber",
DROP COLUMN "bankName",
DROP COLUMN "ifscCode";
