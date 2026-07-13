-- AlterTable
ALTER TABLE "public"."MeasurementBook" ADD COLUMN     "aboveBelowPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Site" ADD COLUMN     "actualCompletionDate" TIMESTAMP(3);

