-- DropIndex
DROP INDEX "public"."Labour_attendanceStatus_idx";

-- AlterTable
ALTER TABLE "public"."Labour" DROP COLUMN "attendanceStatus",
DROP COLUMN "contractorName",
DROP COLUMN "dailyWage",
DROP COLUMN "overtimeRate",
DROP COLUMN "shift",
ADD COLUMN     "contractorId" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "remarks" TEXT;

-- CreateTable
CREATE TABLE "public"."LabourGroup" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabourGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabourWageRate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "labourId" TEXT NOT NULL,
    "dailyWage" DECIMAL(12,2) NOT NULL,
    "overtimeRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabourWageRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabourAttendance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "labourId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "overtimeHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "dailyWageSnapshot" DECIMAL(12,2) NOT NULL,
    "overtimeRateSnapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "wageAmount" DECIMAL(12,2) NOT NULL,
    "remarks" TEXT,
    "createdById" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabourAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabourAdvance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "labourId" TEXT NOT NULL,
    "projectId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "advanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL,
    "companyBankAccountId" TEXT,
    "remarks" TEXT,
    "createdById" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabourAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabourPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "labourId" TEXT NOT NULL,
    "projectId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodFrom" TIMESTAMP(3),
    "periodTo" TIMESTAMP(3),
    "mode" TEXT NOT NULL,
    "companyBankAccountId" TEXT,
    "expenseId" TEXT,
    "remarks" TEXT,
    "createdById" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabourPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabourGroup_companyId_idx" ON "public"."LabourGroup"("companyId");

-- CreateIndex
CREATE INDEX "LabourGroup_projectId_idx" ON "public"."LabourGroup"("projectId");

-- CreateIndex
CREATE INDEX "LabourWageRate_companyId_idx" ON "public"."LabourWageRate"("companyId");

-- CreateIndex
CREATE INDEX "LabourWageRate_labourId_idx" ON "public"."LabourWageRate"("labourId");

-- CreateIndex
CREATE INDEX "LabourWageRate_effectiveFrom_idx" ON "public"."LabourWageRate"("effectiveFrom");

-- CreateIndex
CREATE INDEX "LabourAttendance_companyId_idx" ON "public"."LabourAttendance"("companyId");

-- CreateIndex
CREATE INDEX "LabourAttendance_projectId_idx" ON "public"."LabourAttendance"("projectId");

-- CreateIndex
CREATE INDEX "LabourAttendance_labourId_idx" ON "public"."LabourAttendance"("labourId");

-- CreateIndex
CREATE INDEX "LabourAttendance_attendanceDate_idx" ON "public"."LabourAttendance"("attendanceDate");

-- CreateIndex
CREATE INDEX "LabourAttendance_isDeleted_idx" ON "public"."LabourAttendance"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "LabourAttendance_labourId_attendanceDate_key" ON "public"."LabourAttendance"("labourId", "attendanceDate");

-- CreateIndex
CREATE INDEX "LabourAdvance_companyId_idx" ON "public"."LabourAdvance"("companyId");

-- CreateIndex
CREATE INDEX "LabourAdvance_labourId_idx" ON "public"."LabourAdvance"("labourId");

-- CreateIndex
CREATE INDEX "LabourAdvance_projectId_idx" ON "public"."LabourAdvance"("projectId");

-- CreateIndex
CREATE INDEX "LabourAdvance_advanceDate_idx" ON "public"."LabourAdvance"("advanceDate");

-- CreateIndex
CREATE INDEX "LabourAdvance_isDeleted_idx" ON "public"."LabourAdvance"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "LabourPayment_expenseId_key" ON "public"."LabourPayment"("expenseId");

-- CreateIndex
CREATE INDEX "LabourPayment_companyId_idx" ON "public"."LabourPayment"("companyId");

-- CreateIndex
CREATE INDEX "LabourPayment_labourId_idx" ON "public"."LabourPayment"("labourId");

-- CreateIndex
CREATE INDEX "LabourPayment_projectId_idx" ON "public"."LabourPayment"("projectId");

-- CreateIndex
CREATE INDEX "LabourPayment_paymentDate_idx" ON "public"."LabourPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "LabourPayment_isDeleted_idx" ON "public"."LabourPayment"("isDeleted");

-- CreateIndex
CREATE INDEX "Labour_contractorId_idx" ON "public"."Labour"("contractorId");

-- CreateIndex
CREATE INDEX "Labour_groupId_idx" ON "public"."Labour"("groupId");

-- CreateIndex
CREATE INDEX "Labour_isDeleted_idx" ON "public"."Labour"("isDeleted");

-- AddForeignKey
ALTER TABLE "public"."Labour" ADD CONSTRAINT "Labour_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Labour" ADD CONSTRAINT "Labour_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."LabourGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Labour" ADD CONSTRAINT "Labour_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourGroup" ADD CONSTRAINT "LabourGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourGroup" ADD CONSTRAINT "LabourGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourWageRate" ADD CONSTRAINT "LabourWageRate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourWageRate" ADD CONSTRAINT "LabourWageRate_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "public"."Labour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAttendance" ADD CONSTRAINT "LabourAttendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAttendance" ADD CONSTRAINT "LabourAttendance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAttendance" ADD CONSTRAINT "LabourAttendance_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "public"."Labour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAttendance" ADD CONSTRAINT "LabourAttendance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAdvance" ADD CONSTRAINT "LabourAdvance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAdvance" ADD CONSTRAINT "LabourAdvance_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "public"."Labour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAdvance" ADD CONSTRAINT "LabourAdvance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAdvance" ADD CONSTRAINT "LabourAdvance_companyBankAccountId_fkey" FOREIGN KEY ("companyBankAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAdvance" ADD CONSTRAINT "LabourAdvance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourPayment" ADD CONSTRAINT "LabourPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourPayment" ADD CONSTRAINT "LabourPayment_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "public"."Labour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourPayment" ADD CONSTRAINT "LabourPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourPayment" ADD CONSTRAINT "LabourPayment_companyBankAccountId_fkey" FOREIGN KEY ("companyBankAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourPayment" ADD CONSTRAINT "LabourPayment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourPayment" ADD CONSTRAINT "LabourPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

