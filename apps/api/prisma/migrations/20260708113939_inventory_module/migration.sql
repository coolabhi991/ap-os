-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('CONTRACT', 'DRAWING', 'INVOICE', 'PHOTO', 'REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExpenseType" AS ENUM ('MATERIAL', 'LABOUR', 'EQUIPMENT', 'OVERHEAD', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('OPENING', 'RECEIPT', 'ISSUE', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "public"."Client" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Equipment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Inventory" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "itemCode" TEXT,
ADD COLUMN     "lastIssueDate" TIMESTAMP(3),
ADD COLUMN     "lastReceiptDate" TIMESTAMP(3),
ADD COLUMN     "maxStock" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "minStock" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rackLocation" TEXT,
ADD COLUMN     "reorderLevel" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "reservedStock" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "warehouse" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Labour" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."MaterialIssue" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."MaterialReceipt" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."MeasurementBook" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Project" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."ProjectType" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."PurchaseRequisition" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Role" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."RunningBill" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Vendor" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."StockLedgerEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "projectId" TEXT,
    "movementType" "public"."StockMovementType" NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "referenceNumber" TEXT,
    "remarks" TEXT,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "vendorId" TEXT,
    "expenseNumber" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "public"."ExpenseType" NOT NULL DEFAULT 'OTHER',
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "vendorId" TEXT,
    "purchaseOrderId" TEXT,
    "expenseId" TEXT,
    "paymentNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "mode" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "clientId" TEXT,
    "vendorId" TEXT,
    "purchaseOrderId" TEXT,
    "purchaseRequisitionId" TEXT,
    "materialReceiptId" TEXT,
    "documentType" "public"."DocumentType" NOT NULL DEFAULT 'OTHER',
    "documentNumber" TEXT NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "notes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockLedgerEntry_companyId_idx" ON "public"."StockLedgerEntry"("companyId");

-- CreateIndex
CREATE INDEX "StockLedgerEntry_inventoryId_idx" ON "public"."StockLedgerEntry"("inventoryId");

-- CreateIndex
CREATE INDEX "StockLedgerEntry_movementType_idx" ON "public"."StockLedgerEntry"("movementType");

-- CreateIndex
CREATE INDEX "StockLedgerEntry_movementDate_idx" ON "public"."StockLedgerEntry"("movementDate");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_expenseNumber_key" ON "public"."Expense"("expenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "public"."Payment"("paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Document_documentNumber_key" ON "public"."Document"("documentNumber");

-- CreateIndex
CREATE INDEX "Inventory_companyId_idx" ON "public"."Inventory"("companyId");

-- CreateIndex
CREATE INDEX "Inventory_projectId_idx" ON "public"."Inventory"("projectId");

-- CreateIndex
CREATE INDEX "Inventory_status_idx" ON "public"."Inventory"("status");

-- CreateIndex
CREATE INDEX "Inventory_category_idx" ON "public"."Inventory"("category");

-- CreateIndex
CREATE INDEX "Inventory_itemCode_idx" ON "public"."Inventory"("itemCode");

-- CreateIndex
CREATE INDEX "Inventory_warehouse_idx" ON "public"."Inventory"("warehouse");

-- CreateIndex
CREATE INDEX "Inventory_supplierId_idx" ON "public"."Inventory"("supplierId");

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLedgerEntry" ADD CONSTRAINT "StockLedgerEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLedgerEntry" ADD CONSTRAINT "StockLedgerEntry_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLedgerEntry" ADD CONSTRAINT "StockLedgerEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_purchaseRequisitionId_fkey" FOREIGN KEY ("purchaseRequisitionId") REFERENCES "public"."PurchaseRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_materialReceiptId_fkey" FOREIGN KEY ("materialReceiptId") REFERENCES "public"."MaterialReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
