-- CreateTable
CREATE TABLE "public"."SiteBoqItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "subWorkId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "contractQuantity" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "rate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteBoqItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteBoqItem_companyId_idx" ON "public"."SiteBoqItem"("companyId");

-- CreateIndex
CREATE INDEX "SiteBoqItem_siteId_idx" ON "public"."SiteBoqItem"("siteId");

-- CreateIndex
CREATE INDEX "SiteBoqItem_subWorkId_idx" ON "public"."SiteBoqItem"("subWorkId");

-- AddForeignKey
ALTER TABLE "public"."SiteBoqItem" ADD CONSTRAINT "SiteBoqItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteBoqItem" ADD CONSTRAINT "SiteBoqItem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "public"."Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteBoqItem" ADD CONSTRAINT "SiteBoqItem_subWorkId_fkey" FOREIGN KEY ("subWorkId") REFERENCES "public"."SubWork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SiteBoqItem" ADD CONSTRAINT "SiteBoqItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
