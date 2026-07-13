import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

export interface EmployeeReportQuery {
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
}

const EMPLOYEE_TAG_TYPES = ["EMPLOYEE_SALARY", "SITE_ADVANCE", "PERSONAL_ADVANCE"] as const;

function dateWhere(fromDate?: string, toDate?: string): Prisma.BankTransactionWhereInput {
  if (!fromDate && !toDate) return {};
  return {
    transactionDate: {
      ...(fromDate ? { gte: new Date(fromDate) } : {}),
      ...(toDate ? { lte: new Date(toDate) } : {}),
    },
  };
}

/**
 * Generated entirely from TransactionAllocation rows tagged EMPLOYEE_SALARY/SITE_ADVANCE/
 * PERSONAL_ADVANCE — no separate Employee ledger/payroll table, per the "lightweight, no payroll"
 * brief. Salary Paid / Site Advances / Personal Advances / Grand Total are always computed on
 * demand, never stored.
 */
export async function getEmployeeReport(companyId: string, query: EmployeeReportQuery) {
  const { employeeId, fromDate, toDate } = query;

  const where: Prisma.TransactionAllocationWhereInput = {
    companyId,
    allocationType: { in: [...EMPLOYEE_TAG_TYPES] },
    employeeId: { not: null },
    ...(employeeId && { employeeId }),
    bankTransaction: dateWhere(fromDate, toDate),
  };

  const [grouped, transactions] = await Promise.all([
    prisma.transactionAllocation.groupBy({
      by: ["employeeId", "allocationType"],
      where,
      _sum: { amount: true },
    }),
    prisma.transactionAllocation.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true } },
        bankTransaction: { select: { transactionDate: true, companyBankAccount: { select: { nickname: true, bankName: true } } } },
      },
      orderBy: { bankTransaction: { transactionDate: "desc" } },
      take: 500,
    }),
  ]);

  const byEmployee = new Map<string, { employeeId: string; employeeName: string; salaryPaid: number; siteAdvances: number; personalAdvances: number }>();

  for (const row of grouped) {
    if (!row.employeeId) continue;
    if (!byEmployee.has(row.employeeId)) {
      byEmployee.set(row.employeeId, { employeeId: row.employeeId, employeeName: "", salaryPaid: 0, siteAdvances: 0, personalAdvances: 0 });
    }
    const entry = byEmployee.get(row.employeeId)!;
    const amount = Number(row._sum.amount ?? 0);
    if (row.allocationType === "EMPLOYEE_SALARY") entry.salaryPaid += amount;
    else if (row.allocationType === "SITE_ADVANCE") entry.siteAdvances += amount;
    else if (row.allocationType === "PERSONAL_ADVANCE") entry.personalAdvances += amount;
  }

  // Fill in employee names from the transaction list (avoids a second employee query).
  for (const t of transactions) {
    if (t.employeeId && t.employee && byEmployee.has(t.employeeId)) {
      byEmployee.get(t.employeeId)!.employeeName = t.employee.name;
    }
  }

  const summary = Array.from(byEmployee.values())
    .map((e) => ({ ...e, grandTotal: e.salaryPaid + e.siteAdvances + e.personalAdvances }))
    .sort((a, b) => b.grandTotal - a.grandTotal);

  const grandTotal = summary.reduce(
    (acc, e) => ({
      salaryPaid: acc.salaryPaid + e.salaryPaid,
      siteAdvances: acc.siteAdvances + e.siteAdvances,
      personalAdvances: acc.personalAdvances + e.personalAdvances,
      total: acc.total + e.grandTotal,
    }),
    { salaryPaid: 0, siteAdvances: 0, personalAdvances: 0, total: 0 }
  );

  return {
    summary: summary.map((e) => ({
      employeeId: e.employeeId,
      employeeName: e.employeeName,
      salaryPaid: e.salaryPaid.toString(),
      siteAdvances: e.siteAdvances.toString(),
      personalAdvances: e.personalAdvances.toString(),
      grandTotal: e.grandTotal.toString(),
    })),
    grandTotal: {
      salaryPaid: grandTotal.salaryPaid.toString(),
      siteAdvances: grandTotal.siteAdvances.toString(),
      personalAdvances: grandTotal.personalAdvances.toString(),
      total: grandTotal.total.toString(),
    },
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.bankTransaction.transactionDate.toISOString().slice(0, 10),
      employeeId: t.employeeId ?? "",
      employeeName: t.employee?.name ?? "",
      allocationType: t.allocationType,
      amount: t.amount.toString(),
      bankAccount: t.bankTransaction.companyBankAccount?.nickname || t.bankTransaction.companyBankAccount?.bankName || "",
      notes: t.notes ?? "",
    })),
  };
}
