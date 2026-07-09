-- AlterTable
ALTER TABLE "public"."SubWork" ADD COLUMN     "physicalProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progressUpdatedAt" TIMESTAMP(3);

