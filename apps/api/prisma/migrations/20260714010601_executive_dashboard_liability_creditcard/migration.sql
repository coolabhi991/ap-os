-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AllocationType" ADD VALUE 'CLIENT_REFUND';
ALTER TYPE "public"."AllocationType" ADD VALUE 'CREDIT_CARD_BILL_PAYMENT';

-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "liabilityId" TEXT;

-- CreateTable
CREATE TABLE "public"."WorkOrderExtension" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "extensionOrderNumber" TEXT NOT NULL,
    "extensionOrderDate" TIMESTAMP(3) NOT NULL,
    "previousCompletionDate" TIMESTAMP(3) NOT NULL,
    "newCompletionDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "remarks" TEXT,
    "letterFileName" TEXT,
    "letterFilePath" TEXT,
    "letterMimeType" TEXT,
    "letterFileSizeBytes" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderExtension_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrderExtension_companyId_idx" ON "public"."WorkOrderExtension"("companyId");

-- CreateIndex
CREATE INDEX "WorkOrderExtension_siteId_idx" ON "public"."WorkOrderExtension"("siteId");

-- CreateIndex
CREATE INDEX "Expense_liabilityId_idx" ON "public"."Expense"("liabilityId");

-- AddForeignKey
ALTER TABLE "public"."WorkOrderExtension" ADD CONSTRAINT "WorkOrderExtension_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderExtension" ADD CONSTRAINT "WorkOrderExtension_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderExtension" ADD CONSTRAINT "WorkOrderExtension_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "public"."Liability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

