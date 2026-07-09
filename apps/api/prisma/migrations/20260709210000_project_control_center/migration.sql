-- CreateEnum
CREATE TYPE "public"."SubWorkStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "subWorkId" TEXT;

-- AlterTable
ALTER TABLE "public"."LabourAttendance" ADD COLUMN     "subWorkId" TEXT;

-- AlterTable
ALTER TABLE "public"."MaterialIssue" ADD COLUMN     "subWorkId" TEXT;

-- AlterTable
ALTER TABLE "public"."VendorBill" ADD COLUMN     "subWorkId" TEXT;

-- CreateTable
CREATE TABLE "public"."SubWork" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budgetAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "public"."SubWorkStatus" NOT NULL DEFAULT 'PLANNED',
    "remarks" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubWork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubWork_companyId_idx" ON "public"."SubWork"("companyId");

-- CreateIndex
CREATE INDEX "SubWork_projectId_idx" ON "public"."SubWork"("projectId");

-- CreateIndex
CREATE INDEX "SubWork_status_idx" ON "public"."SubWork"("status");

-- CreateIndex
CREATE INDEX "Expense_subWorkId_idx" ON "public"."Expense"("subWorkId");

-- CreateIndex
CREATE INDEX "LabourAttendance_subWorkId_idx" ON "public"."LabourAttendance"("subWorkId");

-- CreateIndex
CREATE INDEX "MaterialIssue_subWorkId_idx" ON "public"."MaterialIssue"("subWorkId");

-- CreateIndex
CREATE INDEX "VendorBill_subWorkId_idx" ON "public"."VendorBill"("subWorkId");

-- AddForeignKey
ALTER TABLE "public"."SubWork" ADD CONSTRAINT "SubWork_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubWork" ADD CONSTRAINT "SubWork_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialIssue" ADD CONSTRAINT "MaterialIssue_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAttendance" ADD CONSTRAINT "LabourAttendance_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorBill" ADD CONSTRAINT "VendorBill_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

