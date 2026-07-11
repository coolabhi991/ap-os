import prisma from "../config/prisma.js";
import { Prisma, AllocationType } from "@prisma/client";

/**
 * Partnership Reports — every figure here is read directly from already-existing ledgers
 * (RunningBillPayment, VendorPayment, LabourPayment, Expense, TransactionAllocation,
 * PartnerInvestment, PartnerSettlement). Nothing is recomputed into a second stored total,
 * mirroring the pattern already used by banking-reports.service.ts and
 * project-control-center.service.ts.
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

/**
 * Allocation Ledger — the company-wide, chronological view of every Transaction Allocation ever
 * saved (how invested/received capital has actually moved). Reuses TransactionAllocation as-is;
 * this is a read/filter layer, not a new ledger table.
 */
export interface AllocationLedgerQuery extends DateRangeQuery {
  allocationType?: string;
  siteId?: string;
  page?: number;
  limit?: number;
}

const allocationLedgerInclude = {
  bankTransaction: { select: { id: true, transactionDate: true, companyBankAccount: { select: { id: true, nickname: true, bankName: true } } } },
  site: { select: { id: true, name: true } },
  runningBillPayment: { select: { id: true, paymentNumber: true, runningBill: { select: { billNumber: true } } } },
  vendorPayment: { select: { id: true, paymentNumber: true, vendor: { select: { name: true } } } },
  labourPayment: { select: { id: true, labour: { select: { name: true } } } },
  expense: { select: { id: true, expenseNumber: true } },
  partnerInvestment: { select: { id: true, investmentNumber: true, partner: { select: { name: true } } } },
  partnerSettlement: { select: { id: true, settlementNumber: true, partner: { select: { name: true } } } },
  createdBy: { select: { id: true, name: true } },
};

type AllocationLedgerRow = Prisma.TransactionAllocationGetPayload<{ include: typeof allocationLedgerInclude }>;

function toLedgerDTO(a: AllocationLedgerRow) {
  return {
    id: a.id,
    allocationType: a.allocationType,
    amount: a.amount.toString(),
    date: a.bankTransaction.transactionDate.toISOString().slice(0, 10),
    bankAccount: a.bankTransaction.companyBankAccount.nickname || a.bankTransaction.companyBankAccount.bankName,
    site: a.site?.name ?? "",
    partyName: a.partyName ?? "",
    notes: a.notes ?? "",
    reference:
      (a.runningBillPayment && `RB Receipt ${a.runningBillPayment.paymentNumber} (${a.runningBillPayment.runningBill.billNumber})`) ||
      (a.vendorPayment && `Vendor Payment ${a.vendorPayment.paymentNumber} (${a.vendorPayment.vendor.name})`) ||
      (a.labourPayment && `Labour Payment (${a.labourPayment.labour.name})`) ||
      (a.expense && `Expense ${a.expense.expenseNumber}`) ||
      (a.partnerInvestment && `Investment ${a.partnerInvestment.investmentNumber} (${a.partnerInvestment.partner.name})`) ||
      (a.partnerSettlement && `Settlement ${a.partnerSettlement.settlementNumber} (${a.partnerSettlement.partner.name})`) ||
      "",
    createdByName: a.createdBy.name,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function getAllocationLedger(companyId: string, query: AllocationLedgerQuery) {
  const { allocationType, siteId, page = 1, limit = 100 } = query;
  const range = dateRange(query);

  const where: Prisma.TransactionAllocationWhereInput = {
    companyId,
    ...(allocationType && { allocationType: allocationType as AllocationType }),
    ...(siteId && { siteId }),
    ...(range && { bankTransaction: { transactionDate: range } }),
  };

  const take = Math.min(500, limit);
  const [total, rows] = await Promise.all([
    prisma.transactionAllocation.count({ where }),
    prisma.transactionAllocation.findMany({
      where,
      include: allocationLedgerInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
  ]);

  return { total, page, limit: take, data: rows.map(toLedgerDTO) };
}

/** Capital Summary — per Partner, Total Invested vs Total Settled vs Net Capital Position. Read straight off PartnerInvestment/PartnerSettlement; nothing stored. */
export async function getPartnerCapitalSummary(companyId: string) {
  const partners = await prisma.partner.findMany({ where: { companyId }, orderBy: { name: "asc" } });

  const [investmentSums, settlementSums] = await Promise.all([
    prisma.partnerInvestment.groupBy({ by: ["partnerId"], where: { companyId }, _sum: { amount: true } }),
    prisma.partnerSettlement.groupBy({ by: ["partnerId"], where: { companyId }, _sum: { amount: true } }),
  ]);
  const investedByPartner = new Map(investmentSums.map((s) => [s.partnerId, Number(s._sum.amount ?? 0)]));
  const settledByPartner = new Map(settlementSums.map((s) => [s.partnerId, Number(s._sum.amount ?? 0)]));

  const rows = partners.map((p) => {
    const totalInvested = investedByPartner.get(p.id) ?? 0;
    const totalSettled = settledByPartner.get(p.id) ?? 0;
    return {
      partnerId: p.id,
      partnerName: p.name,
      partnerType: p.partnerType,
      sharePercent: p.sharePercent.toString(),
      isActive: p.isActive,
      totalInvested: totalInvested.toFixed(2),
      totalSettled: totalSettled.toFixed(2),
      netPosition: (totalInvested - totalSettled).toFixed(2),
    };
  });

  return {
    totalSharePercent: partners.filter((p) => p.isActive).reduce((s, p) => s + Number(p.sharePercent), 0).toFixed(2),
    totalInvested: rows.reduce((s, r) => s + Number(r.totalInvested), 0).toFixed(2),
    totalSettled: rows.reduce((s, r) => s + Number(r.totalSettled), 0).toFixed(2),
    partners: rows,
  };
}

/**
 * Profit Sharing — Net Profit is computed purely on a cash basis from the same ledgers Banking
 * already maintains: client receipts in, minus Vendor/Labour/Site-Expense cash out. GST and
 * Office Expense allocations are subtracted as company-level (non-Site) operating costs.
 * Internal Transfer/Loan/Investment/Settlement/Other are financing activity, not operating
 * profit or loss, so they're deliberately excluded from this figure (shown separately in the
 * Allocation Ledger instead of being blended in ambiguously).
 */
export async function getProfitSharingReport(companyId: string, query: DateRangeQuery) {
  const range = dateRange(query);

  const [receiptsAgg, vendorAgg, labourAgg, expenseAgg, gstAgg, officeAgg, partners] = await Promise.all([
    prisma.runningBillPayment.aggregate({ where: { companyId, ...(range && { paymentDate: range }) }, _sum: { amount: true } }),
    prisma.vendorPayment.aggregate({ where: { companyId, ...(range && { paymentDate: range }) }, _sum: { amount: true } }),
    prisma.labourPayment.aggregate({ where: { companyId, isDeleted: false, ...(range && { paymentDate: range }) }, _sum: { amount: true } }),
    prisma.expense.aggregate({
      where: { companyId, isDeleted: false, labourPayment: null, ...(range && { expenseDate: range }) },
      _sum: { amount: true },
    }),
    prisma.transactionAllocation.aggregate({
      where: { companyId, allocationType: "GST", ...(range && { bankTransaction: { transactionDate: range } }) },
      _sum: { amount: true },
    }),
    prisma.transactionAllocation.aggregate({
      where: { companyId, allocationType: "OFFICE_EXPENSE", ...(range && { bankTransaction: { transactionDate: range } }) },
      _sum: { amount: true },
    }),
    prisma.partner.findMany({ where: { companyId, isActive: true, sharePercent: { gt: 0 } }, orderBy: { name: "asc" } }),
  ]);

  const revenue = Number(receiptsAgg._sum.amount ?? 0);
  const vendorCost = Number(vendorAgg._sum.amount ?? 0);
  const labourCost = Number(labourAgg._sum.amount ?? 0);
  const siteExpenseCost = Number(expenseAgg._sum.amount ?? 0);
  const gst = Number(gstAgg._sum.amount ?? 0);
  const officeExpense = Number(officeAgg._sum.amount ?? 0);

  const totalCost = vendorCost + labourCost + siteExpenseCost + gst + officeExpense;
  const netProfit = revenue - totalCost;

  const shares = partners.map((p) => ({
    partnerId: p.id,
    partnerName: p.name,
    partnerType: p.partnerType,
    sharePercent: p.sharePercent.toString(),
    shareAmount: ((netProfit * Number(p.sharePercent)) / 100).toFixed(2),
  }));

  return {
    revenue: revenue.toFixed(2),
    costs: {
      vendorPayments: vendorCost.toFixed(2),
      labourPayments: labourCost.toFixed(2),
      siteExpenses: siteExpenseCost.toFixed(2),
      gst: gst.toFixed(2),
      officeExpense: officeExpense.toFixed(2),
      total: totalCost.toFixed(2),
    },
    netProfit: netProfit.toFixed(2),
    totalSharePercentAllocated: shares.reduce((s, r) => s + Number(r.sharePercent), 0).toFixed(2),
    shares,
  };
}
