-- Category master gains allocationType (Business Review Note): each Category now belongs to
-- exactly one Transaction/Allocation Type. Existing rows default to SITE_EXPENSE, preserving
-- every current Expense category unchanged.
ALTER TABLE "public"."ExpenseCategory" ADD COLUMN "allocationType" "public"."AllocationType" NOT NULL DEFAULT 'SITE_EXPENSE';

CREATE INDEX "ExpenseCategory_allocationType_idx" ON "public"."ExpenseCategory"("allocationType");

-- Uniqueness moves from (companyId, name) to (companyId, allocationType, name) — the same name
-- can now exist once per Transaction Type (e.g. "Other" under both Bank Charges and TDS Payment).
DROP INDEX "public"."ExpenseCategory_companyId_name_key";
CREATE UNIQUE INDEX "ExpenseCategory_companyId_allocationType_name_key" ON "public"."ExpenseCategory"("companyId", "allocationType", "name");

-- TransactionAllocation gains an optional categoryId — straight pass-through pointer for the
-- tag-only allocation types (GST/TDS_PAYMENT/BANK_CHARGES/OTHER/OFFICE_EXPENSE/LOAN/
-- INTEREST_INCOME) that have no other field to hang a category off. SITE_EXPENSE continues to
-- use Expense.categoryId unchanged.
ALTER TABLE "public"."TransactionAllocation" ADD COLUMN "categoryId" TEXT;

CREATE INDEX "TransactionAllocation_categoryId_idx" ON "public"."TransactionAllocation"("categoryId");

ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
