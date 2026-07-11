-- CreateTable
CREATE TABLE "public"."MBEmailLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "measurementBookId" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "includedExcel" BOOLEAN NOT NULL DEFAULT false,
    "sentById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,

    CONSTRAINT "MBEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MBEmailLog_companyId_idx" ON "public"."MBEmailLog"("companyId");

-- CreateIndex
CREATE INDEX "MBEmailLog_measurementBookId_idx" ON "public"."MBEmailLog"("measurementBookId");

-- AddForeignKey
ALTER TABLE "public"."MBEmailLog" ADD CONSTRAINT "MBEmailLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MBEmailLog" ADD CONSTRAINT "MBEmailLog_measurementBookId_fkey" FOREIGN KEY ("measurementBookId") REFERENCES "public"."MeasurementBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MBEmailLog" ADD CONSTRAINT "MBEmailLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

