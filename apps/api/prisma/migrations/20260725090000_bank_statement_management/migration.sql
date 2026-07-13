-- CreateEnum
CREATE TYPE "public"."BankStatementAuditAction" AS ENUM ('IMPORTED', 'DELETED', 'RESTORED');

-- AlterTable
ALTER TABLE "public"."BankStatementImport" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."BankTransaction" ADD COLUMN     "bankStatementImportId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."BankStatementAuditLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankStatementImportId" TEXT NOT NULL,
    "action" "public"."BankStatementAuditAction" NOT NULL,
    "performedById" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "BankStatementAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankStatementAuditLog_companyId_idx" ON "public"."BankStatementAuditLog"("companyId");

-- CreateIndex
CREATE INDEX "BankStatementAuditLog_bankStatementImportId_idx" ON "public"."BankStatementAuditLog"("bankStatementImportId");

-- CreateIndex
CREATE INDEX "BankStatementImport_isDeleted_idx" ON "public"."BankStatementImport"("isDeleted");

-- CreateIndex
CREATE INDEX "BankTransaction_bankStatementImportId_idx" ON "public"."BankTransaction"("bankStatementImportId");

-- CreateIndex
CREATE INDEX "BankTransaction_isActive_idx" ON "public"."BankTransaction"("isActive");

-- AddForeignKey
ALTER TABLE "public"."BankTransaction" ADD CONSTRAINT "BankTransaction_bankStatementImportId_fkey" FOREIGN KEY ("bankStatementImportId") REFERENCES "public"."BankStatementImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankStatementAuditLog" ADD CONSTRAINT "BankStatementAuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankStatementAuditLog" ADD CONSTRAINT "BankStatementAuditLog_bankStatementImportId_fkey" FOREIGN KEY ("bankStatementImportId") REFERENCES "public"."BankStatementImport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankStatementAuditLog" ADD CONSTRAINT "BankStatementAuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

