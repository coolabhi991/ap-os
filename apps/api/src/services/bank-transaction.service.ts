import prisma from "../config/prisma.js";
import { Prisma, AllocationStatus, BankTransactionSource } from "@prisma/client";
import { LEDGER_BACKED_TYPES, ALLOCATION_TYPE_LABELS } from "./transaction-allocation.service.js";

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
  fileHash?: string;
  fileName?: string;
}

/**
 * Identity of a transaction for duplicate detection: same account, same day, same amounts, same
 * reference (when present), same description. Used both when importing (skip a row that matches
 * one already on file) and by the duplicate-transaction maintenance tool (group existing rows that
 * share this same identity).
 */
function transactionFingerprint(
  companyBankAccountId: string,
  transactionDate: Date,
  deposit: number,
  withdrawal: number,
  referenceNumber: string | null | undefined,
  description: string | null | undefined
): string {
  const day = transactionDate.toISOString().slice(0, 10);
  const ref = (referenceNumber ?? "").trim().toLowerCase();
  const desc = (description ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return [companyBankAccountId, day, deposit.toFixed(2), withdrawal.toFixed(2), ref, desc].join("|");
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

  // Expenses already linked to a TransactionAllocation had their money movement counted via the
  // BankTransaction withdrawal that produced them — excluded here to avoid double-subtracting the
  // same payment. Queried as a plain expenseId list (not a relational `allocation: null` filter)
  // because combining that filter with `_sum: { amount }` on Expense.groupBy produces an ambiguous
  // SQL column: TransactionAllocation also has its own `amount` column.
  const allocatedExpenseIds = (
    await prisma.transactionAllocation.findMany({ where: { companyId, expenseId: { not: null } }, select: { expenseId: true } })
  ).map((a) => a.expenseId as string);

  const [sums, directExpenseSums] = await Promise.all([
    prisma.bankTransaction.groupBy({
      by: ["companyBankAccountId"],
      where: { companyId, isActive: true },
      _sum: { deposit: true, withdrawal: true },
      _count: { _all: true },
    }),
    // Expense Payment Source Workflow — a directly-entered Cash/Bank Expense (Source Account
    // Workflow milestone) reduces its Source Account's balance immediately, the same as a real
    // bank withdrawal.
    prisma.expense.groupBy({
      by: ["companyBankAccountId"],
      where: { companyId, isDeleted: false, companyBankAccountId: { not: null }, id: { notIn: allocatedExpenseIds } },
      _sum: { amount: true },
    }),
  ]);
  const sumsByAccount = new Map(sums.map((s) => [s.companyBankAccountId, s]));
  const directExpensesByAccount = new Map(directExpenseSums.map((s) => [s.companyBankAccountId as string, Number(s._sum.amount ?? 0)]));

  return accounts.map((a) => {
    const s = sumsByAccount.get(a.id);
    const totalDeposits = Number(s?._sum.deposit ?? 0);
    const totalWithdrawals = Number(s?._sum.withdrawal ?? 0);
    const directExpenses = directExpensesByAccount.get(a.id) ?? 0;
    const currentBalance = Number(a.openingBalance) + totalDeposits - totalWithdrawals - directExpenses;
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
    isActive: true,
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
  const txn = await prisma.bankTransaction.findFirst({ where: { id, companyId, isActive: true }, include });
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

/**
 * Duplicate Transaction Management — the safe maintenance tool for cleaning up rows left behind
 * by imports that predate this fix. Groups existing transactions by the same fingerprint used at
 * import time (account, date, deposit, withdrawal, reference, description); only fingerprints
 * with more than one row are duplicates. Never touches a whole statement/import batch — only
 * individual duplicate rows are ever candidates for removal, and only through deleteDuplicateBankTransaction below.
 */
export async function findDuplicateBankTransactions(companyId: string, companyBankAccountId?: string) {
  const rows = await prisma.bankTransaction.findMany({
    where: { companyId, isActive: true, ...(companyBankAccountId && { companyBankAccountId }) },
    include,
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, BankTransactionRow[]>();
  for (const row of rows) {
    const fp = transactionFingerprint(row.companyBankAccountId, row.transactionDate, Number(row.deposit), Number(row.withdrawal), row.referenceNumber, row.description);
    const group = groups.get(fp);
    if (group) group.push(row);
    else groups.set(fp, [row]);
  }

  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([fingerprint, group]) => ({
      fingerprint,
      count: group.length,
      transactions: group.map(toDTO),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Removes exactly one duplicate transaction row — never the last remaining copy of its
 * fingerprint, and never a row backed by a real ledger record (Vendor Payment, Running Bill
 * Payment, Liability Repayment, etc.) since undoing that safely means reversing that ledger
 * entry too, which is out of scope here; the user must remove that allocation first via its own
 * module. A row with only tag-only allocations (no secondary ledger row — see
 * transaction-allocation.service.ts's LEDGER_BACKED_TYPES) can be removed, but only when the
 * caller explicitly confirms it.
 */
export async function deleteDuplicateBankTransaction(id: string, companyId: string, confirmAllocated: boolean) {
  const existing = await prisma.bankTransaction.findFirst({
    where: { id, companyId },
    include: { allocations: { select: { id: true, allocationType: true } } },
  });
  if (!existing) throw new Error("Bank Transaction not found");

  const dupCount = await prisma.bankTransaction.count({
    where: {
      companyId,
      companyBankAccountId: existing.companyBankAccountId,
      transactionDate: existing.transactionDate,
      deposit: existing.deposit,
      withdrawal: existing.withdrawal,
      referenceNumber: existing.referenceNumber,
      description: existing.description,
    },
  });
  if (dupCount <= 1) throw new Error("This transaction is not a duplicate of any other transaction — refusing to delete the only copy");

  if (existing.allocations.length > 0) {
    const ledgerBacked = existing.allocations.filter((a) => LEDGER_BACKED_TYPES.includes(a.allocationType));
    if (ledgerBacked.length > 0) {
      throw new Error(
        `This duplicate has a ${ALLOCATION_TYPE_LABELS[ledgerBacked[0].allocationType] ?? ledgerBacked[0].allocationType} allocation linked to a real record — remove that allocation first, then delete this duplicate`
      );
    }
    if (!confirmAllocated) {
      throw new Error(`This duplicate has ${existing.allocations.length} allocation(s) — confirmation required before deletion`);
    }
    await prisma.$transaction([
      prisma.transactionAllocation.deleteMany({ where: { bankTransactionId: id } }),
      prisma.bankTransaction.delete({ where: { id } }),
    ]);
    return;
  }

  await prisma.bankTransaction.delete({ where: { id } });
}

/**
 * Pre-flight check for the Import modal: has this exact file (by content hash) already been
 * imported into this bank account before? Called before the user commits to importing, so they
 * can be warned and cancel — separate from the row-level dedup in importBankTransactions, which
 * always runs regardless of this check (handles the "similar but not byte-identical file" case,
 * e.g. an overlapping statement export).
 */
export async function checkStatementImportDuplicate(companyId: string, companyBankAccountId: string, fileHash: string) {
  if (!companyBankAccountId?.trim()) throw new Error("Bank account is required");
  if (!fileHash?.trim()) throw new Error("File hash is required");

  const existing = await prisma.bankStatementImport.findFirst({
    where: { companyId, companyBankAccountId, fileHash, isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  if (!existing) return { duplicate: false as const };

  return {
    duplicate: true as const,
    existingImport: {
      id: existing.id,
      fileName: existing.fileName ?? "",
      importedAt: existing.createdAt.toISOString(),
      importedBy: existing.createdBy.name,
      totalRows: existing.totalRows,
      importedRows: existing.importedRows,
      skippedRows: existing.skippedRows,
      periodFrom: existing.periodFrom ? existing.periodFrom.toISOString().slice(0, 10) : "",
      periodTo: existing.periodTo ? existing.periodTo.toISOString().slice(0, 10) : "",
    },
  };
}

/**
 * Bulk-imports pre-parsed Excel/CSV rows (parsed client-side; the backend just validates and
 * inserts). Every inserted row is permanently read-only from the moment it's created.
 *
 * Duplicate protection (the actual data-integrity guarantee — never skipped, regardless of
 * whether the caller ran checkStatementImportDuplicate first):
 *  - Every row is fingerprinted on (account, date, deposit, withdrawal, reference, description).
 *  - Rows matching a transaction already on file for this account are skipped, not inserted.
 *  - Rows that duplicate an earlier row within the SAME file are also skipped (protects against a
 *    malformed export with repeated lines).
 *  - A BankStatementImport audit row is always written, recording exactly how many were found,
 *    imported, and skipped, so re-uploading the same file always shows the same true history.
 */
export async function importBankTransactions(companyId: string, createdById: string, input: ImportBankTransactionsInput) {
  if (!input.companyBankAccountId?.trim()) throw new Error("Bank account is required");
  const account = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
  if (!account) throw new Error("Company bank account not found");
  if (!input.rows?.length) throw new Error("No transactions to import");

  const parsedRows = input.rows.map((r, i) => {
    if (!r.transactionDate) throw new Error(`Row ${i + 1}: transaction date is required`);
    const deposit = Number(r.deposit) || 0;
    const withdrawal = Number(r.withdrawal) || 0;
    if (deposit < 0 || withdrawal < 0) throw new Error(`Row ${i + 1}: amounts must be zero or greater`);
    if (deposit === 0 && withdrawal === 0) throw new Error(`Row ${i + 1}: either Deposit or Withdrawal must be greater than zero`);
    return {
      transactionDate: new Date(r.transactionDate),
      deposit,
      withdrawal,
      referenceNumber: r.referenceNumber || null,
      description: r.description || null,
      category: r.category || null,
    };
  });

  const dates = parsedRows.map((r) => r.transactionDate.getTime());
  const periodFrom = new Date(Math.min(...dates));
  const periodTo = new Date(Math.max(...dates));

  // One query for every existing transaction in this account across the file's date range —
  // cheaper than a per-row lookup, and lets the same pass also catch duplicates within the file.
  const existingInRange = await prisma.bankTransaction.findMany({
    where: { companyId, companyBankAccountId: account.id, transactionDate: { gte: periodFrom, lte: periodTo } },
    select: { transactionDate: true, deposit: true, withdrawal: true, referenceNumber: true, description: true },
  });

  const seen = new Set(
    existingInRange.map((t) => transactionFingerprint(account.id, t.transactionDate, Number(t.deposit), Number(t.withdrawal), t.referenceNumber, t.description))
  );

  const batchId = autoImportBatchId();
  const toInsert: Prisma.BankTransactionCreateManyInput[] = [];
  let skipped = 0;

  for (const r of parsedRows) {
    const fp = transactionFingerprint(account.id, r.transactionDate, r.deposit, r.withdrawal, r.referenceNumber, r.description);
    if (seen.has(fp)) {
      skipped++;
      continue;
    }
    seen.add(fp);
    toInsert.push({
      companyId,
      companyBankAccountId: account.id,
      transactionDate: r.transactionDate,
      deposit: r.deposit,
      withdrawal: r.withdrawal,
      referenceNumber: r.referenceNumber,
      description: r.description,
      category: r.category,
      source: "IMPORTED",
      importBatchId: batchId,
      createdById,
    });
  }

  const createdRows = await prisma.$transaction(async (tx) => {
    // Statement row created FIRST so its real id can be stamped onto every inserted transaction
    // as the authoritative bankStatementImportId FK — importBatchId is kept alongside purely as
    // a business/batch identifier, matching the existing convention.
    const statement = await tx.bankStatementImport.create({
      data: {
        companyId,
        companyBankAccountId: account.id,
        fileName: input.fileName || null,
        fileHash: input.fileHash || "",
        periodFrom,
        periodTo,
        totalRows: parsedRows.length,
        importedRows: toInsert.length,
        skippedRows: skipped,
        importBatchId: batchId,
        createdById,
      },
    });

    if (toInsert.length) {
      await tx.bankTransaction.createMany({ data: toInsert.map((row) => ({ ...row, bankStatementImportId: statement.id })) });
    }

    await tx.bankStatementAuditLog.create({
      data: {
        companyId,
        bankStatementImportId: statement.id,
        action: "IMPORTED",
        performedById: createdById,
        notes: `Imported ${toInsert.length} of ${parsedRows.length} row(s) — ${skipped} skipped as duplicates`,
      },
    });

    if (!toInsert.length) return [];
    return tx.bankTransaction.findMany({ where: { bankStatementImportId: statement.id }, include, orderBy: { transactionDate: "asc" } });
  });

  return {
    batchId,
    totalFound: parsedRows.length,
    imported: toInsert.length,
    skippedDuplicates: skipped,
    count: createdRows.length,
    data: createdRows.map(toDTO),
  };
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
