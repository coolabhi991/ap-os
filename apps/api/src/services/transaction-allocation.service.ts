import prisma from "../config/prisma.js";
import { Prisma, AllocationType, AllocationStatus } from "@prisma/client";
import { recordRunningBillPayment } from "./running-bill.service.js";
import { recordVendorPayment } from "./vendor-payment.service.js";
import { createLabourPayment } from "./labour-payment.service.js";
import { createExpense } from "./expense.service.js";

/**
 * Transaction Allocation — the only way money moves out of a BankTransaction. Every allocation
 * declares a purpose (AllocationType) and an amount; RUNNING_BILL_RECEIPT/VENDOR_PAYMENT/LABOUR/
 * SITE_EXPENSE additionally create the real ledger row (RunningBillPayment/VendorPayment/
 * LabourPayment/Expense) that Bill Received History/Vendor Ledger/Expense History already read
 * from — the allocation is never a second copy of that amount. The bank statement itself is
 * never edited by this module; BankTransaction.allocationStatus is the only field it writes back.
 */

export const ALLOCATION_TYPES = [
  "RUNNING_BILL_RECEIPT",
  "VENDOR_PAYMENT",
  "LABOUR",
  "SITE_EXPENSE",
  "INTERNAL_TRANSFER",
  "OWNER_INVESTMENT",
  "PARTNER_INVESTMENT",
  "GST",
  "LOAN",
  "OFFICE_EXPENSE",
  "OTHER",
];

export const ALLOCATION_TYPE_LABELS: Record<string, string> = {
  RUNNING_BILL_RECEIPT: "Running Bill Receipt",
  VENDOR_PAYMENT: "Vendor Payment",
  LABOUR: "Labour",
  SITE_EXPENSE: "Site Expense",
  INTERNAL_TRANSFER: "Internal Transfer",
  OWNER_INVESTMENT: "Owner Investment",
  PARTNER_INVESTMENT: "Partner Investment",
  GST: "GST",
  LOAN: "Loan",
  OFFICE_EXPENSE: "Office Expense",
  OTHER: "Other",
};

// The 4 types that auto-create a real ledger row rather than existing only as an allocation.
const LEDGER_BACKED_TYPES: AllocationType[] = ["RUNNING_BILL_RECEIPT", "VENDOR_PAYMENT", "LABOUR", "SITE_EXPENSE"];

const AMOUNT_TOLERANCE = 0.01;

export interface AllocationRowInput {
  allocationType: string;
  amount: number;
  siteId?: string;
  partyName?: string;
  notes?: string;
  runningBillId?: string;
  vendorBillId?: string;
  vendorBankAccountId?: string;
  labourId?: string;
  categoryId?: string;
}

const include = {
  site: { select: { id: true, name: true } },
  runningBillPayment: { select: { id: true, paymentNumber: true, runningBill: { select: { id: true, billNumber: true } } } },
  vendorPayment: { select: { id: true, paymentNumber: true, vendor: { select: { id: true, name: true } }, vendorBill: { select: { id: true, billNumber: true } } } },
  labourPayment: { select: { id: true, labour: { select: { id: true, name: true } } } },
  expense: { select: { id: true, expenseNumber: true, category: { select: { id: true, name: true } } } },
  createdBy: { select: { id: true, name: true } },
};

type AllocationRow = Prisma.TransactionAllocationGetPayload<{ include: typeof include }>;

function toDTO(a: AllocationRow) {
  return {
    id: a.id,
    companyId: a.companyId,
    bankTransactionId: a.bankTransactionId,
    allocationType: a.allocationType,
    amount: a.amount.toString(),
    siteId: a.siteId ?? "",
    site: a.site,
    partyName: a.partyName ?? "",
    notes: a.notes ?? "",
    runningBillPaymentId: a.runningBillPaymentId ?? "",
    runningBillPayment: a.runningBillPayment
      ? { id: a.runningBillPayment.id, paymentNumber: a.runningBillPayment.paymentNumber, billNumber: a.runningBillPayment.runningBill.billNumber }
      : null,
    vendorPaymentId: a.vendorPaymentId ?? "",
    vendorPayment: a.vendorPayment
      ? { id: a.vendorPayment.id, paymentNumber: a.vendorPayment.paymentNumber, vendor: a.vendorPayment.vendor.name, billNumber: a.vendorPayment.vendorBill.billNumber }
      : null,
    labourPaymentId: a.labourPaymentId ?? "",
    labourPayment: a.labourPayment ? { id: a.labourPayment.id, labour: a.labourPayment.labour.name } : null,
    expenseId: a.expenseId ?? "",
    expense: a.expense ? { id: a.expense.id, expenseNumber: a.expense.expenseNumber, category: a.expense.category.name } : null,
    createdById: a.createdById,
    createdBy: a.createdBy,
    createdAt: a.createdAt.toISOString(),
  };
}

function parseAllocationType(t: string): AllocationType {
  if (!ALLOCATION_TYPES.includes(t)) throw new Error(`Invalid allocation type: ${t}`);
  return t as AllocationType;
}

/** Recomputes and persists BankTransaction.allocationStatus from the current sum of its allocations — the only field this module ever writes on the transaction itself. */
async function recomputeAllocationStatus(bankTransactionId: string) {
  const txn = await prisma.bankTransaction.findFirstOrThrow({ where: { id: bankTransactionId } });
  const agg = await prisma.transactionAllocation.aggregate({ where: { bankTransactionId }, _sum: { amount: true } });
  const allocated = Number(agg._sum.amount ?? 0);
  const total = Number(txn.deposit) + Number(txn.withdrawal);

  const allocationStatus: AllocationStatus =
    allocated <= 0 ? "UNALLOCATED" : allocated >= total - AMOUNT_TOLERANCE ? "FULLY_ALLOCATED" : "PARTIALLY_ALLOCATED";

  await prisma.bankTransaction.update({ where: { id: bankTransactionId }, data: { allocationStatus } });
  return { allocated, total, allocationStatus };
}

export async function listAllocationsForTransaction(bankTransactionId: string, companyId: string) {
  const txn = await prisma.bankTransaction.findFirst({ where: { id: bankTransactionId, companyId } });
  if (!txn) throw new Error("Bank Transaction not found");

  const allocations = await prisma.transactionAllocation.findMany({
    where: { bankTransactionId, companyId },
    include,
    orderBy: { createdAt: "asc" },
  });
  return allocations.map(toDTO);
}

async function createLedgerRecord(
  companyId: string,
  createdById: string,
  bankTxn: { id: string; companyBankAccountId: string; transactionDate: Date },
  row: AllocationRowInput,
  allocationType: AllocationType
): Promise<{ runningBillPaymentId?: string; vendorPaymentId?: string; labourPaymentId?: string; expenseId?: string }> {
  const paymentDate = bankTxn.transactionDate.toISOString().slice(0, 10);

  if (allocationType === "RUNNING_BILL_RECEIPT") {
    if (!row.runningBillId?.trim()) throw new Error("Running Bill is required for a Running Bill Receipt allocation");
    const result = await recordRunningBillPayment(row.runningBillId, companyId, createdById, {
      amount: row.amount,
      paymentDate,
      mode: "BANK",
      companyBankAccountId: bankTxn.companyBankAccountId,
      remarks: row.notes,
    });
    return { runningBillPaymentId: result.paymentId };
  }

  if (allocationType === "VENDOR_PAYMENT") {
    if (!row.vendorBillId?.trim()) throw new Error("Vendor Bill is required for a Vendor Payment allocation");
    if (!row.vendorBankAccountId?.trim()) throw new Error("Vendor bank account is required for a Vendor Payment allocation");
    const payment = await recordVendorPayment(companyId, {
      vendorBillId: row.vendorBillId,
      amount: row.amount,
      paymentDate,
      mode: "BANK",
      companyBankAccountId: bankTxn.companyBankAccountId,
      vendorBankAccountId: row.vendorBankAccountId,
      remarks: row.notes,
    });
    return { vendorPaymentId: payment.id };
  }

  if (allocationType === "LABOUR") {
    if (!row.labourId?.trim()) throw new Error("Worker is required for a Labour allocation");
    const labour = await prisma.labour.findFirst({ where: { id: row.labourId, companyId, isDeleted: false } });
    if (!labour) throw new Error("Labour not found");
    const site = row.siteId ? await prisma.site.findFirst({ where: { id: row.siteId, companyId } }) : null;
    const payment = await createLabourPayment(companyId, createdById, {
      labourId: row.labourId,
      projectId: site?.projectId,
      siteId: row.siteId,
      amount: row.amount,
      paymentDate,
      mode: "COMPANY_BANK",
      companyBankAccountId: bankTxn.companyBankAccountId,
      remarks: row.notes,
    });
    return { labourPaymentId: payment.id };
  }

  if (allocationType === "SITE_EXPENSE") {
    if (!row.siteId?.trim()) throw new Error("Site is required for a Site Expense allocation");
    if (!row.categoryId?.trim()) throw new Error("Expense category is required for a Site Expense allocation");
    const site = await prisma.site.findFirst({ where: { id: row.siteId, companyId } });
    if (!site) throw new Error("Site not found");
    const expense = await createExpense(companyId, createdById, {
      projectId: site.projectId,
      siteId: row.siteId,
      categoryId: row.categoryId,
      amount: row.amount,
      paymentMode: "COMPANY_BANK",
      companyBankAccountId: bankTxn.companyBankAccountId,
      expenseDate: paymentDate,
      remarks: row.notes,
    });
    return { expenseId: expense.id };
  }

  return {};
}

/**
 * Creates one or more allocations against a single BankTransaction (split allocation). Rows are
 * processed sequentially, each in its own atomic step (create the ledger row, then the
 * allocation pointing at it) — not one outer DB transaction, since the reused ledger services
 * (recordRunningBillPayment, recordVendorPayment, createLabourPayment, createExpense) each run
 * their own. If a row fails partway through a batch, earlier rows in the same call remain saved
 * and the failure is reported per-row — mirroring the existing "skipped" pattern used by
 * bulkMarkAttendance, and the documented orphan-tolerance in labour-payment.service.ts.
 */
export async function createAllocations(companyId: string, createdById: string, bankTransactionId: string, rows: AllocationRowInput[]) {
  const txn = await prisma.bankTransaction.findFirst({ where: { id: bankTransactionId, companyId } });
  if (!txn) throw new Error("Bank Transaction not found");
  if (!rows?.length) throw new Error("At least one allocation is required");

  const total = Number(txn.deposit) + Number(txn.withdrawal);
  const existingAgg = await prisma.transactionAllocation.aggregate({ where: { bankTransactionId }, _sum: { amount: true } });
  const alreadyAllocated = Number(existingAgg._sum.amount ?? 0);
  const requested = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  if (alreadyAllocated + requested > total + AMOUNT_TOLERANCE) {
    throw new Error(
      `Allocations (₹${requested.toFixed(2)}) exceed the remaining unallocated balance (₹${(total - alreadyAllocated).toFixed(2)}) on this transaction`
    );
  }

  const created: ReturnType<typeof toDTO>[] = [];
  const failed: Array<{ index: number; allocationType: string; reason: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.amount || row.amount <= 0) throw new Error("Amount must be greater than zero");
      const allocationType = parseAllocationType(row.allocationType);

      if (row.siteId) {
        const site = await prisma.site.findFirst({ where: { id: row.siteId, companyId } });
        if (!site) throw new Error("Site not found");
      }

      const ledgerIds = LEDGER_BACKED_TYPES.includes(allocationType)
        ? await createLedgerRecord(companyId, createdById, txn, row, allocationType)
        : {};

      const allocation = await prisma.transactionAllocation.create({
        data: {
          companyId,
          bankTransactionId,
          allocationType,
          amount: row.amount,
          siteId: row.siteId || null,
          partyName: row.partyName || null,
          notes: row.notes || null,
          ...ledgerIds,
          createdById,
        },
        include,
      });
      created.push(toDTO(allocation));
    } catch (error) {
      failed.push({ index: i, allocationType: row.allocationType, reason: error instanceof Error ? error.message : "Failed to save allocation" });
    }
  }

  const status = await recomputeAllocationStatus(bankTransactionId);
  return { created, failed, ...status };
}
