-- CreateEnum
CREATE TYPE "public"."SiteType" AS ENUM ('OWN_SITE', 'PARTNERSHIP_SITE', 'AGENCY_SITE');

-- CreateEnum
CREATE TYPE "public"."SiteVisitStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."DailyProgressReport" ADD COLUMN     "siteId" TEXT;

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "siteId" TEXT;

-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "siteId" TEXT;

-- AlterTable
ALTER TABLE "public"."LabourAttendance" ADD COLUMN     "siteId" TEXT;

-- AlterTable
ALTER TABLE "public"."MeasurementBook" ADD COLUMN     "siteId" TEXT;

-- AlterTable
ALTER TABLE "public"."RunningBill" ADD COLUMN     "siteId" TEXT;

-- AlterTable
ALTER TABLE "public"."SubWork" ADD COLUMN     "siteId" TEXT;

-- CreateTable
CREATE TABLE "public"."Site" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "village" TEXT,
    "taluka" TEXT,
    "district" TEXT,
    "engineer" TEXT,
    "siteType" "public"."SiteType" NOT NULL DEFAULT 'OWN_SITE',
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "contractValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "emdValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "securityDeposit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "performanceGuarantee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "workOrderDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SiteRecapRevision" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,
    "notes" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteRecapRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SiteVisit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitedBy" TEXT,
    "purpose" TEXT,
    "remarks" TEXT,
    "photos" JSONB,
    "status" "public"."SiteVisitStatus" NOT NULL DEFAULT 'PLANNED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Site_companyId_idx" ON "public"."Site"("companyId");

-- CreateIndex
CREATE INDEX "Site_projectId_idx" ON "public"."Site"("projectId");

-- CreateIndex
CREATE INDEX "Site_status_idx" ON "public"."Site"("status");

-- CreateIndex
CREATE INDEX "SiteRecapRevision_companyId_idx" ON "public"."SiteRecapRevision"("companyId");

-- CreateIndex
CREATE INDEX "SiteRecapRevision_siteId_idx" ON "public"."SiteRecapRevision"("siteId");

-- CreateIndex
CREATE INDEX "SiteRecapRevision_isCurrent_idx" ON "public"."SiteRecapRevision"("isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "SiteRecapRevision_siteId_revisionNo_key" ON "public"."SiteRecapRevision"("siteId", "revisionNo");

-- CreateIndex
CREATE INDEX "SiteVisit_companyId_idx" ON "public"."SiteVisit"("companyId");

-- CreateIndex
CREATE INDEX "SiteVisit_siteId_idx" ON "public"."SiteVisit"("siteId");

-- CreateIndex
CREATE INDEX "SiteVisit_status_idx" ON "public"."SiteVisit"("status");

-- CreateIndex
CREATE INDEX "SiteVisit_visitDate_idx" ON "public"."SiteVisit"("visitDate");

-- CreateIndex
CREATE INDEX "DailyProgressReport_siteId_idx" ON "public"."DailyProgressReport"("siteId");

-- CreateIndex
CREATE INDEX "Document_siteId_idx" ON "public"."Document"("siteId");

-- CreateIndex
CREATE INDEX "Expense_siteId_idx" ON "public"."Expense"("siteId");

-- CreateIndex
CREATE INDEX "LabourAttendance_siteId_idx" ON "public"."LabourAttendance"("siteId");

-- CreateIndex
CREATE INDEX "MeasurementBook_siteId_idx" ON "public"."MeasurementBook"("siteId");

-- CreateIndex
CREATE INDEX "RunningBill_siteId_idx" ON "public"."RunningBill"("siteId");

-- CreateIndex
CREATE INDEX "SubWork_siteId_idx" ON "public"."SubWork"("siteId");

-- AddForeignKey
ALTER TABLE "public"."Site" ADD CONSTRAINT "Site_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Site" ADD CONSTRAINT "Site_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteRecapRevision" ADD CONSTRAINT "SiteRecapRevision_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteRecapRevision" ADD CONSTRAINT "SiteRecapRevision_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteRecapRevision" ADD CONSTRAINT "SiteRecapRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteVisit" ADD CONSTRAINT "SiteVisit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteVisit" ADD CONSTRAINT "SiteVisit_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteVisit" ADD CONSTRAINT "SiteVisit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubWork" ADD CONSTRAINT "SubWork_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyProgressReport" ADD CONSTRAINT "DailyProgressReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAttendance" ADD CONSTRAINT "LabourAttendance_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementBook" ADD CONSTRAINT "MeasurementBook_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBill" ADD CONSTRAINT "RunningBill_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
