-- CreateEnum
CREATE TYPE "public"."Shift" AS ENUM ('DAY', 'NIGHT');

-- CreateEnum
CREATE TYPE "public"."VisitorType" AS ENUM ('EXECUTIVE_ENGINEER', 'DEPUTY_ENGINEER', 'ASSISTANT_ENGINEER', 'JUNIOR_ENGINEER', 'CONSULTANT', 'CLIENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."SiteProblemType" AS ENUM ('RAIN', 'LABOUR_SHORTAGE', 'MATERIAL_SHORTAGE', 'MACHINERY_BREAKDOWN', 'DRAWING_PENDING', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."DocumentType" ADD VALUE 'PROGRESS_PHOTO';
ALTER TYPE "public"."DocumentType" ADD VALUE 'SITE_PHOTO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LabourCategory" ADD VALUE 'SUPERVISOR';
ALTER TYPE "public"."LabourCategory" ADD VALUE 'OPERATOR';

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "dprId" TEXT;

-- CreateTable
CREATE TABLE "public"."DailyProgressReport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subWorkId" TEXT,
    "dprNumber" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "site" TEXT,
    "engineerId" TEXT,
    "contractorId" TEXT,
    "weather" TEXT,
    "shift" "public"."Shift" NOT NULL DEFAULT 'DAY',
    "remarks" TEXT,
    "workDone" TEXT,
    "plannedWork" TEXT,
    "physicalProgressUpdate" INTEGER,
    "delayReason" TEXT,
    "instructions" TEXT,
    "labourSkilled" INTEGER NOT NULL DEFAULT 0,
    "labourUnskilled" INTEGER NOT NULL DEFAULT 0,
    "labourSupervisor" INTEGER NOT NULL DEFAULT 0,
    "labourOperator" INTEGER NOT NULL DEFAULT 0,
    "labourManuallyAdjusted" BOOLEAN NOT NULL DEFAULT false,
    "manualMachineryEntries" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyProgressReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DPRVisitor" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dprId" TEXT NOT NULL,
    "visitorType" "public"."VisitorType" NOT NULL,
    "name" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DPRVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DPRSiteProblem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dprId" TEXT NOT NULL,
    "problemType" "public"."SiteProblemType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DPRSiteProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DPREmailLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dprId" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "includedExcel" BOOLEAN NOT NULL DEFAULT false,
    "sentById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,

    CONSTRAINT "DPREmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyProgressReport_dprNumber_key" ON "public"."DailyProgressReport"("dprNumber");

-- CreateIndex
CREATE INDEX "DailyProgressReport_companyId_idx" ON "public"."DailyProgressReport"("companyId");

-- CreateIndex
CREATE INDEX "DailyProgressReport_projectId_idx" ON "public"."DailyProgressReport"("projectId");

-- CreateIndex
CREATE INDEX "DailyProgressReport_subWorkId_idx" ON "public"."DailyProgressReport"("subWorkId");

-- CreateIndex
CREATE INDEX "DailyProgressReport_reportDate_idx" ON "public"."DailyProgressReport"("reportDate");

-- CreateIndex
CREATE INDEX "DailyProgressReport_isDeleted_idx" ON "public"."DailyProgressReport"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "DailyProgressReport_companyId_projectId_reportDate_shift_key" ON "public"."DailyProgressReport"("companyId", "projectId", "reportDate", "shift");

-- CreateIndex
CREATE INDEX "DPRVisitor_companyId_idx" ON "public"."DPRVisitor"("companyId");

-- CreateIndex
CREATE INDEX "DPRVisitor_dprId_idx" ON "public"."DPRVisitor"("dprId");

-- CreateIndex
CREATE INDEX "DPRSiteProblem_companyId_idx" ON "public"."DPRSiteProblem"("companyId");

-- CreateIndex
CREATE INDEX "DPRSiteProblem_dprId_idx" ON "public"."DPRSiteProblem"("dprId");

-- CreateIndex
CREATE INDEX "DPREmailLog_companyId_idx" ON "public"."DPREmailLog"("companyId");

-- CreateIndex
CREATE INDEX "DPREmailLog_dprId_idx" ON "public"."DPREmailLog"("dprId");

-- CreateIndex
CREATE INDEX "Document_companyId_idx" ON "public"."Document"("companyId");

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "public"."Document"("projectId");

-- CreateIndex
CREATE INDEX "Document_dprId_idx" ON "public"."Document"("dprId");

-- AddForeignKey
ALTER TABLE "public"."DailyProgressReport" ADD CONSTRAINT "DailyProgressReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyProgressReport" ADD CONSTRAINT "DailyProgressReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyProgressReport" ADD CONSTRAINT "DailyProgressReport_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyProgressReport" ADD CONSTRAINT "DailyProgressReport_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyProgressReport" ADD CONSTRAINT "DailyProgressReport_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyProgressReport" ADD CONSTRAINT "DailyProgressReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DPRVisitor" ADD CONSTRAINT "DPRVisitor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DPRVisitor" ADD CONSTRAINT "DPRVisitor_dprId_fkey" FOREIGN KEY ("dprId") REFERENCES "public"."DailyProgressReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DPRSiteProblem" ADD CONSTRAINT "DPRSiteProblem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DPRSiteProblem" ADD CONSTRAINT "DPRSiteProblem_dprId_fkey" FOREIGN KEY ("dprId") REFERENCES "public"."DailyProgressReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DPREmailLog" ADD CONSTRAINT "DPREmailLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DPREmailLog" ADD CONSTRAINT "DPREmailLog_dprId_fkey" FOREIGN KEY ("dprId") REFERENCES "public"."DailyProgressReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DPREmailLog" ADD CONSTRAINT "DPREmailLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_dprId_fkey" FOREIGN KEY ("dprId") REFERENCES "public"."DailyProgressReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

