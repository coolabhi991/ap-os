import prisma from "../config/prisma.js";
import { Prisma, ReconciliationStatus, BankTransactionSource } from "@prisma/client";

/**
 * Banking & Reconciliation. BankTransaction is the bank/cash statement ledger — it never
 * duplicates the amount already recorded on a RunningBillPayment/VendorPayment/Expense; it
 * only links to them (runningBillPaymentId/vendorPaymentId) once reconciled. Current Balance
 * for a CompanyBankAccount is always openingBalance + sum(deposit) - sum(withdrawal) over this
 * table, computed on demand — never stored, matching the "derive, don't store" convention
 * already used for SubWork budgets.
 */

export const RECONCILIATION_STATUSES = ["UNMATCHED", "PARTIALLY_MATCHED", "MATCHED"];
export const RECONCILIATION_STATUS_LABELS: Record<string, string> = {
  UNMATCHED: "Unmatched",
  PARTIALLY_MATCHED: "Partially Matched",
  MATCHED: "Matched",
};

export const BANK_TRANSACTION_SOURCES = ["MANUAL", "IMPORTED"];

const AMOUNT_TOLERANCE = 0.01;
const MATCH_WINDOW_DAYS = 7;

export interface BankTransactionFormInput {
  companyBankAccountId: string;
  transactionDate: string;
  deposit?: number;
  withdrawal?: number;
  referenceNumber?: string;
  description?: string;
  category?: string;
  projectId?: string;
  runningBillPaymentId?: string;
  vendorPaymentId?: string;
}

export interface BankTransactionListQuery {
  search?: string;
  companyBankAccountId?: string;
  projectId?: string;
  reconciliationStatus?: string;
  source?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ImportRowInput {
  transactionDate: string;
  deposit?: number;
  withdrawal?: number;
  referenceNumber?: string;
  description?: string;
  category?: string;
}

export interface ImportBankTransactionsInput {
  companyBankAccountId: string;
  rows: ImportRowInput[];
}

export interface MatchBankTransactionInput {
  runningBillPaymentId?: string;
  vendorPaymentId?: string;
}

function autoImportBatchId(): string {
  return `IMP-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function withinDays(a: Date, b: Date, days: number) {
  return Math.abs(a.getTime() - b.getTime()) <= days * 24 * 60 * 60 * 1000;
}

const include = {
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true, accountType: true } },
  project: { select: { id: true, name: true } },
  runningBillPayment: { select: { id: true, paymentNumber: true, amount: true, paymentDate: true, runningBill: { select: { id: true, billNumber: true } } } },
  vendorPayment: {
    select: { id: true, paymentNumber: true, amount: true, paymentDate: true, vendor: { select: { id: true, name: true } }, vendorBill: { select: { id: true, billNumber: true } } },
  },
  createdBy: { select: { id: true, name: true } },
};

type BankTransactionRow = Prisma.BankTransactionGetPayload<{ include: typeof include }>;

function toDTO(t: BankTransactionRow) {
  return {
    id: t.id,
    companyId: t.companyId,
    companyBankAccountId: t.companyBankAccountId,
    companyBankAccount: t.companyBankAccount,
    transactionDate: t.transactionDate.toISOString().slice(0, 10),
    deposit: t.deposit.toString(),
    withdrawal: t.withdrawal.toString(),
    referenceNumber: t.referenceNumber ?? "",
    description: t.description ?? "",
    category: t.category ?? "",
    projectId: t.projectId ?? "",
    project: t.project,
    runningBillPaymentId: t.runningBillPaymentId ?? "",
    runningBillPayment: t.runningBillPayment
      ? {
          id: t.runningBillPayment.id,
          paymentNumber: t.runningBillPayment.paymentNumber,
          amount: t.runningBillPayment.amount.toString(),
          paymentDate: t.runningBillPayment.paymentDate.toISOString().slice(0, 10),
          billNumber: t.runningBillPayment.runningBill.billNumber,
        }
      : null,
    vendorPaymentId: t.vendorPaymentId ?? "",
    vendorPayment: t.vendorPayment
      ? {
          id: t.vendorPayment.id,
          paymentNumber: t.vendorPayment.paymentNumber,
          amount: t.vendorPayment.amount.toString(),
          paymentDate: t.vendorPayment.paymentDate.toISOString().slice(0, 10),
          vendor: t.vendorPayment.vendor.name,
          billNumber: t.vendorPayment.vendorBill.billNumber,
        }
      : null,
    reconciliationStatus: t.reconciliationStatus,
    source: t.source,
    importBatchId: t.importBatchId ?? "",
    createdById: t.createdById,
    createdBy: t.createdBy,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function listBankAccountsWithBalances(companyId: string) {
  const accounts = await prisma.companyBankAccount.findMany({ where: { companyId }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] });

  const sums = await prisma.bankTransaction.groupBy({
    by: ["companyBankAccountId"],
    where: { companyId },
    _sum: { deposit: true, withdrawal: true },
    _count: { _all: true },
  });
  const sumsByAccount = new Map(sums.map((s) => [s.companyBankAccountId, s]));

  return accounts.map((a) => {
    const s = sumsByAccount.get(a.id);
    const totalDeposits = Number(s?._sum.deposit ?? 0);
    const totalWithdrawals = Number(s?._sum.withdrawal ?? 0);
    const currentBalance = Number(a.openingBalance) + totalDeposits - totalWithdrawals;
    return {
      id: a.id,
      nickname: a.nickname ?? "",
      beneficiaryName: a.beneficiaryName ?? "",
      bankName: a.bankName,
      accountNumber: a.accountNumber,
      accountType: a.accountType,
      isPrimary: a.isPrimary,
      isActive: a.isActive,
      openingBalance: a.openingBalance.toString(),
      totalDeposits: totalDeposits.toFixed(2),
      totalWithdrawals: totalWithdrawals.toFixed(2),
      currentBalance: currentBalance.toFixed(2),
      transactionCount: s?._count._all ?? 0,
    };
  });
}

export async function listBankTransactions(companyId: string, query: BankTransactionListQuery) {
  const { search = "", companyBankAccountId, projectId, reconciliationStatus, source, fromDate, toDate, page = 1, limit = 20, sortBy = "transactionDate", sortOrder = "desc" } = query;

  const where: Prisma.BankTransactionWhereInput = {
    companyId,
    ...(companyBankAccountId && { companyBankAccountId }),
    ...(projectId && { projectId }),
    ...(reconciliationStatus && RECONCILIATION_STATUSES.includes(reconciliationStatus.toUpperCase()) && { reconciliationStatus: reconciliationStatus.toUpperCase() as ReconciliationStatus }),
    ...(source && BANK_TRANSACTION_SOURCES.includes(source.toUpperCase()) && { source: source.toUpperCase() as BankTransactionSource }),
    ...(fromDate || toDate ? { transactionDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } } : {}),
    ...(search && {
      OR: [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowed = ["transactionDate", "deposit", "withdrawal", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "transactionDate";
  const skip = (Math.max(1, page) - 1) * Math.min(200, limit);
  const take = Math.min(200, limit);

  const [total, transactions] = await Promise.all([
    prisma.bankTransaction.count({ where }),
    prisma.bankTransaction.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: transactions.map(toDTO) };
}

export async function getBankTransactionById(id: string, companyId: string) {
  const txn = await prisma.bankTransaction.findFirst({ where: { id, companyId }, include });
  if (!txn) throw new Error("Bank Transaction not found");
  return toDTO(txn);
}

function validateAmounts(deposit: number, withdrawal: number) {
  if (!Number.isFinite(deposit) || !Number.isFinite(withdrawal) || deposit < 0 || withdrawal < 0) {
    throw new Error("Deposit and Withdrawal must be numbers greater than or equal to zero");
  }
  if (deposit === 0 && withdrawal === 0) throw new Error("Either Deposit or Withdrawal must be greater than zero");
  if (deposit > 0 && withdrawal > 0) throw new Error("A single transaction cannot be both a Deposit and a Withdrawal");
}

async function resolveMatch(
  companyId: string,
  input: { runningBillPaymentId?: string; vendorPaymentId?: string },
  deposit: number,
  withdrawal: number,
  excludeTransactionId?: string
) {
  let runningBillPaymentId: string | null = null;
  let vendorPaymentId: string | null = null;
  let reconciliationStatus: ReconciliationStatus = "UNMATCHED";

  if (input.runningBillPaymentId) {
    const payment = await prisma.runningBillPayment.findFirst({ where: { id: input.runningBillPaymentId, companyId } });
    if (!payment) throw new Error("Running Bill Payment not found");
    const clash = await prisma.bankTransaction.findFirst({ where: { runningBillPaymentId: payment.id, ...(excludeTransactionId && { id: { not: excludeTransactionId } }) } });
    if (clash) throw new Error("This Running Bill Payment is already matched to another Bank Transaction");
    runningBillPaymentId = payment.id;
    reconciliationStatus = Math.abs(Number(payment.amount) - deposit) <= AMOUNT_TOLERANCE ? "MATCHED" : "PARTIALLY_MATCHED";
  }

  if (input.vendorPaymentId) {
    const payment = await prisma.vendorPayment.findFirst({ where: { id: input.vendorPaymentId, companyId } });
    if (!payment) throw new Error("Vendor Payment not found");
    const clash = await prisma.bankTransaction.findFirst({ where: { vendorPaymentId: payment.id, ...(excludeTransactionId && { id: { not: excludeTransactionId } }) } });
    if (clash) throw new Error("This Vendor Payment is already matched to another Bank Transaction");
    vendorPaymentId = payment.id;
    reconciliationStatus = Math.abs(Number(payment.amount) - withdrawal) <= AMOUNT_TOLERANCE ? "MATCHED" : "PARTIALLY_MATCHED";
  }

  return { runningBillPaymentId, vendorPaymentId, reconciliationStatus };
}

export async function createBankTransaction(companyId: string, createdById: string, input: BankTransactionFormInput) {
  if (!input.companyBankAccountId?.trim()) throw new Error("Bank account is required");
  if (!input.transactionDate) throw new Error("Transaction date is required");

  const account = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
  if (!account) throw new Error("Company bank account not found");

  const deposit = Number(input.deposit) || 0;
  const withdrawal = Number(input.withdrawal) || 0;
  validateAmounts(deposit, withdrawal);

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

  const match = await resolveMatch(companyId, input, deposit, withdrawal);

  const txn = await prisma.bankTransaction.create({
    data: {
      companyId,
      companyBankAccountId: account.id,
      transactionDate: new Date(input.transactionDate),
      deposit,
      withdrawal,
      referenceNumber: input.referenceNumber || null,
      description: input.description || null,
      category: input.category || null,
      projectId: input.projectId || null,
      ...match,
      source: "MANUAL",
      createdById,
    },
    include,
  });

  return toDTO(txn);
}

export async function updateBankTransaction(id: string, companyId: string, input: Partial<BankTransactionFormInput>) {
  const existing = await prisma.bankTransaction.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Bank Transaction not found");

  const deposit = input.deposit !== undefined ? Number(input.deposit) || 0 : Number(existing.deposit);
  const withdrawal = input.withdrawal !== undefined ? Number(input.withdrawal) || 0 : Number(existing.withdrawal);
  validateAmounts(deposit, withdrawal);

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

  const relinking = input.runningBillPaymentId !== undefined || input.vendorPaymentId !== undefined;
  const match = relinking
    ? await resolveMatch(companyId, input, deposit, withdrawal, id)
    : { runningBillPaymentId: existing.runningBillPaymentId, vendorPaymentId: existing.vendorPaymentId, reconciliationStatus: existing.reconciliationStatus };

  const txn = await prisma.bankTransaction.update({
    where: { id },
    data: {
      transactionDate: input.transactionDate ? new Date(input.transactionDate) : existing.transactionDate,
      deposit,
      withdrawal,
      referenceNumber: input.referenceNumber !== undefined ? input.referenceNumber || null : existing.referenceNumber,
      description: input.description !== undefined ? input.description || null : existing.description,
      category: input.category !== undefined ? input.category || null : existing.category,
      projectId: input.projectId !== undefined ? input.projectId || null : existing.projectId,
      ...match,
    },
    include,
  });

  return toDTO(txn);
}

export async function deleteBankTransaction(id: string, companyId: string) {
  const existing = await prisma.bankTransaction.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Bank Transaction not found");
  await prisma.bankTransaction.delete({ where: { id } });
}

/** Manually links (or re-links) a transaction to a Running Bill Payment or a Vendor Payment. */
export async function matchBankTransaction(id: string, companyId: string, input: MatchBankTransactionInput) {
  if (!input.runningBillPaymentId && !input.vendorPaymentId) {
    throw new Error("Provide either a Running Bill Payment or a Vendor Payment to match against");
  }
  const existing = await prisma.bankTransaction.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Bank Transaction not found");

  const match = await resolveMatch(companyId, input, Number(existing.deposit), Number(existing.withdrawal), id);
  const txn = await prisma.bankTransaction.update({
    where: { id },
    data: { runningBillPaymentId: match.runningBillPaymentId, vendorPaymentId: match.vendorPaymentId, reconciliationStatus: match.reconciliationStatus },
    include,
  });
  return toDTO(txn);
}

export async function unmatchBankTransaction(id: string, companyId: string) {
  const existing = await prisma.bankTransaction.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Bank Transaction not found");

  const txn = await prisma.bankTransaction.update({
    where: { id },
    data: { runningBillPaymentId: null, vendorPaymentId: null, reconciliationStatus: "UNMATCHED" },
    include,
  });
  return toDTO(txn);
}

/**
 * Auto Reconciliation: Running Bill Receipts -> Bank Deposits, Vendor Payments -> Bank
 * Withdrawals. Matches by same bank account + amount (exact -> MATCHED, else closest within
 * a 7-day window -> PARTIALLY_MATCHED) against payments not already linked to any transaction.
 * Never touches an already-matched transaction or re-uses an already-linked payment.
 */
export async function autoReconcile(companyId: string, companyBankAccountId?: string) {
  const transactions = await prisma.bankTransaction.findMany({
    where: { companyId, reconciliationStatus: "UNMATCHED", ...(companyBankAccountId && { companyBankAccountId }) },
    orderBy: { transactionDate: "asc" },
  });

  let matched = 0;
  let partiallyMatched = 0;

  for (const txn of transactions) {
    if (Number(txn.deposit) > 0) {
      const candidates = await prisma.runningBillPayment.findMany({
        where: { companyId, companyBankAccountId: txn.companyBankAccountId, mode: { not: "CASH" }, bankTransaction: null },
      });
      const inWindow = candidates.filter((c) => withinDays(c.paymentDate, txn.transactionDate, MATCH_WINDOW_DAYS));
      if (!inWindow.length) continue;

      const exact = inWindow.find((c) => Math.abs(Number(c.amount) - Number(txn.deposit)) <= AMOUNT_TOLERANCE);
      const best = exact ?? inWindow.sort((a, b) => Math.abs(Number(a.amount) - Number(txn.deposit)) - Math.abs(Number(b.amount) - Number(txn.deposit)))[0];

      await prisma.bankTransaction.update({
        where: { id: txn.id },
        data: { runningBillPaymentId: best.id, reconciliationStatus: exact ? "MATCHED" : "PARTIALLY_MATCHED" },
      });
      if (exact) matched++;
      else partiallyMatched++;
    } else if (Number(txn.withdrawal) > 0) {
      const candidates = await prisma.vendorPayment.findMany({
        where: { companyId, companyBankAccountId: txn.companyBankAccountId, mode: { not: "CASH" }, bankTransaction: null },
      });
      const inWindow = candidates.filter((c) => withinDays(c.paymentDate, txn.transactionDate, MATCH_WINDOW_DAYS));
      if (!inWindow.length) continue;

      const exact = inWindow.find((c) => Math.abs(Number(c.amount) - Number(txn.withdrawal)) <= AMOUNT_TOLERANCE);
      const best = exact ?? inWindow.sort((a, b) => Math.abs(Number(a.amount) - Number(txn.withdrawal)) - Math.abs(Number(b.amount) - Number(txn.withdrawal)))[0];

      await prisma.bankTransaction.update({
        where: { id: txn.id },
        data: { vendorPaymentId: best.id, reconciliationStatus: exact ? "MATCHED" : "PARTIALLY_MATCHED" },
      });
      if (exact) matched++;
      else partiallyMatched++;
    }
  }

  return { scanned: transactions.length, matched, partiallyMatched, stillUnmatched: transactions.length - matched - partiallyMatched };
}

export async function listUnmatchedRunningBillPayments(companyId: string, companyBankAccountId?: string) {
  const payments = await prisma.runningBillPayment.findMany({
    where: { companyId, mode: { not: "CASH" }, bankTransaction: null, ...(companyBankAccountId && { companyBankAccountId }) },
    include: { runningBill: { select: { id: true, billNumber: true } }, project: { select: { id: true, name: true } } },
    orderBy: { paymentDate: "desc" },
  });
  return payments.map((p) => ({
    id: p.id,
    paymentNumber: p.paymentNumber,
    paymentDate: p.paymentDate.toISOString().slice(0, 10),
    amount: p.amount.toString(),
    billNumber: p.runningBill.billNumber,
    project: p.project?.name ?? "",
  }));
}

export async function listUnmatchedVendorPayments(companyId: string, companyBankAccountId?: string) {
  const payments = await prisma.vendorPayment.findMany({
    where: { companyId, mode: { not: "CASH" }, bankTransaction: null, ...(companyBankAccountId && { companyBankAccountId }) },
    include: { vendorBill: { select: { id: true, billNumber: true } }, vendor: { select: { id: true, name: true } } },
    orderBy: { paymentDate: "desc" },
  });
  return payments.map((p) => ({
    id: p.id,
    paymentNumber: p.paymentNumber,
    paymentDate: p.paymentDate.toISOString().slice(0, 10),
    amount: p.amount.toString(),
    billNumber: p.vendorBill.billNumber,
    vendor: p.vendor.name,
  }));
}

/** Bulk-imports pre-parsed Excel/CSV rows (parsed client-side; the backend just validates and inserts). */
export async function importBankTransactions(companyId: string, createdById: string, input: ImportBankTransactionsInput) {
  if (!input.companyBankAccountId?.trim()) throw new Error("Bank account is required");
  const account = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
  if (!account) throw new Error("Company bank account not found");
  if (!input.rows?.length) throw new Error("No transactions to import");

  const batchId = autoImportBatchId();
  const rows = input.rows.map((r, i) => {
    if (!r.transactionDate) throw new Error(`Row ${i + 1}: transaction date is required`);
    const deposit = Number(r.deposit) || 0;
    const withdrawal = Number(r.withdrawal) || 0;
    if (deposit < 0 || withdrawal < 0) throw new Error(`Row ${i + 1}: amounts must be zero or greater`);
    if (deposit === 0 && withdrawal === 0) throw new Error(`Row ${i + 1}: either Deposit or Withdrawal must be greater than zero`);
    return {
      companyId,
      companyBankAccountId: account.id,
      transactionDate: new Date(r.transactionDate),
      deposit,
      withdrawal,
      referenceNumber: r.referenceNumber || null,
      description: r.description || null,
      category: r.category || null,
      source: "IMPORTED" as const,
      importBatchId: batchId,
      createdById,
    };
  });

  await prisma.bankTransaction.createMany({ data: rows });
  const created = await prisma.bankTransaction.findMany({ where: { importBatchId: batchId }, include, orderBy: { transactionDate: "asc" } });
  return { batchId, count: created.length, data: created.map(toDTO) };
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportBankTransactionsToCSV(companyId: string, query: BankTransactionListQuery) {
  const { data } = await listBankTransactions(companyId, { ...query, page: 1, limit: 5000 });

  const headers = ["Date", "Account", "Deposit", "Withdrawal", "Reference", "Description", "Category", "Project", "Status", "Matched Against"];
  const rows = data.map((t) =>
    [
      t.transactionDate,
      t.companyBankAccount?.nickname || t.companyBankAccount?.bankName || "",
      t.deposit,
      t.withdrawal,
      t.referenceNumber,
      t.description,
      t.category,
      t.project?.name ?? "",
      RECONCILIATION_STATUS_LABELS[t.reconciliationStatus] ?? t.reconciliationStatus,
      t.runningBillPayment ? `RB ${t.runningBillPayment.billNumber}` : t.vendorPayment ? `VB ${t.vendorPayment.billNumber}` : "",
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
