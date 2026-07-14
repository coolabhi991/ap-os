-- AlterTable
ALTER TABLE "public"."RunningBill" ADD COLUMN     "gstDifferenceAmount" DECIMAL(14,2),
ADD COLUMN     "gstDifferencePercent" DECIMAL(5,2);

