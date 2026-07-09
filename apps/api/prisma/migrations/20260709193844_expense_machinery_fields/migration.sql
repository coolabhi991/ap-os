-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "machineHours" DECIMAL(10,2),
ADD COLUMN     "machineRatePerHour" DECIMAL(12,2),
ADD COLUMN     "machineType" TEXT;

-- CreateIndex
CREATE INDEX "Expense_machineType_idx" ON "public"."Expense"("machineType");

-- DataSeed: add the "Machinery" expense category for every existing company that
-- doesn't already have one (matches the seeding approach used for the original
-- 18 default categories). New companies created after this migration still need
-- to add it manually (no per-company onboarding hook exists for this yet).
INSERT INTO "public"."ExpenseCategory" ("id", "companyId", "name", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c."id", 'Machinery', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "public"."Company" c
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."ExpenseCategory" ec WHERE ec."companyId" = c."id" AND ec."name" = 'Machinery'
);
