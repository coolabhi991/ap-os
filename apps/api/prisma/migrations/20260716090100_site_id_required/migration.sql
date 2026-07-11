/*
  Warnings:

  - Made the column `siteId` on table `DailyProgressReport` required. This step will fail if there are existing NULL values in that column.
  - Made the column `siteId` on table `Expense` required. This step will fail if there are existing NULL values in that column.
  - Made the column `siteId` on table `LabourAttendance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `siteId` on table `MeasurementBook` required. This step will fail if there are existing NULL values in that column.
  - Made the column `siteId` on table `RunningBill` required. This step will fail if there are existing NULL values in that column.
  - Made the column `siteId` on table `SubWork` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."DailyProgressReport" DROP CONSTRAINT "DailyProgressReport_siteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Expense" DROP CONSTRAINT "Expense_siteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LabourAttendance" DROP CONSTRAINT "LabourAttendance_siteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MeasurementBook" DROP CONSTRAINT "MeasurementBook_siteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RunningBill" DROP CONSTRAINT "RunningBill_siteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubWork" DROP CONSTRAINT "SubWork_siteId_fkey";

-- AlterTable
ALTER TABLE "public"."DailyProgressReport" ALTER COLUMN "siteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Expense" ALTER COLUMN "siteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."LabourAttendance" ALTER COLUMN "siteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."MeasurementBook" ALTER COLUMN "siteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."RunningBill" ALTER COLUMN "siteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."SubWork" ALTER COLUMN "siteId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."SubWork" ADD CONSTRAINT "SubWork_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyProgressReport" ADD CONSTRAINT "DailyProgressReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabourAttendance" ADD CONSTRAINT "LabourAttendance_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeasurementBook" ADD CONSTRAINT "MeasurementBook_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RunningBill" ADD CONSTRAINT "RunningBill_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
