-- CreateTable
CREATE TABLE "public"."BankStatementImport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyBankAccountId" TEXT NOT NULL,
    "fileName" TEXT,
    "fileHash" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3),
    "periodTo" TIMESTAMP(3),
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "importBatchId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatementImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankStatementImport_companyId_idx" ON "public"."BankStatementImport"("companyId");

-- CreateIndex
CREATE INDEX "BankStatementImport_companyBankAccountId_idx" ON "public"."BankStatementImport"("companyBankAccountId");

-- CreateIndex
CREATE INDEX "BankStatementImport_fileHash_idx" ON "public"."BankStatementImport"("fileHash");

-- AddForeignKey
ALTER TABLE "public"."BankStatementImport" ADD CONSTRAINT "BankStatementImport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankStatementImport" ADD CONSTRAINT "BankStatementImport_companyBankAccountId_fkey" FOREIGN KEY ("companyBankAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankStatementImport" ADD CONSTRAINT "BankStatementImport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

