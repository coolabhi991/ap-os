-- DropForeignKey
ALTER TABLE "public"."MaterialIssue" DROP CONSTRAINT "MaterialIssue_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MaterialIssue" DROP CONSTRAINT "MaterialIssue_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."MaterialIssue" DROP COLUMN "issuedBy",
DROP COLUMN "notes",
DROP COLUMN "status",
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "attachmentFileName" TEXT,
ADD COLUMN     "attachmentFileUrl" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "warehouse" TEXT,
ALTER COLUMN "projectId" SET NOT NULL,
ALTER COLUMN "inventoryId" SET NOT NULL,
ALTER COLUMN "quantity" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "MaterialIssue_companyId_idx" ON "public"."MaterialIssue"("companyId");

-- CreateIndex
CREATE INDEX "MaterialIssue_projectId_idx" ON "public"."MaterialIssue"("projectId");

-- CreateIndex
CREATE INDEX "MaterialIssue_inventoryId_idx" ON "public"."MaterialIssue"("inventoryId");

-- CreateIndex
CREATE INDEX "MaterialIssue_issuedDate_idx" ON "public"."MaterialIssue"("issuedDate");

-- CreateIndex
CREATE INDEX "MaterialIssue_isDeleted_idx" ON "public"."MaterialIssue"("isDeleted");

-- AddForeignKey
ALTER TABLE "public"."MaterialIssue" ADD CONSTRAINT "MaterialIssue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialIssue" ADD CONSTRAINT "MaterialIssue_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialIssue" ADD CONSTRAINT "MaterialIssue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

