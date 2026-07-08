-- CreateEnum
CREATE TYPE "public"."VendorBillStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "vendorBillId" TEXT;

-- CreateTable
CREATE TABLE "public"."VendorBill" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "projectId" TEXT,
    "purchaseOrderId" TEXT,
    "materialReceiptId" TEXT,
    "billNumber" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "billAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "invoiceFileName" TEXT,
    "invoiceFileUrl" TEXT,
    "status" "public"."VendorBillStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorBill_billNumber_key" ON "public"."VendorBill"("billNumber");

-- CreateIndex
CREATE INDEX "VendorBill_companyId_idx" ON "public"."VendorBill"("companyId");

-- CreateIndex
CREATE INDEX "VendorBill_vendorId_idx" ON "public"."VendorBill"("vendorId");

-- CreateIndex
CREATE INDEX "VendorBill_projectId_idx" ON "public"."VendorBill"("projectId");

-- CreateIndex
CREATE INDEX "VendorBill_purchaseOrderId_idx" ON "public"."VendorBill"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "VendorBill_materialReceiptId_idx" ON "public"."VendorBill"("materialReceiptId");

-- CreateIndex
CREATE INDEX "VendorBill_status_idx" ON "public"."VendorBill"("status");

-- CreateIndex
CREATE INDEX "VendorBill_dueDate_idx" ON "public"."VendorBill"("dueDate");

-- CreateIndex
CREATE INDEX "Payment_companyId_idx" ON "public"."Payment"("companyId");

-- CreateIndex
CREATE INDEX "Payment_vendorBillId_idx" ON "public"."Payment"("vendorBillId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_vendorBillId_fkey" FOREIGN KEY ("vendorBillId") REFERENCES "public"."VendorBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorBill" ADD CONSTRAINT "VendorBill_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorBill" ADD CONSTRAINT "VendorBill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorBill" ADD CONSTRAINT "VendorBill_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorBill" ADD CONSTRAINT "VendorBill_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorBill" ADD CONSTRAINT "VendorBill_materialReceiptId_fkey" FOREIGN KEY ("materialReceiptId") REFERENCES "public"."MaterialReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
