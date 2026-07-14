-- Internal Transfer: structured destination account instead of free-text partyName.
ALTER TABLE "public"."TransactionAllocation" ADD COLUMN "transferToAccountId" TEXT;

CREATE INDEX "TransactionAllocation_transferToAccountId_idx" ON "public"."TransactionAllocation"("transferToAccountId");

ALTER TABLE "public"."TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_transferToAccountId_fkey" FOREIGN KEY ("transferToAccountId") REFERENCES "public"."CompanyBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
