import prisma from "../config/prisma.js";
import { Prisma, AllocationStatus, BankTransactionSource } from "@prisma/client";

/**
 * Banking — the single financial control center. BankTransaction is the bank/cash statement
 * ledger and the single source of truth: source=IMPORTED rows (from an uploaded statement) are
 * permanently read-only — never edited, never deleted, only ever allocated (see
 * transaction-allocation.service.ts). Current Balance for a CompanyBankAccount is always
 * openingBalance + sum(deposit) - sum(withdrawal) over this table, computed on demand — never
 * stored, matching the "derive, don't store" convention already used for SubWork budgets.
 */

export const ALLOCATION_STATUSES = ["UNALLOCATED", "PARTIALLY_ALLOCATED", "FULLY_ALLOCATED"];
export const ALLOCATION_STATUS_LABELS: Record<string, string> = {
  UNALLOCATED: "Unallocated",
  PARTIALLY_ALLOCATED: "Partially Allocated",
  FULLY_ALLOCATED: "Fully Allocated",
};

export const BANK_TRANSACTION_SOURCES = ["MANUAL", "IMPORTED"];

export interface BankTransactionFormInput {
  companyBankAccountId: string;
  transactionDate: string;
  deposit?: number;
  withdrawal?: number;
  referenceNumber?: string;
  description?: string;
  category?: string;
  projectId?: string;
}

export interface BankTransactionListQuery {
  search?: string;
  companyBankAccountId?: string;
  projectId?: string;
  allocationStatus?: string;
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

function autoImportBatchId(): string {
  return `IMP-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
}

const include = {
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true, accountType: true } },
  project: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { allocations: true } },
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
    allocationStatus: t.allocationStatus,
    allocationCount: t._count.allocations,
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
  const { search = "", companyBankAccountId, projectId, allocationStatus, source, fromDate, toDate, page = 1, limit = 20, sortBy = "transactionDate", sortOrder = "desc" } = query;

  const where: Prisma.BankTransactionWhereInput = {
    companyId,
    ...(companyBankAccountId && { companyBankAccountId }),
    ...(projectId && { projectId }),
    ...(allocationStatus && ALLOCATION_STATUSES.includes(allocationStatus.toUpperCase()) && { allocationStatus: allocationStatus.toUpperCase() as AllocationStatus }),
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
      source: "MANUAL",
      createdById,
    },
    include,
  });

  return toDTO(txn);
}

/** MANUAL rows only — a source=IMPORTED row is the bank's own statement line and is never edited, per Banking's "read-only forever" rule. */
export async function updateBankTransaction(id: string, companyId: string, input: Partial<BankTransactionFormInput>) {
  const existing = await prisma.bankTransaction.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Bank Transaction not found");
  if (existing.source === "IMPORTED") throw new Error("Imported bank transactions are read-only — allocate it instead of editing it");

  const deposit = input.deposit !== undefined ? Number(input.deposit) || 0 : Number(existing.deposit);
  const withdrawal = input.withdrawal !== undefined ? Number(input.withdrawal) || 0 : Number(existing.withdrawal);
  validateAmounts(deposit, withdrawal);

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

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
    },
    include,
  });

  return toDTO(txn);
}

/** MANUAL rows only — see updateBankTransaction. A row with any allocations can never be deleted (that would silently orphan the ledger rows it created). */
export async function deleteBankTransaction(id: string, companyId: string) {
  const existing = await prisma.bankTransaction.findFirst({ where: { id, companyId }, include: { _count: { select: { allocations: true } } } });
  if (!existing) throw new Error("Bank Transaction not found");
  if (existing.source === "IMPORTED") throw new Error("Imported bank transactions are read-only and cannot be deleted");
  if (existing._count.allocations > 0) throw new Error("This transaction has allocations and cannot be deleted");
  await prisma.bankTransaction.delete({ where: { id } });
}

/** Bulk-imports pre-parsed Excel/CSV rows (parsed client-side; the backend just validates and inserts). Every row is permanently read-only from the moment it's created. */
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

  const headers = ["Date", "Account", "Deposit", "Withdrawal", "Reference", "Description", "Category", "Project", "Status", "Allocations"];
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
      ALLOCATION_STATUS_LABELS[t.allocationStatus] ?? t.allocationStatus,
      t.allocationCount,
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
