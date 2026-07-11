import prisma from "../config/prisma.js";
import { Prisma, LiabilityType } from "@prisma/client";
import { REVOLVING_LIABILITY_TYPES } from "./liability.service.js";

/**
 * Finance Reports — every figure here is read directly from Liability, LiabilityRepayment, and
 * TransactionAllocation/BankTransaction (the existing Banking ledger). Nothing is recomputed into
 * a second stored total, mirroring the pattern already used by banking-reports.service.ts and
 * partnership-reports.service.ts. This is the one financial source of truth for Finance — no new
 * ledger tables besides Liability/LiabilityRepayment themselves.
 */

interface DateRangeQuery {
  fromDate?: string;
  toDate?: string;
}

function dateRange(query: DateRangeQuery) {
  return query.fromDate || query.toDate
    ? { ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) }
    : undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1);
}

/** Dashboard — Total Liabilities, Total Outstanding, Monthly EMI, Monthly Interest (actual, paid
 * this month), Upcoming Due (by EMI day-of-month), CC Utilization, Loan Distribution, Recent
 * Repayments. */
export async function getFinanceDashboard(companyId: string) {
  const [liabilities, monthlyInterestAgg, recentRepayments] = await Promise.all([
    prisma.liability.findMany({ where: { companyId } }),
    prisma.liabilityRepayment.aggregate({ where: { companyId, paymentDate: { gte: startOfMonth() } }, _sum: { interestPaid: true } }),
    prisma.liabilityRepayment.findMany({
      where: { companyId },
      include: { liability: { select: { id: true, loanName: true, liabilityType: true } }, companyBankAccount: { select: { nickname: true, bankName: true } } },
      orderBy: { paymentDate: "desc" },
      take: 8,
    }),
  ]);

  const active = liabilities.filter((l) => l.status === "ACTIVE");
  const totalOutstanding = active.reduce((s, l) => s + Number(l.outstandingAmount), 0);
  const monthlyEMI = active.reduce((s, l) => s + Number(l.emiAmount), 0);

  const today = new Date().getDate();
  const upcomingDue = active
    .filter((l) => l.emiDate !== null && Number(l.emiAmount) > 0)
    .map((l) => {
      const day = l.emiDate as number;
      const daysUntil = day >= today ? day - today : day + 30 - today;
      return { id: l.id, loanName: l.loanName, liabilityType: l.liabilityType, emiAmount: l.emiAmount.toString(), emiDate: day, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 10);

  const revolving = active.filter((l) => REVOLVING_LIABILITY_TYPES.includes(l.liabilityType));
  const totalRevolvingLimit = revolving.reduce((s, l) => s + Number(l.sanctionAmount), 0);
  const totalRevolvingOutstanding = revolving.reduce((s, l) => s + Number(l.outstandingAmount), 0);
  const ccUtilizationPercent = totalRevolvingLimit > 0 ? round2((totalRevolvingOutstanding / totalRevolvingLimit) * 100) : 0;

  const distributionMap = new Map<string, number>();
  for (const l of active) {
    distributionMap.set(l.liabilityType, (distributionMap.get(l.liabilityType) ?? 0) + Number(l.outstandingAmount));
  }
  const loanDistribution = Array.from(distributionMap.entries()).map(([liabilityType, outstanding]) => ({
    liabilityType,
    outstanding: outstanding.toFixed(2),
  }));

  return {
    totalLiabilities: liabilities.length,
    activeLiabilities: active.length,
    totalOutstanding: totalOutstanding.toFixed(2),
    monthlyEMI: monthlyEMI.toFixed(2),
    monthlyInterestPaid: Number(monthlyInterestAgg._sum.interestPaid ?? 0).toFixed(2),
    upcomingDue,
    ccUtilizationPercent,
    totalRevolvingLimit: totalRevolvingLimit.toFixed(2),
    totalRevolvingOutstanding: totalRevolvingOutstanding.toFixed(2),
    loanDistribution,
    recentRepayments: recentRepayments.map((r) => ({
      id: r.id,
      repaymentNumber: r.repaymentNumber,
      paymentDate: r.paymentDate.toISOString().slice(0, 10),
      liability: r.liability.loanName,
      liabilityType: r.liability.liabilityType,
      principalPaid: r.principalPaid.toString(),
      interestPaid: r.interestPaid.toString(),
      totalPaid: r.totalPaid.toString(),
      bankAccount: r.companyBankAccount.nickname || r.companyBankAccount.bankName,
    })),
  };
}

/** Liability Summary — every liability with its key figures, one row each. */
export async function getLiabilitySummaryReport(companyId: string) {
  const liabilities = await prisma.liability.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  return liabilities.map((l) => ({
    id: l.id,
    loanName: l.loanName,
    liabilityType: l.liabilityType,
    lenderName: l.lenderName ?? "",
    sanctionAmount: l.sanctionAmount.toString(),
    outstandingAmount: l.outstandingAmount.toString(),
    repaidSoFar: (Number(l.sanctionAmount) - Number(l.outstandingAmount)).toFixed(2),
    interestType: l.interestType,
    interestRate: l.interestRate.toString(),
    emiAmount: l.emiAmount.toString(),
    status: l.status,
  }));
}

/** Outstanding Report — total outstanding grouped by Liability Type. */
export async function getOutstandingReport(companyId: string) {
  const liabilities = await prisma.liability.findMany({ where: { companyId, status: "ACTIVE" } });
  const grouped = new Map<string, { count: number; sanctioned: number; outstanding: number }>();
  for (const l of liabilities) {
    const entry = grouped.get(l.liabilityType) ?? { count: 0, sanctioned: 0, outstanding: 0 };
    entry.count += 1;
    entry.sanctioned += Number(l.sanctionAmount);
    entry.outstanding += Number(l.outstandingAmount);
    grouped.set(l.liabilityType, entry);
  }
  const rows = Array.from(grouped.entries()).map(([liabilityType, v]) => ({
    liabilityType,
    count: v.count,
    sanctionedAmount: v.sanctioned.toFixed(2),
    outstandingAmount: v.outstanding.toFixed(2),
  }));
  return {
    totalOutstanding: rows.reduce((s, r) => s + Number(r.outstandingAmount), 0).toFixed(2),
    rows,
  };
}

/** Interest History / Interest Paid Report — actual interest paid, grouped by Liability Type
 * (Monthly/Annual/CC/Gold Loan/Friend Loan interest, per the Finance module's requirement), read
 * straight off LiabilityRepayment.interestPaid — never a second stored interest figure. */
export async function getInterestPaidReport(companyId: string, query: DateRangeQuery) {
  const range = dateRange(query);
  const repayments = await prisma.liabilityRepayment.findMany({
    where: { companyId, ...(range && { paymentDate: range }) },
    include: { liability: { select: { id: true, loanName: true, liabilityType: true } } },
    orderBy: { paymentDate: "desc" },
  });

  const byType = new Map<string, number>();
  for (const r of repayments) {
    byType.set(r.liability.liabilityType, (byType.get(r.liability.liabilityType) ?? 0) + Number(r.interestPaid));
  }

  return {
    totalInterestPaid: repayments.reduce((s, r) => s + Number(r.interestPaid), 0).toFixed(2),
    thisYearInterestPaid: repayments
      .filter((r) => r.paymentDate >= startOfYear())
      .reduce((s, r) => s + Number(r.interestPaid), 0)
      .toFixed(2),
    byLiabilityType: Array.from(byType.entries()).map(([liabilityType, interestPaid]) => ({
      liabilityType,
      interestPaid: interestPaid.toFixed(2),
    })),
    repayments: repayments.map((r) => ({
      id: r.id,
      repaymentNumber: r.repaymentNumber,
      paymentDate: r.paymentDate.toISOString().slice(0, 10),
      liabilityId: r.liability.id,
      liability: r.liability.loanName,
      liabilityType: r.liability.liabilityType,
      interestPaid: r.interestPaid.toString(),
    })),
  };
}

/** EMI Schedule — every active liability with a real EMI, sorted by next-due day-of-month. Purely
 * a projection off Liability's own emiAmount/emiDate fields — no separate schedule table. */
export async function getEMISchedule(companyId: string) {
  const liabilities = await prisma.liability.findMany({
    where: { companyId, status: "ACTIVE", emiAmount: { gt: 0 } },
    orderBy: { emiDate: "asc" },
  });
  const today = new Date().getDate();
  return liabilities.map((l) => {
    const day = l.emiDate ?? 1;
    const daysUntil = day >= today ? day - today : day + 30 - today;
    return {
      id: l.id,
      loanName: l.loanName,
      liabilityType: l.liabilityType,
      emiAmount: l.emiAmount.toString(),
      emiDate: l.emiDate,
      daysUntil,
      outstandingAmount: l.outstandingAmount.toString(),
    };
  });
}

/** Credit Card Report — every CREDIT_CARD liability with limit/outstanding/utilization. Card
 * Name/Masked Number/Statement Date/Minimum Due/Outstanding are read straight off Liability's
 * own fields; Available Limit is never stored — always sanctionAmount - outstandingAmount. */
export async function getCreditCardReport(companyId: string) {
  const cards = await prisma.liability.findMany({ where: { companyId, liabilityType: "CREDIT_CARD" }, orderBy: { loanName: "asc" } });
  return cards.map((c) => ({
    id: c.id,
    loanName: c.loanName,
    bankName: c.bankName ?? "",
    maskedCardNumber: c.accountNumber ?? "",
    creditLimit: c.sanctionAmount.toString(),
    outstandingAmount: c.outstandingAmount.toString(),
    availableLimit: (Number(c.sanctionAmount) - Number(c.outstandingAmount)).toFixed(2),
    statementDate: c.statementDate,
    dueDate: c.emiDate,
    minimumDue: c.minimumDue.toString(),
    utilizationPercent: Number(c.sanctionAmount) > 0 ? round2((Number(c.outstandingAmount) / Number(c.sanctionAmount)) * 100) : 0,
    status: c.status,
  }));
}

/** EMI Calendar — every active EMI-bearing liability, grouped by day-of-month due date, for a
 * calendar-style upcoming-payments view. Purely a projection off Liability's own emiDate/
 * emiAmount — no new stored schedule. */
export async function getEMICalendar(companyId: string) {
  const liabilities = await prisma.liability.findMany({ where: { companyId, status: "ACTIVE", emiAmount: { gt: 0 } } });
  const byDay = new Map<number, { liabilityId: string; loanName: string; liabilityType: string; emiAmount: string }[]>();
  for (const l of liabilities) {
    const day = l.emiDate ?? 1;
    const bucket = byDay.get(day) ?? [];
    bucket.push({ liabilityId: l.id, loanName: l.loanName, liabilityType: l.liabilityType, emiAmount: l.emiAmount.toString() });
    byDay.set(day, bucket);
  }
  return Array.from(byDay.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, items]) => ({ day, items, totalAmount: items.reduce((s, i) => s + Number(i.emiAmount), 0).toFixed(2) }));
}

/** Liability Timeline — a company-wide, chronological feed of every disbursement and every
 * repayment across ALL liabilities (unlike Loan Ledger, which is scoped to one liability) —
 * read straight off TransactionAllocation (disbursements) and LiabilityRepayment. */
export async function getLiabilityTimeline(companyId: string) {
  const [disbursements, repayments] = await Promise.all([
    prisma.transactionAllocation.findMany({
      where: { companyId, allocationType: "LIABILITY_DISBURSEMENT" },
      include: {
        liability: { select: { id: true, loanName: true, liabilityType: true } },
        bankTransaction: { select: { transactionDate: true, companyBankAccount: { select: { nickname: true, bankName: true } } } },
      },
    }),
    prisma.liabilityRepayment.findMany({
      where: { companyId },
      include: { liability: { select: { id: true, loanName: true, liabilityType: true } }, companyBankAccount: { select: { nickname: true, bankName: true } } },
    }),
  ]);

  const entries = [
    ...disbursements
      .filter((d) => d.liability)
      .map((d) => ({
        date: d.bankTransaction.transactionDate.toISOString().slice(0, 10),
        type: "DISBURSEMENT" as const,
        liabilityId: d.liability!.id,
        loanName: d.liability!.loanName,
        liabilityType: d.liability!.liabilityType,
        bankAccount: d.bankTransaction.companyBankAccount.nickname || d.bankTransaction.companyBankAccount.bankName,
        amount: d.amount.toString(),
      })),
    ...repayments.map((r) => ({
      date: r.paymentDate.toISOString().slice(0, 10),
      type: "REPAYMENT" as const,
      liabilityId: r.liability.id,
      loanName: r.liability.loanName,
      liabilityType: r.liability.liabilityType,
      bankAccount: r.companyBankAccount.nickname || r.companyBankAccount.bankName,
      amount: r.totalPaid.toString(),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return entries;
}

/** Bank-wise Repayment — repayments grouped by the CompanyBankAccount that funded them. A
 * Liability can be (and often is) repaid from a different bank account each time — see
 * LiabilityRepayment.companyBankAccountId — this report is the traceability view over exactly
 * that, never a second copy of the repayment amounts themselves. */
export async function getBankWiseRepaymentReport(companyId: string, query: DateRangeQuery) {
  const range = dateRange(query);
  const repayments = await prisma.liabilityRepayment.findMany({
    where: { companyId, ...(range && { paymentDate: range }) },
    include: { companyBankAccount: { select: { id: true, nickname: true, bankName: true } }, liability: { select: { loanName: true } } },
    orderBy: { paymentDate: "desc" },
  });

  const byAccount = new Map<string, { bankAccountId: string; bankAccount: string; totalPaid: number; count: number; repayments: typeof repayments }>();
  for (const r of repayments) {
    const key = r.companyBankAccountId;
    const bucket = byAccount.get(key) ?? {
      bankAccountId: key,
      bankAccount: r.companyBankAccount.nickname || r.companyBankAccount.bankName,
      totalPaid: 0,
      count: 0,
      repayments: [],
    };
    bucket.totalPaid += Number(r.totalPaid);
    bucket.count += 1;
    bucket.repayments.push(r);
    byAccount.set(key, bucket);
  }

  return Array.from(byAccount.values())
    .sort((a, b) => b.totalPaid - a.totalPaid)
    .map((b) => ({
      bankAccountId: b.bankAccountId,
      bankAccount: b.bankAccount,
      totalPaid: b.totalPaid.toFixed(2),
      count: b.count,
      repayments: b.repayments.map((r) => ({
        id: r.id,
        repaymentNumber: r.repaymentNumber,
        paymentDate: r.paymentDate.toISOString().slice(0, 10),
        liability: r.liability.loanName,
        totalPaid: r.totalPaid.toString(),
      })),
    }));
}

/** CC Utilization Report — same idea, across all revolving credit types (CC, Cash Credit, OD). */
export async function getCCUtilizationReport(companyId: string) {
  const revolving = await prisma.liability.findMany({
    where: { companyId, liabilityType: { in: REVOLVING_LIABILITY_TYPES as LiabilityType[] }, status: "ACTIVE" },
    orderBy: { loanName: "asc" },
  });
  const rows = revolving.map((l) => ({
    id: l.id,
    loanName: l.loanName,
    liabilityType: l.liabilityType,
    limit: l.sanctionAmount.toString(),
    outstanding: l.outstandingAmount.toString(),
    utilizationPercent: Number(l.sanctionAmount) > 0 ? round2((Number(l.outstandingAmount) / Number(l.sanctionAmount)) * 100) : 0,
  }));
  const totalLimit = revolving.reduce((s, l) => s + Number(l.sanctionAmount), 0);
  const totalOutstanding = revolving.reduce((s, l) => s + Number(l.outstandingAmount), 0);
  return {
    overallUtilizationPercent: totalLimit > 0 ? round2((totalOutstanding / totalLimit) * 100) : 0,
    rows,
  };
}

/** Loan Ledger — the full, chronological, per-Liability history: its disbursement(s) (deposits
 * tagged LIABILITY_DISBURSEMENT) plus every repayment against it, oldest first — the same
 * "traceability" read TransactionAllocation already gives Site Money Flow, scoped to one loan. */
export async function getLoanLedger(liabilityId: string, companyId: string) {
  const liability = await prisma.liability.findFirst({ where: { id: liabilityId, companyId } });
  if (!liability) throw new Error("Liability not found");

  const [disbursements, repayments] = await Promise.all([
    prisma.transactionAllocation.findMany({
      where: { companyId, liabilityId, allocationType: "LIABILITY_DISBURSEMENT" },
      include: { bankTransaction: { select: { transactionDate: true, companyBankAccount: { select: { nickname: true, bankName: true } } } } },
    }),
    prisma.liabilityRepayment.findMany({
      where: { companyId, liabilityId },
      include: { companyBankAccount: { select: { nickname: true, bankName: true } } },
    }),
  ]);

  const entries = [
    ...disbursements.map((d) => ({
      date: d.bankTransaction.transactionDate.toISOString().slice(0, 10),
      type: "DISBURSEMENT" as const,
      description: "Loan Disbursement",
      bankAccount: d.bankTransaction.companyBankAccount.nickname || d.bankTransaction.companyBankAccount.bankName,
      principal: d.amount.toString(),
      interest: "0.00",
      amount: d.amount.toString(),
    })),
    ...repayments.map((r) => ({
      date: r.paymentDate.toISOString().slice(0, 10),
      type: "REPAYMENT" as const,
      description: `Repayment ${r.repaymentNumber}`,
      bankAccount: r.companyBankAccount.nickname || r.companyBankAccount.bankName,
      principal: r.principalPaid.toString(),
      interest: r.interestPaid.toString(),
      amount: r.totalPaid.toString(),
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return {
    liability: {
      id: liability.id,
      loanName: liability.loanName,
      liabilityType: liability.liabilityType,
      sanctionAmount: liability.sanctionAmount.toString(),
      outstandingAmount: liability.outstandingAmount.toString(),
      status: liability.status,
    },
    entries,
  };
}

/**
 * Funding Source Report — "Every borrowed amount must be traceable." For a Liability, finds the
 * bank account(s) its disbursement landed in (LIABILITY_DISBURSEMENT allocations), then reads
 * every OTHER allocation ever made out of that same CompanyBankAccount on/after the disbursement
 * date, grouped by destination (Site / Vendor / Office / Other) — the same loosely-coupled,
 * shared-bank-account traceability already used for Partner Investment money flow, since cash in
 * a bank account is fungible; this is a read/group layer over TransactionAllocation, not a new
 * penny-tracking ledger.
 */
export async function getFundingSourceReport(companyId: string, liabilityId?: string) {
  const where: Prisma.LiabilityWhereInput = { companyId, ...(liabilityId && { id: liabilityId }) };
  const liabilities = await prisma.liability.findMany({
    where,
    include: {
      allocations: {
        where: { allocationType: "LIABILITY_DISBURSEMENT" },
        include: { bankTransaction: { select: { companyBankAccountId: true, transactionDate: true, companyBankAccount: { select: { nickname: true, bankName: true } } } } },
      },
    },
  });

  const results = [];
  for (const l of liabilities) {
    if (!l.allocations.length) continue;
    for (const disbursement of l.allocations) {
      const bankAccountId = disbursement.bankTransaction.companyBankAccountId;
      const disbursedOn = disbursement.bankTransaction.transactionDate;

      const spentAllocations = await prisma.transactionAllocation.findMany({
        where: {
          companyId,
          bankTransaction: { companyBankAccountId: bankAccountId, transactionDate: { gte: disbursedOn } },
          allocationType: { notIn: ["LIABILITY_DISBURSEMENT"] },
        },
        include: { site: { select: { name: true } } },
      });

      const byDestination = new Map<string, number>();
      for (const a of spentAllocations) {
        const key = a.site?.name || a.partyName || ALLOCATION_LABEL_FALLBACK[a.allocationType] || "Other";
        byDestination.set(key, (byDestination.get(key) ?? 0) + Number(a.amount));
      }

      results.push({
        liabilityId: l.id,
        loanName: l.loanName,
        liabilityType: l.liabilityType,
        disbursementAmount: disbursement.amount.toString(),
        disbursedOn: disbursedOn.toISOString().slice(0, 10),
        bankAccount: disbursement.bankTransaction.companyBankAccount.nickname || disbursement.bankTransaction.companyBankAccount.bankName,
        allocatedTo: Array.from(byDestination.entries()).map(([destination, amount]) => ({ destination, amount: amount.toFixed(2) })),
      });
    }
  }
  return results;
}

const ALLOCATION_LABEL_FALLBACK: Record<string, string> = {
  VENDOR_PAYMENT: "Vendor",
  OFFICE_EXPENSE: "Office",
  SITE_EXPENSE: "Site Expense",
  LABOUR: "Labour",
  GST: "GST",
  LIABILITY_REPAYMENT: "Liability Repayment",
};

/** Repayment Report — the full repayment ledger with summary totals (Repayment History tab reads
 * the same underlying list; this adds the roll-up numbers a report needs). */
export async function getRepaymentReport(companyId: string, query: DateRangeQuery & { liabilityId?: string }) {
  const range = dateRange(query);
  const repayments = await prisma.liabilityRepayment.findMany({
    where: { companyId, ...(query.liabilityId && { liabilityId: query.liabilityId }), ...(range && { paymentDate: range }) },
    include: { liability: { select: { id: true, loanName: true, liabilityType: true } }, companyBankAccount: { select: { nickname: true, bankName: true } } },
    orderBy: { paymentDate: "desc" },
  });

  return {
    totalPrincipalPaid: repayments.reduce((s, r) => s + Number(r.principalPaid), 0).toFixed(2),
    totalInterestPaid: repayments.reduce((s, r) => s + Number(r.interestPaid), 0).toFixed(2),
    totalPaid: repayments.reduce((s, r) => s + Number(r.totalPaid), 0).toFixed(2),
    rows: repayments.map((r) => ({
      id: r.id,
      repaymentNumber: r.repaymentNumber,
      paymentDate: r.paymentDate.toISOString().slice(0, 10),
      liability: r.liability.loanName,
      liabilityType: r.liability.liabilityType,
      principalPaid: r.principalPaid.toString(),
      interestPaid: r.interestPaid.toString(),
      totalPaid: r.totalPaid.toString(),
      bankAccount: r.companyBankAccount.nickname || r.companyBankAccount.bankName,
    })),
  };
}
