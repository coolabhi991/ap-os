// Shared "where did this money come from" pointer, reused by every ledger-backed record that can
// be created either directly or by allocating a Bank Transaction (Expense, VendorPayment,
// RunningBillPayment, LiabilityRepayment, LabourPayment, PartnerInvestment, PartnerSettlement).
// Reads through the existing 1:1 `allocation` reverse relation on each of those models — no new
// schema field, since TransactionAllocation -> BankTransaction already holds this data.

export const sourceBankTransactionSelect = {
  id: true,
  transactionDate: true,
  referenceNumber: true,
  deposit: true,
  withdrawal: true,
  companyBankAccountId: true,
  companyBankAccount: { select: { id: true, nickname: true, bankName: true } },
};

type SourceBankTransactionRow = {
  id: string;
  transactionDate: Date;
  referenceNumber: string | null;
  deposit: unknown;
  withdrawal: unknown;
  companyBankAccountId: string;
  companyBankAccount: { id: string; nickname: string | null; bankName: string } | null;
};

export interface SourceBankTransactionDTO {
  id: string;
  transactionDate: string;
  referenceNumber: string;
  amount: string;
  companyBankAccountId: string;
  bankAccountLabel: string;
}

export function toSourceBankTransactionDTO(
  allocation: { bankTransaction: SourceBankTransactionRow } | null | undefined
): SourceBankTransactionDTO | null {
  const txn = allocation?.bankTransaction;
  if (!txn) return null;
  return {
    id: txn.id,
    transactionDate: txn.transactionDate.toISOString().slice(0, 10),
    referenceNumber: txn.referenceNumber ?? "",
    amount: (Number(txn.deposit) > 0 ? txn.deposit : txn.withdrawal)?.toString() ?? "0",
    companyBankAccountId: txn.companyBankAccountId,
    bankAccountLabel: txn.companyBankAccount?.nickname || txn.companyBankAccount?.bankName || "",
  };
}
