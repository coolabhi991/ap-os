import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { LEDGER_BACKED_TYPES } from "./transaction-allocation.service.js";

/**
 * Imported Statement Management — the missing piece of the Upload Statement -> Import
 * Transactions -> Transaction Allocation -> Reports chain. This module never touches the Import
 * Engine, Duplicate Detection, or Allocation Engine (those stay in bank-transaction.service.ts /
 * transaction-allocation.service.ts, untouched); it only manages the visibility of an already-
 * imported statement and its transactions via BankStatementImport.isDeleted / BankTransaction.isActive.
 *
 * Soft delete NEVER touches a ledger-backed allocation or the real record it created (Vendor
 * Payment, Running Bill Receipt, Liability Repayment, etc.) — those are financial history and stay
 * exactly as they are. Deleting a statement only hides its transactions from Banking, Allocation,
 * Reports, and Dashboard; restoring undoes exactly that, nothing more.
 */

export interface StatementListQuery {
  companyBankAccountId?: string;
  status?: "active" | "deleted" | "all";
  page?: number;
  limit?: number;
}

const include = {
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { transactions: true } },
};

type StatementRow = Prisma.BankStatementImportGetPayload<{ include: typeof include }>;

function toDTO(s: StatementRow) {
  return {
    id: s.id,
    companyBankAccountId: s.companyBankAccountId,
    companyBankAccount: s.companyBankAccount,
    fileName: s.fileName ?? "",
    periodFrom: s.periodFrom ? s.periodFrom.toISOString().slice(0, 10) : "",
    periodTo: s.periodTo ? s.periodTo.toISOString().slice(0, 10) : "",
    totalRows: s.totalRows,
    importedRows: s.importedRows,
    skippedRows: s.skippedRows,
    transactionCount: s._count.transactions,
    importBatchId: s.importBatchId ?? "",
    isDeleted: s.isDeleted,
    deletedAt: s.deletedAt ? s.deletedAt.toISOString() : "",
    createdById: s.createdById,
    createdBy: s.createdBy,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function listImportedStatements(companyId: string, query: StatementListQuery) {
  const { companyBankAccountId, status = "active", page = 1, limit = 20 } = query;

  const where: Prisma.BankStatementImportWhereInput = {
    companyId,
    ...(companyBankAccountId && { companyBankAccountId }),
    ...(status === "active" && { isDeleted: false }),
    ...(status === "deleted" && { isDeleted: true }),
  };

  const take = Math.min(100, limit);
  const skip = (Math.max(1, page) - 1) * take;

  const [total, rows] = await Promise.all([
    prisma.bankStatementImport.count({ where }),
    prisma.bankStatementImport.findMany({ where, include, orderBy: { createdAt: "desc" }, skip, take }),
  ]);

  return { total, page, limit: take, data: rows.map(toDTO) };
}

/** Statement Summary — statement info, import stats, and the pre-delete impact figures (informational only, never a hard blocker). */
export async function getStatementSummary(id: string, companyId: string) {
  const statement = await prisma.bankStatementImport.findFirst({ where: { id, companyId }, include });
  if (!statement) throw new Error("Bank Statement Import not found");

  const transactions = await prisma.bankTransaction.findMany({
    where: { bankStatementImportId: id, companyId },
    include: { _count: { select: { allocations: true } }, allocations: { select: { allocationType: true } } },
  });

  let totalDeposit = 0;
  let totalWithdrawal = 0;
  let allocatedCount = 0;
  let unallocatedCount = 0;
  let ledgerBackedCount = 0;

  for (const t of transactions) {
    totalDeposit += Number(t.deposit);
    totalWithdrawal += Number(t.withdrawal);
    if (t._count.allocations > 0) {
      allocatedCount++;
      if (t.allocations.some((a) => LEDGER_BACKED_TYPES.includes(a.allocationType))) ledgerBackedCount++;
    } else {
      unallocatedCount++;
    }
  }

  const auditLogs = await prisma.bankStatementAuditLog.findMany({
    where: { bankStatementImportId: id, companyId },
    include: { performedBy: { select: { id: true, name: true } } },
    orderBy: { performedAt: "desc" },
  });

  return {
    statement: toDTO(statement),
    totalTransactions: transactions.length,
    allocatedTransactions: allocatedCount,
    unallocatedTransactions: unallocatedCount,
    ledgerBackedAllocationCount: ledgerBackedCount,
    totalDeposit: totalDeposit.toFixed(2),
    totalWithdrawal: totalWithdrawal.toFixed(2),
    auditLog: auditLogs.map((a) => ({
      id: a.id,
      action: a.action,
      performedById: a.performedById,
      performedBy: a.performedBy.name,
      performedAt: a.performedAt.toISOString(),
      notes: a.notes ?? "",
    })),
  };
}

/**
 * Soft delete only, statement-level — never allowed on individual transactions. Marks the
 * statement and every one of its transactions inactive; allocations and any ledger records they
 * created (Vendor Payment, Running Bill Receipt, etc.) are never touched, deleted, or modified.
 */
export async function deleteStatement(id: string, companyId: string, performedById: string) {
  const statement = await prisma.bankStatementImport.findFirst({ where: { id, companyId } });
  if (!statement) throw new Error("Bank Statement Import not found");
  if (statement.isDeleted) throw new Error("This statement has already been deleted");

  await prisma.$transaction([
    prisma.bankStatementImport.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } }),
    prisma.bankTransaction.updateMany({ where: { bankStatementImportId: id }, data: { isActive: false } }),
    prisma.bankStatementAuditLog.create({ data: { companyId, bankStatementImportId: id, action: "DELETED", performedById } }),
  ]);
}

/** Reverses deleteStatement exactly — statement and every one of its transactions become visible again, with all allocations intact (they were never touched). */
export async function restoreStatement(id: string, companyId: string, performedById: string) {
  const statement = await prisma.bankStatementImport.findFirst({ where: { id, companyId } });
  if (!statement) throw new Error("Bank Statement Import not found");
  if (!statement.isDeleted) throw new Error("This statement is not deleted");

  await prisma.$transaction([
    prisma.bankStatementImport.update({ where: { id }, data: { isDeleted: false, deletedAt: null } }),
    prisma.bankTransaction.updateMany({ where: { bankStatementImportId: id }, data: { isActive: true } }),
    prisma.bankStatementAuditLog.create({ data: { companyId, bankStatementImportId: id, action: "RESTORED", performedById } }),
  ]);
}
