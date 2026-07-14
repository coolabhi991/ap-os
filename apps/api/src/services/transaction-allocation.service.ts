import prisma from "../config/prisma.js";
import { Prisma, AllocationType, AllocationStatus, PartnerType } from "@prisma/client";
import { recordRunningBillPayment } from "./running-bill.service.js";
import { recordVendorPayment } from "./vendor-payment.service.js";
import { createLabourPayment } from "./labour-payment.service.js";
import { createExpense } from "./expense.service.js";
import { createPartnerInvestment } from "./partner-investment.service.js";
import { createPartnerSettlement } from "./partner-settlement.service.js";
import { recordLiabilityRepayment } from "./liability-repayment.service.js";

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
  "PARTNER_SETTLEMENT",
  "GST",
  "LOAN",
  "OFFICE_EXPENSE",
  "OTHER",
  "LIABILITY_DISBURSEMENT",
  "LIABILITY_REPAYMENT",
  "EMPLOYEE_SALARY",
  "SITE_ADVANCE",
  "PERSONAL_ADVANCE",
  "OD_CC_INTEREST",
  "BANK_CHARGES",
  "INTEREST_INCOME",
  "CAR_LOAN_EMI",
  "HOME_LOAN_EMI",
  "GOLD_LOAN",
  "EMERGENCY_LOAN",
  "OTHER_LOAN",
  "SECURITY_DEPOSIT_RELEASE",
  "CLIENT_REFUND",
  "CREDIT_CARD_BILL_PAYMENT",
];

export const ALLOCATION_TYPE_LABELS: Record<string, string> = {
  RUNNING_BILL_RECEIPT: "Running Bill Receipt",
  VENDOR_PAYMENT: "Vendor Payment",
  LABOUR: "Labour",
  SITE_EXPENSE: "Site Expense",
  INTERNAL_TRANSFER: "Internal Transfer",
  OWNER_INVESTMENT: "Owner Investment",
  PARTNER_INVESTMENT: "Partner Investment",
  PARTNER_SETTLEMENT: "Partner Settlement",
  GST: "GST",
  LOAN: "Loan",
  OFFICE_EXPENSE: "Office Expense",
  OTHER: "Other",
  LIABILITY_DISBURSEMENT: "Liability Disbursement",
  LIABILITY_REPAYMENT: "Liability Repayment",
  EMPLOYEE_SALARY: "Employee Salary",
  SITE_ADVANCE: "Site Advance",
  PERSONAL_ADVANCE: "Personal Advance",
  OD_CC_INTEREST: "OD / CC Interest",
  BANK_CHARGES: "Bank Charges",
  INTEREST_INCOME: "Interest Income",
  CAR_LOAN_EMI: "Car Loan EMI",
  HOME_LOAN_EMI: "Home Loan EMI",
  GOLD_LOAN: "Gold Loan",
  EMERGENCY_LOAN: "Emergency Loan",
  OTHER_LOAN: "Other Loan",
  SECURITY_DEPOSIT_RELEASE: "Security Deposit Release",
  CLIENT_REFUND: "Client Refund",
  CREDIT_CARD_BILL_PAYMENT: "Credit Card Bill Payment",
};

/** Employee Salary / Site Advance / Personal Advance — tag-only, mirrors LIABILITY_DISBURSEMENT. */
export const EMPLOYEE_TAG_TYPES: AllocationType[] = ["EMPLOYEE_SALARY", "SITE_ADVANCE", "PERSONAL_ADVANCE"];

/**
 * Car/Home/Gold/Emergency/Other Loan/Credit Card Bill Payment/OD-CC Interest behave exactly like
 * LIABILITY_REPAYMENT — same ledger row, just a more specific "why" label, filtered to the
 * matching Liability.liabilityType in the UI. OD_CC_INTEREST is interest paid against a
 * CASH_CREDIT/OVERDRAFT Liability with no principal component — recorded as principalPaid=0,
 * interestPaid=amount, same as any other pure-interest repayment row.
 */
export const LOAN_REPAYMENT_TYPES: AllocationType[] = [
  "LIABILITY_REPAYMENT",
  "CAR_LOAN_EMI",
  "HOME_LOAN_EMI",
  "GOLD_LOAN",
  "EMERGENCY_LOAN",
  "OTHER_LOAN",
  "CREDIT_CARD_BILL_PAYMENT",
  "OD_CC_INTEREST",
];

// The types that auto-create a real ledger row rather than existing only as an allocation.
export const LEDGER_BACKED_TYPES: AllocationType[] = [
  "RUNNING_BILL_RECEIPT",
  "VENDOR_PAYMENT",
  "LABOUR",
  "SITE_EXPENSE",
  "OWNER_INVESTMENT",
  "PARTNER_INVESTMENT",
  "PARTNER_SETTLEMENT",
  ...LOAN_REPAYMENT_TYPES,
];

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
  partnerId?: string;
  liabilityId?: string;
  principalPaid?: number;
  interestPaid?: number;
  employeeId?: string;
  transferAccountId?: string;
}

const include = {
  site: { select: { id: true, name: true } },
  employee: { select: { id: true, name: true } },
  transferToAccount: { select: { id: true, nickname: true, bankName: true } },
  runningBillPayment: { select: { id: true, paymentNumber: true, runningBillId: true, runningBill: { select: { id: true, billNumber: true } } } },
  vendorPayment: { select: { id: true, paymentNumber: true, vendor: { select: { id: true, name: true } }, vendorBill: { select: { id: true, billNumber: true } } } },
  labourPayment: { select: { id: true, labour: { select: { id: true, name: true } } } },
  expense: { select: { id: true, expenseNumber: true, category: { select: { id: true, name: true } } } },
  partnerInvestment: { select: { id: true, investmentNumber: true, partner: { select: { id: true, name: true } } } },
  partnerSettlement: { select: { id: true, settlementNumber: true, partner: { select: { id: true, name: true } } } },
  liability: { select: { id: true, loanName: true, liabilityType: true } },
  liabilityRepayment: { select: { id: true, repaymentNumber: true, principalPaid: true, interestPaid: true, liability: { select: { id: true, loanName: true } } } },
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
    employeeId: a.employeeId ?? "",
    employee: a.employee,
    partyName: a.partyName ?? "",
    notes: a.notes ?? "",
    transferToAccountId: a.transferToAccountId ?? "",
    transferToAccount: a.transferToAccount,
    runningBillPaymentId: a.runningBillPaymentId ?? "",
    runningBillPayment: a.runningBillPayment
      ? {
          id: a.runningBillPayment.id,
          paymentNumber: a.runningBillPayment.paymentNumber,
          runningBillId: a.runningBillPayment.runningBillId,
          billNumber: a.runningBillPayment.runningBill.billNumber,
        }
      : null,
    vendorPaymentId: a.vendorPaymentId ?? "",
    vendorPayment: a.vendorPayment
      ? { id: a.vendorPayment.id, paymentNumber: a.vendorPayment.paymentNumber, vendor: a.vendorPayment.vendor.name, billNumber: a.vendorPayment.vendorBill.billNumber }
      : null,
    labourPaymentId: a.labourPaymentId ?? "",
    labourPayment: a.labourPayment ? { id: a.labourPayment.id, labour: a.labourPayment.labour.name } : null,
    expenseId: a.expenseId ?? "",
    expense: a.expense ? { id: a.expense.id, expenseNumber: a.expense.expenseNumber, category: a.expense.category.name } : null,
    partnerInvestmentId: a.partnerInvestmentId ?? "",
    partnerInvestment: a.partnerInvestment
      ? { id: a.partnerInvestment.id, investmentNumber: a.partnerInvestment.investmentNumber, partner: a.partnerInvestment.partner.name }
      : null,
    partnerSettlementId: a.partnerSettlementId ?? "",
    partnerSettlement: a.partnerSettlement
      ? { id: a.partnerSettlement.id, settlementNumber: a.partnerSettlement.settlementNumber, partner: a.partnerSettlement.partner.name }
      : null,
    liabilityId: a.liabilityId ?? "",
    liability: a.liability,
    liabilityRepaymentId: a.liabilityRepaymentId ?? "",
    liabilityRepayment: a.liabilityRepayment
      ? {
          id: a.liabilityRepayment.id,
          repaymentNumber: a.liabilityRepayment.repaymentNumber,
          principalPaid: a.liabilityRepayment.principalPaid.toString(),
          interestPaid: a.liabilityRepayment.interestPaid.toString(),
          liability: a.liabilityRepayment.liability.loanName,
        }
      : null,
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
  const txn = await prisma.bankTransaction.findFirst({ where: { id: bankTransactionId, companyId, isActive: true } });
  if (!txn) throw new Error("Bank Transaction not found");

  const allocations = await prisma.transactionAllocation.findMany({
    where: { bankTransactionId, companyId },
    include,
    orderBy: { createdAt: "asc" },
  });
  return allocations.map(toDTO);
}

/**
 * Removes a wrong (not necessarily duplicate) allocation — the general "undo a mis-allocation"
 * path, since createAllocations has no update, only create. Tag-only types (no secondary ledger
 * row — GST/OTHER/Employee tags/LIABILITY_DISBURSEMENT/SD_RELEASE/etc.) can be removed with
 * confirmation. Ledger-backed types (Vendor Payment, Running Bill Receipt, Liability Repayment,
 * etc.) are refused — undoing those safely means reversing the real record they created first,
 * which must be done from that record's own module, never by silently deleting it here.
 */
export async function deleteAllocation(id: string, companyId: string, confirm: boolean) {
  const allocation = await prisma.transactionAllocation.findFirst({ where: { id, companyId } });
  if (!allocation) throw new Error("Allocation not found");

  if (LEDGER_BACKED_TYPES.includes(allocation.allocationType)) {
    throw new Error(
      `This allocation created a ${ALLOCATION_TYPE_LABELS[allocation.allocationType] ?? allocation.allocationType} record — remove/reverse that record from its own module first, then this allocation`
    );
  }

  if (!confirm) {
    throw new Error("Confirmation required before removing an allocation");
  }

  await prisma.transactionAllocation.delete({ where: { id } });
  return recomputeAllocationStatus(allocation.bankTransactionId);
}

async function createLedgerRecord(
  companyId: string,
  createdById: string,
  bankTxn: { id: string; companyBankAccountId: string; transactionDate: Date },
  row: AllocationRowInput,
  allocationType: AllocationType
): Promise<{
  runningBillPaymentId?: string;
  vendorPaymentId?: string;
  labourPaymentId?: string;
  expenseId?: string;
  partnerInvestmentId?: string;
  partnerSettlementId?: string;
  liabilityRepaymentId?: string;
  siteId?: string;
}> {
  const paymentDate = bankTxn.transactionDate.toISOString().slice(0, 10);

  if (allocationType === "RUNNING_BILL_RECEIPT") {
    if (!row.runningBillId?.trim()) throw new Error("Running Bill is required for a Running Bill Receipt allocation");
    const runningBill = await prisma.runningBill.findFirst({ where: { id: row.runningBillId, companyId } });
    if (!runningBill) throw new Error("Running Bill not found");
    const result = await recordRunningBillPayment(row.runningBillId, companyId, createdById, {
      amount: row.amount,
      paymentDate,
      mode: "BANK",
      companyBankAccountId: bankTxn.companyBankAccountId,
      remarks: row.notes,
    });
    // Site is derived from the Running Bill itself (Project -> Site -> Running Bill), never asked
    // for separately, so it never drifts from the bill it's actually attached to.
    return { runningBillPaymentId: result.paymentId, siteId: runningBill.siteId ?? undefined };
  }

  if (allocationType === "VENDOR_PAYMENT") {
    if (!row.vendorBillId?.trim()) throw new Error("Vendor Bill is required for a Vendor Payment allocation");
    if (!row.vendorBankAccountId?.trim()) throw new Error("Vendor bank account is required for a Vendor Payment allocation");
    const vendorBill = await prisma.vendorBill.findFirst({ where: { id: row.vendorBillId, companyId } });
    if (!vendorBill) throw new Error("Vendor Bill not found");
    const payment = await recordVendorPayment(companyId, {
      vendorBillId: row.vendorBillId,
      amount: row.amount,
      paymentDate,
      mode: "BANK",
      companyBankAccountId: bankTxn.companyBankAccountId,
      vendorBankAccountId: row.vendorBankAccountId,
      remarks: row.notes,
    });
    // Site is derived from the Vendor Bill itself (every Vendor Bill now requires one), never
    // asked for separately, so it never drifts from the bill it's actually attached to.
    return { vendorPaymentId: payment.id, siteId: vendorBill.siteId ?? undefined };
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

  if (allocationType === "OWNER_INVESTMENT" || allocationType === "PARTNER_INVESTMENT") {
    if (!row.partnerId?.trim()) throw new Error("Partner is required for an Investment allocation");
    const expectedType: PartnerType = allocationType === "OWNER_INVESTMENT" ? "OWNER" : "PARTNER";
    const partner = await prisma.partner.findFirst({ where: { id: row.partnerId, companyId } });
    if (!partner) throw new Error("Partner not found");
    if (partner.partnerType !== expectedType) {
      throw new Error(`Selected partner is not an ${expectedType === "OWNER" ? "Owner" : "Partner"} — pick a matching partner or allocation type`);
    }
    const investment = await createPartnerInvestment(companyId, createdById, {
      partnerId: row.partnerId,
      amount: row.amount,
      investmentDate: paymentDate,
      mode: "COMPANY_BANK",
      companyBankAccountId: bankTxn.companyBankAccountId,
      remarks: row.notes,
    });
    return { partnerInvestmentId: investment.id };
  }

  if (allocationType === "PARTNER_SETTLEMENT") {
    if (!row.partnerId?.trim()) throw new Error("Partner is required for a Settlement allocation");
    const partner = await prisma.partner.findFirst({ where: { id: row.partnerId, companyId } });
    if (!partner) throw new Error("Partner not found");
    const settlement = await createPartnerSettlement(companyId, createdById, {
      partnerId: row.partnerId,
      amount: row.amount,
      settlementDate: paymentDate,
      mode: "COMPANY_BANK",
      companyBankAccountId: bankTxn.companyBankAccountId,
      remarks: row.notes,
    });
    return { partnerSettlementId: settlement.id };
  }

  if (LOAN_REPAYMENT_TYPES.includes(allocationType)) {
    if (!row.liabilityId?.trim()) throw new Error(`Liability is required for a ${ALLOCATION_TYPE_LABELS[allocationType]} allocation`);
    const principalPaid = Number(row.principalPaid) || 0;
    const interestPaid = Number(row.interestPaid) || 0;
    if (Math.abs(principalPaid + interestPaid - row.amount) > 0.01) {
      throw new Error("Principal Paid + Interest Paid must equal the allocation amount");
    }
    const repayment = await recordLiabilityRepayment(companyId, createdById, {
      liabilityId: row.liabilityId,
      principalPaid,
      interestPaid,
      paymentDate,
      companyBankAccountId: bankTxn.companyBankAccountId,
      remarks: row.notes,
    });
    return { liabilityRepaymentId: repayment.id };
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
  const txn = await prisma.bankTransaction.findFirst({ where: { id: bankTransactionId, companyId, isActive: true } });
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

      if (allocationType === "SECURITY_DEPOSIT_RELEASE" && !row.siteId?.trim()) {
        throw new Error("Site is required for a Security Deposit Release allocation");
      }

      if (allocationType === "CLIENT_REFUND" && !row.siteId?.trim()) {
        throw new Error("Site is required for a Client Refund allocation");
      }

      if (allocationType === "LIABILITY_DISBURSEMENT") {
        if (!row.liabilityId?.trim()) throw new Error("Liability is required for a Liability Disbursement allocation");
        const liability = await prisma.liability.findFirst({ where: { id: row.liabilityId, companyId } });
        if (!liability) throw new Error("Liability not found");
      }

      if (allocationType === "INTERNAL_TRANSFER") {
        if (!row.transferAccountId?.trim()) throw new Error("Transfer To Account is required for an Internal Transfer allocation");
        const transferAccount = await prisma.companyBankAccount.findFirst({ where: { id: row.transferAccountId, companyId } });
        if (!transferAccount) throw new Error("Transfer To Account not found");
        if (transferAccount.id === txn.companyBankAccountId) {
          throw new Error("Transfer To Account must be different from this transaction's own account");
        }
      }

      if (EMPLOYEE_TAG_TYPES.includes(allocationType)) {
        if (!row.employeeId?.trim()) throw new Error(`Employee is required for a ${ALLOCATION_TYPE_LABELS[allocationType]} allocation`);
        const employee = await prisma.employee.findFirst({ where: { id: row.employeeId, companyId } });
        if (!employee) throw new Error("Employee not found");
      }

      const ledgerIds = LEDGER_BACKED_TYPES.includes(allocationType)
        ? await createLedgerRecord(companyId, createdById, txn, row, allocationType)
        : {};
      // VENDOR_PAYMENT/RUNNING_BILL_RECEIPT return a derived siteId from the bill they're
      // attached to — it takes priority over whatever (if anything) the client sent.
      const { siteId: derivedSiteId, ...ledgerIdsWithoutSite } = ledgerIds;

      const allocation = await prisma.transactionAllocation.create({
        data: {
          companyId,
          bankTransactionId,
          allocationType,
          amount: row.amount,
          siteId: derivedSiteId ?? row.siteId ?? null,
          partyName: row.partyName || null,
          notes: row.notes || null,
          ...(allocationType === "LIABILITY_DISBURSEMENT" && { liabilityId: row.liabilityId || null }),
          ...(allocationType === "INTERNAL_TRANSFER" && { transferToAccountId: row.transferAccountId || null }),
          ...(EMPLOYEE_TAG_TYPES.includes(allocationType) && { employeeId: row.employeeId || null }),
          ...ledgerIdsWithoutSite,
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

  // Internal Transfer traceability: both accounts' balances already update themselves
  // independently from their own BankTransaction rows — nothing to write there. What's missing
  // is visibility into whether the "other half" of this transfer has already landed in the
  // destination account's statement. This is a read-only best-effort suggestion (same amount,
  // opposite direction, +/-10 days, not yet fully allocated) — never auto-created, since silently
  // linking two real bank transactions on a heuristic amount/date match is exactly the kind of
  // mistake that must stay a human decision on financial data.
  const transferSuggestions: Array<{
    allocationId: string;
    candidates: Array<{ id: string; transactionDate: string; amount: string; description: string; allocationStatus: string }>;
  }> = [];
  const isSourceDeposit = Number(txn.deposit) > 0;
  for (const c of created) {
    if (c.allocationType !== "INTERNAL_TRANSFER" || !c.transferToAccountId) continue;
    const windowStart = new Date(txn.transactionDate);
    windowStart.setDate(windowStart.getDate() - 10);
    const windowEnd = new Date(txn.transactionDate);
    windowEnd.setDate(windowEnd.getDate() + 10);
    const candidates = await prisma.bankTransaction.findMany({
      where: {
        companyId,
        companyBankAccountId: c.transferToAccountId,
        isActive: true,
        allocationStatus: { not: "FULLY_ALLOCATED" },
        transactionDate: { gte: windowStart, lte: windowEnd },
        ...(isSourceDeposit ? { withdrawal: Number(c.amount) } : { deposit: Number(c.amount) }),
      },
      select: { id: true, transactionDate: true, deposit: true, withdrawal: true, description: true, allocationStatus: true },
      take: 5,
    });
    if (candidates.length > 0) {
      transferSuggestions.push({
        allocationId: c.id,
        candidates: candidates.map((cand) => ({
          id: cand.id,
          transactionDate: cand.transactionDate.toISOString().slice(0, 10),
          amount: (Number(cand.deposit) > 0 ? cand.deposit : cand.withdrawal).toString(),
          description: cand.description ?? "",
          allocationStatus: cand.allocationStatus,
        })),
      });
    }
  }

  return { created, failed, transferSuggestions, ...status };
}
