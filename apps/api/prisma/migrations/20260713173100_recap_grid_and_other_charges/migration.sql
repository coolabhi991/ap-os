-- AlterTable
ALTER TABLE "public"."RecapitulationItem" ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "public"."SiteRecapRevision" ADD COLUMN     "labourCessCharges" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "msebCharges" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otherChargesTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otherRecoveries" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "royaltyCharges" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "testingCharges" DECIMAL(14,2) NOT NULL DEFAULT 0;

