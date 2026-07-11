import prisma from "../config/prisma.js";
import { getOutstandingBillsReport } from "./running-bill.service.js";
import { listBankTransactions, listBankAccountsWithBalances } from "./bank-transaction.service.js";

/**
 * Cross-cutting Banking & Reconciliation reports. Every figure here is read directly from the
 * already-completed modules (RunningBillPayment, VendorPayment, VendorBill, Expense) or from
 * this module's own BankTransaction ledger — nothing is recomputed or re-stored, mirroring the
 * pattern already used by project-control-center.service.ts for cross-domain reads.
 */

const EXPECTED_PAYMENT_DAYS = 30;

interface ReportDateQuery {
  fromDate?: string;
  toDate?: string;
  projectId?: string;
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Report: Bank Book — one bank account's BankTransaction ledger with a running balance. */
export async function getBankBookReport(companyId: string, query: { companyBankAccountId: string; fromDate?: string; toDate?: string }) {
  if (!query.companyBankAccountId?.trim()) throw new Error("Bank account is required");
  const account = await prisma.companyBankAccount.findFirst({ where: { id: query.companyBankAccountId, companyId } });
  if (!account) throw new Error("Company bank account not found");

  let openingBalance = Number(account.openingBalance);
  if (query.fromDate) {
    const priorAgg = await prisma.bankTransaction.aggregate({
      where: { companyId, companyBankAccountId: account.id, transactionDate: { lt: new Date(query.fromDate) } },
      _sum: { deposit: true, withdrawal: true },
    });
    openingBalance += Number(priorAgg._sum.deposit ?? 0) - Number(priorAgg._sum.withdrawal ?? 0);
  }

  const result = await listBankTransactions(companyId, { companyBankAccountId: account.id, fromDate: query.fromDate, toDate: query.toDate, limit: 5000, sortOrder: "asc" });

  let balance = openingBalance;
  const entries = result.data.map((t) => {
    balance += Number(t.deposit) - Number(t.withdrawal);
    return { ...t, balance: balance.toFixed(2) };
  });

  return {
    account: { id: account.id, nickname: account.nickname ?? "", bankName: account.bankName, accountNumber: account.accountNumber, accountType: account.accountType },
    openingBalance: openingBalance.toFixed(2),
    closingBalance: balance.toFixed(2),
    totalDeposits: result.data.reduce((s, t) => s + Number(t.deposit), 0).toFixed(2),
    totalWithdrawals: result.data.reduce((s, t) => s + Number(t.withdrawal), 0).toFixed(2),
    entries,
  };
}

/**
 * Report: Cash Book — the Cash-type account's opening balance combined with every CASH-mode
 * RunningBillPayment (received) and VendorPayment/Expense (paid), plus any manual/imported
 * BankTransaction rows logged directly against the Cash account. Expense rows paid on
 * VENDOR_CREDIT are excluded — that mode deliberately records a liability, not a cash movement.
 */
export async function getCashBookReport(companyId: string, query: { fromDate?: string; toDate?: string }) {
  const { fromDate, toDate } = query;
  const dateRange = fromDate || toDate ? { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } : undefined;

  const cashAccount = await prisma.companyBankAccount.findFirst({ where: { companyId, accountType: "CASH" }, orderBy: { createdAt: "asc" } });
  const openingBalance = cashAccount ? Number(cashAccount.openingBalance) : 0;

  const [received, paidVendor, paidExpense, cashTxns] = await Promise.all([
    prisma.runningBillPayment.findMany({
      where: { companyId, mode: "CASH", ...(dateRange && { paymentDate: dateRange }) },
      select: { paymentDate: true, amount: true, paymentNumber: true, runningBill: { select: { billNumber: true } } },
    }),
    prisma.vendorPayment.findMany({
      where: { companyId, mode: "CASH", ...(dateRange && { paymentDate: dateRange }) },
      select: { paymentDate: true, amount: true, paymentNumber: true, vendor: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { companyId, isDeleted: false, paymentMode: "CASH", ...(dateRange && { expenseDate: dateRange }) },
      select: { expenseDate: true, amount: true, expenseNumber: true, description: true },
    }),
    cashAccount
      ? prisma.bankTransaction.findMany({
          where: { companyId, companyBankAccountId: cashAccount.id, ...(dateRange && { transactionDate: dateRange }) },
          select: { transactionDate: true, deposit: true, withdrawal: true, description: true, referenceNumber: true },
        })
      : Promise.resolve([]),
  ]);

  interface Entry {
    date: string;
    type: string;
    reference: string;
    received: number;
    paid: number;
  }

  const entries: Entry[] = [
    ...received.map((r) => ({ date: r.paymentDate.toISOString(), type: "Running Bill Receipt", reference: `${r.paymentNumber} (${r.runningBill.billNumber})`, received: Number(r.amount), paid: 0 })),
    ...paidVendor.map((p) => ({ date: p.paymentDate.toISOString(), type: "Vendor Payment", reference: `${p.paymentNumber} (${p.vendor.name})`, received: 0, paid: Number(p.amount) })),
    ...paidExpense.map((e) => ({ date: e.expenseDate.toISOString(), type: "Site Expense", reference: `${e.expenseNumber}${e.description ? " - " + e.description : ""}`, received: 0, paid: Number(e.amount) })),
    ...cashTxns.map((t) => ({ date: t.transactionDate.toISOString(), type: "Manual / Imported", reference: t.referenceNumber || t.description || "-", received: Number(t.deposit), paid: Number(t.withdrawal) })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let balance = openingBalance;
  const ledger = entries.map((e) => {
    balance += e.received - e.paid;
    return { date: e.date.slice(0, 10), type: e.type, reference: e.reference, received: e.received.toFixed(2), paid: e.paid.toFixed(2), balance: balance.toFixed(2) };
  });

  return {
    hasCashAccount: !!cashAccount,
    openingBalance: openingBalance.toFixed(2),
    totalReceived: entries.reduce((s, e) => s + e.received, 0).toFixed(2),
    totalPaid: entries.reduce((s, e) => s + e.paid, 0).toFixed(2),
    closingBalance: balance.toFixed(2),
    entries: ledger,
  };
}

/** Report: Bank Allocation Status — Fully / Partially / Unallocated breakdown for an account (or all accounts). */
export async function getBankReconciliationReport(companyId: string, query: { companyBankAccountId?: string; fromDate?: string; toDate?: string }) {
  const result = await listBankTransactions(companyId, {
    companyBankAccountId: query.companyBankAccountId,
    fromDate: query.fromDate,
    toDate: query.toDate,
    limit: 5000,
    sortOrder: "asc",
  });

  const buckets = {
    FULLY_ALLOCATED: { count: 0, amount: 0 },
    PARTIALLY_ALLOCATED: { count: 0, amount: 0 },
    UNALLOCATED: { count: 0, amount: 0 },
  };

  for (const t of result.data) {
    const amount = Number(t.deposit) + Number(t.withdrawal);
    const bucket = buckets[t.allocationStatus as keyof typeof buckets];
    bucket.count += 1;
    bucket.amount += amount;
  }

  return {
    summary: {
      fullyAllocated: { count: buckets.FULLY_ALLOCATED.count, amount: buckets.FULLY_ALLOCATED.amount.toFixed(2) },
      partiallyAllocated: { count: buckets.PARTIALLY_ALLOCATED.count, amount: buckets.PARTIALLY_ALLOCATED.amount.toFixed(2) },
      unallocated: { count: buckets.UNALLOCATED.count, amount: buckets.UNALLOCATED.amount.toFixed(2) },
    },
    transactions: result.data,
  };
}

/** Report: Cash Flow — Today/Weekly/Monthly net movement plus Expected Inflow/Outflow from outstanding bills. */
export async function getCashFlowReport(companyId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  async function netSince(from: Date) {
    const [inflowAgg, vendorOutAgg, expenseOutAgg] = await Promise.all([
      prisma.runningBillPayment.aggregate({ where: { companyId, paymentDate: { gte: from } }, _sum: { amount: true } }),
      prisma.vendorPayment.aggregate({ where: { companyId, paymentDate: { gte: from } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { companyId, isDeleted: false, paymentMode: { not: "VENDOR_CREDIT" }, expenseDate: { gte: from } }, _sum: { amount: true } }),
    ]);
    const inflow = Number(inflowAgg._sum.amount ?? 0);
    const outflow = Number(vendorOutAgg._sum.amount ?? 0) + Number(expenseOutAgg._sum.amount ?? 0);
    return { inflow: inflow.toFixed(2), outflow: outflow.toFixed(2), net: (inflow - outflow).toFixed(2) };
  }

  const [today, weekly, monthly, expectedInflowAgg, expectedOutflowAgg] = await Promise.all([
    netSince(startOfToday),
    netSince(startOfWeek),
    netSince(startOfMonth),
    prisma.runningBill.aggregate({ where: { companyId, status: { in: ["PASSED", "PARTLY_PAID"] } }, _sum: { outstandingAmount: true } }),
    prisma.vendorBill.aggregate({ where: { companyId, status: { in: ["PENDING", "PARTIALLY_PAID"] } }, _sum: { outstandingBalance: true } }),
  ]);

  return {
    today,
    weekly,
    monthly,
    expectedInflow: Number(expectedInflowAgg._sum.outstandingAmount ?? 0).toFixed(2),
    expectedOutflow: Number(expectedOutflowAgg._sum.outstandingBalance ?? 0).toFixed(2),
  };
}

/** Report: Receivables — reuses Running Bill's own Outstanding Bills report; adds an Expected Payment Date (Bill Date + 30 days). */
export async function getReceivablesReport(companyId: string, query: { projectId?: string }) {
  const bills = await getOutstandingBillsReport(companyId, query);
  return bills.map((b) => {
    const expected = new Date(b.billDate);
    expected.setDate(expected.getDate() + EXPECTED_PAYMENT_DAYS);
    return { ...b, expectedPaymentDate: expected.toISOString().slice(0, 10) };
  });
}

/** Report: Payables — outstanding Vendor Bills with an overdue flag, read directly from the Vendor Bill module (never recomputed). */
export async function getPayablesReport(companyId: string, query: { projectId?: string }) {
  const bills = await prisma.vendorBill.findMany({
    where: { companyId, status: { in: ["PENDING", "PARTIALLY_PAID"] }, ...(query.projectId && { projectId: query.projectId }) },
    include: { vendor: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  return bills.map((b) => {
    const isOverdue = !!(b.dueDate && b.dueDate < now);
    return {
      id: b.id,
      billNumber: b.billNumber,
      billDate: b.billDate.toISOString().slice(0, 10),
      dueDate: b.dueDate ? b.dueDate.toISOString().slice(0, 10) : "",
      vendor: b.vendor,
      project: b.project,
      totalAmount: b.totalAmount.toString(),
      paidAmount: b.paidAmount.toString(),
      outstandingBalance: b.outstandingBalance.toString(),
      status: b.status,
      isOverdue,
      daysOverdue: isOverdue && b.dueDate ? Math.floor((now.getTime() - b.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0,
    };
  });
}

/** Report: Outstanding Summary — Receivables vs Payables vs cash+bank position, in one glance. */
export async function getOutstandingSummaryReport(companyId: string) {
  const [receivables, payables, accounts] = await Promise.all([
    getOutstandingBillsReport(companyId, {}),
    getPayablesReport(companyId, {}),
    listBankAccountsWithBalances(companyId),
  ]);

  const totalReceivable = receivables.reduce((s, r) => s + Number(r.outstandingAmount), 0);
  const totalPayable = payables.reduce((s, p) => s + Number(p.outstandingBalance), 0);
  const overduePayables = payables.filter((p) => p.isOverdue);
  const overduePayable = overduePayables.reduce((s, p) => s + Number(p.outstandingBalance), 0);
  const totalCashAndBank = accounts.filter((a) => a.isActive).reduce((s, a) => s + Number(a.currentBalance), 0);

  return {
    totalReceivable: totalReceivable.toFixed(2),
    receivableCount: receivables.length,
    totalPayable: totalPayable.toFixed(2),
    payableCount: payables.length,
    overduePayable: overduePayable.toFixed(2),
    overduePayableCount: overduePayables.length,
    netPosition: (totalReceivable - totalPayable).toFixed(2),
    totalCashAndBankBalance: totalCashAndBank.toFixed(2),
    accountBalances: accounts,
  };
}

export async function exportReceivablesToCSV(companyId: string, query: { projectId?: string }) {
  const rows = await getReceivablesReport(companyId, query);
  const headers = ["Bill Number", "Bill Date", "Project", "Status", "Net Payable", "Amount Received", "Outstanding", "Expected Payment Date", "Days Outstanding"];
  const csv = rows.map((r) =>
    [r.billNumber, r.billDate, r.project?.name ?? "", r.status, r.netPayable, r.amountReceived, r.outstandingAmount, r.expectedPaymentDate, r.daysOutstanding]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );
  return [headers.join(","), ...csv].join("\n");
}

export async function exportPayablesToCSV(companyId: string, query: { projectId?: string }) {
  const rows = await getPayablesReport(companyId, query);
  const headers = ["Bill Number", "Bill Date", "Due Date", "Vendor", "Project", "Total Amount", "Paid Amount", "Outstanding", "Status", "Overdue", "Days Overdue"];
  const csv = rows.map((r) =>
    [r.billNumber, r.billDate, r.dueDate, r.vendor?.name ?? "", r.project?.name ?? "", r.totalAmount, r.paidAmount, r.outstandingBalance, r.status, r.isOverdue ? "Yes" : "No", r.daysOverdue]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );
  return [headers.join(","), ...csv].join("\n");
}

export async function exportBankBookToCSV(companyId: string, query: { companyBankAccountId: string; fromDate?: string; toDate?: string }) {
  const report = await getBankBookReport(companyId, query);
  const headers = ["Date", "Deposit", "Withdrawal", "Balance", "Reference", "Description", "Category", "Status"];
  const csv = report.entries.map((t) =>
    [t.transactionDate, t.deposit, t.withdrawal, t.balance, t.referenceNumber, t.description, t.category, t.allocationStatus]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );
  return [headers.join(","), ...csv].join("\n");
}

export async function exportCashBookToCSV(companyId: string, query: { fromDate?: string; toDate?: string }) {
  const report = await getCashBookReport(companyId, query);
  const headers = ["Date", "Type", "Reference", "Received", "Paid", "Balance"];
  const csv = report.entries.map((e) => [e.date, e.type, e.reference, e.received, e.paid, e.balance].map((v) => escapeCsv(String(v ?? ""))).join(","));
  return [headers.join(","), ...csv].join("\n");
}
