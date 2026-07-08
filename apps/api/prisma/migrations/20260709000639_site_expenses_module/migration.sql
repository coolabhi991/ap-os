-- CreateTable
CREATE TABLE "public"."ExpenseCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseCategory_companyId_idx" ON "public"."ExpenseCategory"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_companyId_name_key" ON "public"."ExpenseCategory"("companyId", "name");

-- AddForeignKey
ALTER TABLE "public"."ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataSeed: default expense categories for every existing company. New companies
-- created after this migration must be seeded separately (see expense-category
-- service/README note) since there is no per-company onboarding hook here.
INSERT INTO "public"."ExpenseCategory" ("id", "companyId", "name", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c."id", v.name, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "public"."Company" c
CROSS JOIN (VALUES
    ('Labour'),
    ('Diesel'),
    ('Fuel'),
    ('Vehicle'),
    ('Machinery Rent'),
    ('Food'),
    ('Tea & Snacks'),
    ('Accommodation'),
    ('Travel'),
    ('Material Purchase'),
    ('Transport'),
    ('Site Office'),
    ('Electricity'),
    ('Water'),
    ('Tools'),
    ('Repairs & Maintenance'),
    ('Government Fees'),
    ('Miscellaneous')
) AS v(name);

-- DropForeignKey
ALTER TABLE "public"."Expense" DROP CONSTRAINT "Expense_projectId_fkey";

-- AlterTable (Expense currently has zero rows, so new NOT NULL columns are safe to add directly)
ALTER TABLE "public"."Expense" DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "attachmentFileName" TEXT,
ADD COLUMN     "attachmentFileUrl" TEXT,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "companyBankAccountId" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMode" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT,
ALTER COLUMN "projectId" SET NOT NULL,
ALTER COLUMN "amount" DROP DEFAULT;

-- DropEnum
DROP TYPE "public"."ExpenseType";

-- CreateIndex
CREATE INDEX "Expense_companyId_idx" ON "public"."Expense"("companyId");

-- CreateIndex
CREATE INDEX "Expense_projectId_idx" ON "public"."Expense"("projectId");

-- CreateIndex
CREATE INDEX "Expense_categoryId_idx" ON "public"."Expense"("categoryId");

-- CreateIndex
CREATE INDEX "Expense_vendorId_idx" ON "public"."Expense"("vendorId");

-- CreateIndex
CREATE INDEX "Expense_companyBankAccountId_idx" ON "public"."Expense"("companyBankAccountId");

-- CreateIndex
CREATE INDEX "Expense_paymentMode_idx" ON "public"."Expense"("paymentMode");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "public"."Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Expense_isDeleted_idx" ON "public"."Expense"("isDeleted");

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_companyBankAccountId_fkey" FOREIGN KEY ("companyBankAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
