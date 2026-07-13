-- CreateTable
CREATE TABLE "public"."BankStatementMapping" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "bankName" TEXT,
    "dateColumn" INTEGER NOT NULL,
    "descriptionColumn" INTEGER,
    "debitColumn" INTEGER,
    "creditColumn" INTEGER,
    "balanceColumn" INTEGER,
    "referenceColumn" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankStatementMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankStatementMapping_companyId_idx" ON "public"."BankStatementMapping"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "BankStatementMapping_companyId_signature_key" ON "public"."BankStatementMapping"("companyId", "signature");

-- AddForeignKey
ALTER TABLE "public"."BankStatementMapping" ADD CONSTRAINT "BankStatementMapping_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

