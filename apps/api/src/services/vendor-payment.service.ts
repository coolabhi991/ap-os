import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { recordVendorBillPayment, PAYMENT_MODES } from "./vendor-bill.service.js";

/**
 * Vendor Payments: the record-payment side of Vendor Bill → Vendor Payment,
 * backed by the dedicated VendorPayment ledger (not the generic Payment table).
 * The actual validation, bank-account checks, outstanding-balance math, and
 * status derivation live in vendor-bill.service.ts (recordVendorBillPayment) and
 * are reused here as-is, so the bill's inline "Record Payment" action and this
 * module always apply exactly the same rules. This module adds listing,
 * per-vendor ledger, a payment dashboard, and CSV export on top of it.
 */

export { PAYMENT_MODES };

export interface RecordVendorPaymentInput {
  vendorBillId: string;
  amount: number;
  paymentDate?: string;
  mode: string;
  companyBankAccountId?: string;
  vendorBankAccountId?: string;
  referenceNumber?: string;
  attachmentFileName?: string;
  attachmentFileUrl?: string;
  remarks?: string;
  paidToOtherParty?: boolean;
  paidToName?: string;
  paidToReason?: string;
}

export interface VendorPaymentListQuery {
  search?: string;
  vendorId?: string;
  vendorBillId?: string;
  mode?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const bankAccountSelect = { id: true, nickname: true, beneficiaryName: true, bankName: true, accountNumber: true, ifscCode: true, upiId: true };

const include = {
  vendor: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
  vendorBill: { select: { id: true, billNumber: true, totalAmount: true, outstandingBalance: true, status: true } },
  companyBankAccount: { select: bankAccountSelect },
  vendorBankAccount: { select: bankAccountSelect },
};

type PaymentRow = Prisma.VendorPaymentGetPayload<{ include: typeof include }>;

function toDTO(p: PaymentRow) {
  return {
    id: p.id,
    companyId: p.companyId,
    vendorId: p.vendorId,
    vendor: p.vendor,
    projectId: p.projectId ?? "",
    project: p.project,
    vendorBillId: p.vendorBillId,
    vendorBill: {
      id: p.vendorBill.id,
      billNumber: p.vendorBill.billNumber,
      totalAmount: p.vendorBill.totalAmount.toString(),
      outstandingBalance: p.vendorBill.outstandingBalance.toString(),
      status: p.vendorBill.status,
    },
    companyBankAccountId: p.companyBankAccountId ?? "",
    companyBankAccount: p.companyBankAccount,
    vendorBankAccountId: p.vendorBankAccountId ?? "",
    vendorBankAccount: p.vendorBankAccount,
    paymentNumber: p.paymentNumber,
    paymentDate: p.paymentDate.toISOString(),
    amount: p.amount.toString(),
    mode: p.mode ?? "",
    referenceNumber: p.referenceNumber ?? "",
    attachmentFileName: p.attachmentFileName ?? "",
    attachmentFileUrl: p.attachmentFileUrl ?? "",
    remarks: p.remarks ?? "",
    paidToOtherParty: p.paidToOtherParty,
    paidToName: p.paidToName ?? "",
    paidToReason: p.paidToReason ?? "",
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Records a payment against a vendor bill and returns the full VendorPayment DTO. */
export async function recordVendorPayment(companyId: string, input: RecordVendorPaymentInput) {
  if (!input.vendorBillId?.trim()) throw new Error("Vendor Bill is required");

  await recordVendorBillPayment(input.vendorBillId, companyId, {
    amount: input.amount,
    paymentDate: input.paymentDate,
    mode: input.mode,
    companyBankAccountId: input.companyBankAccountId,
    vendorBankAccountId: input.vendorBankAccountId,
    referenceNumber: input.referenceNumber,
    attachmentFileName: input.attachmentFileName,
    attachmentFileUrl: input.attachmentFileUrl,
    remarks: input.remarks,
    paidToOtherParty: input.paidToOtherParty,
    paidToName: input.paidToName,
    paidToReason: input.paidToReason,
  });

  const payment = await prisma.vendorPayment.findFirst({
    where: { companyId, vendorBillId: input.vendorBillId },
    include,
    orderBy: { createdAt: "desc" },
  });

  return toDTO(payment!);
}

export async function listVendorPayments(companyId: string, query: VendorPaymentListQuery) {
  const {
    search = "",
    vendorId,
    vendorBillId,
    mode,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    sortBy = "paymentDate",
    sortOrder = "desc",
  } = query;

  const where: Prisma.VendorPaymentWhereInput = {
    companyId,
    ...(vendorId && { vendorId }),
    ...(vendorBillId && { vendorBillId }),
    ...(mode && PAYMENT_MODES.includes(mode.toUpperCase()) && { mode: mode.toUpperCase() }),
    ...(fromDate || toDate
      ? { paymentDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { paymentNumber: { contains: search, mode: "insensitive" } },
        { remarks: { contains: search, mode: "insensitive" } },
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
        { vendorBill: { billNumber: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const allowed = ["paymentNumber", "paymentDate", "amount", "mode", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "paymentDate";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, payments] = await Promise.all([
    prisma.vendorPayment.count({ where }),
    prisma.vendorPayment.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: payments.map(toDTO) };
}

export async function getVendorPaymentById(id: string, companyId: string) {
  const payment = await prisma.vendorPayment.findFirst({ where: { id, companyId }, include });
  if (!payment) throw new Error("Vendor Payment not found");
  return toDTO(payment);
}

export async function getVendorLedger(companyId: string, vendorId: string, query: { fromDate?: string; toDate?: string }) {
  if (!vendorId?.trim()) throw new Error("Vendor is required");

  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, companyId } });
  if (!vendor) throw new Error("Vendor not found");

  const { fromDate, toDate } = query;
  const dateRange =
    fromDate || toDate
      ? { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) }
      : undefined;

  const [bills, payments] = await Promise.all([
    prisma.vendorBill.findMany({
      where: { companyId, vendorId, status: { not: "CANCELLED" }, ...(dateRange && { billDate: dateRange }) },
      select: { id: true, billNumber: true, billDate: true, totalAmount: true },
      orderBy: { billDate: "asc" },
    }),
    prisma.vendorPayment.findMany({
      where: { companyId, vendorId, ...(dateRange && { paymentDate: dateRange }) },
      select: {
        id: true,
        paymentNumber: true,
        paymentDate: true,
        amount: true,
        paidToOtherParty: true,
        paidToName: true,
        vendorBill: { select: { billNumber: true } },
      },
      orderBy: { paymentDate: "asc" },
    }),
  ]);

  type Entry = { date: string; type: "BILL" | "PAYMENT"; reference: string; debit: number; credit: number };

  const entries: Entry[] = [
    ...bills.map((b) => ({
      date: b.billDate.toISOString(),
      type: "BILL" as const,
      reference: b.billNumber,
      debit: Number(b.totalAmount),
      credit: 0,
    })),
    ...payments.map((p) => ({
      date: p.paymentDate.toISOString(),
      type: "PAYMENT" as const,
      // Banking must still show the actual beneficiary — never silently attribute a
      // third-party payment to the vendor as if they received it directly.
      reference: `${p.paymentNumber} (${p.vendorBill.billNumber})${p.paidToOtherParty ? ` — paid to ${p.paidToName}` : ""}`,
      debit: 0,
      credit: Number(p.amount),
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const ledgerEntries = entries.map((e) => {
    balance += e.debit - e.credit;
    return {
      date: e.date,
      type: e.type,
      reference: e.reference,
      debit: e.debit.toString(),
      credit: e.credit.toString(),
      balance: balance.toString(),
    };
  });

  const totalBilled = bills.reduce((s, b) => s + Number(b.totalAmount), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

  return {
    vendor: { id: vendor.id, name: vendor.name },
    totalBilled: totalBilled.toString(),
    totalPaid: totalPaid.toString(),
    outstandingBalance: (totalBilled - totalPaid).toString(),
    entries: ledgerEntries,
  };
}

/**
 * Vendor Ledger's "Projects" tab — one row per project this vendor has billed against.
 * Work Done = sum(billAmount) (the vendor's invoiced base value of work/goods delivered);
 * Bill Amount = sum(totalAmount) (the final invoiced amount including GST). Both are read
 * straight off VendorBill's already-stored, already-computed fields — nothing is recalculated.
 */
export async function getVendorProjectBreakdown(companyId: string, vendorId: string) {
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, companyId } });
  if (!vendor) throw new Error("Vendor not found");

  const bills = await prisma.vendorBill.findMany({
    where: { companyId, vendorId, status: { not: "CANCELLED" } },
    select: {
      billAmount: true,
      totalAmount: true,
      paidAmount: true,
      outstandingBalance: true,
      project: { select: { id: true, name: true } },
    },
  });

  const byProject = new Map<string, { project: { id: string; name: string } | null; workDone: number; billAmount: number; paidAmount: number; outstanding: number; billCount: number }>();
  for (const b of bills) {
    const key = b.project?.id ?? "unassigned";
    const bucket = byProject.get(key) ?? { project: b.project, workDone: 0, billAmount: 0, paidAmount: 0, outstanding: 0, billCount: 0 };
    bucket.workDone += Number(b.billAmount);
    bucket.billAmount += Number(b.totalAmount);
    bucket.paidAmount += Number(b.paidAmount);
    bucket.outstanding += Number(b.outstandingBalance);
    bucket.billCount += 1;
    byProject.set(key, bucket);
  }

  return Array.from(byProject.values())
    .sort((a, b) => b.billAmount - a.billAmount)
    .map((b) => ({
      project: b.project,
      workDone: b.workDone.toFixed(2),
      billAmount: b.billAmount.toFixed(2),
      paidAmount: b.paidAmount.toFixed(2),
      outstanding: b.outstanding.toFixed(2),
      billCount: b.billCount,
    }));
}

export async function getVendorPaymentDashboard(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const baseWhere: Prisma.VendorPaymentWhereInput = { companyId };

  const [totalAgg, todayAgg, monthAgg, modeGroups, recentPayments, outstandingByVendor] = await Promise.all([
    prisma.vendorPayment.aggregate({ where: baseWhere, _sum: { amount: true }, _count: { _all: true } }),
    prisma.vendorPayment.aggregate({ where: { ...baseWhere, paymentDate: { gte: startOfDay } }, _sum: { amount: true } }),
    prisma.vendorPayment.aggregate({ where: { ...baseWhere, paymentDate: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.vendorPayment.groupBy({ by: ["mode"], where: baseWhere, _sum: { amount: true }, _count: { _all: true } }),
    prisma.vendorPayment.findMany({ where: baseWhere, include, orderBy: { paymentDate: "desc" }, take: 10 }),
    prisma.vendorBill.groupBy({
      by: ["vendorId"],
      where: { companyId, status: { not: "CANCELLED" } },
      _sum: { outstandingBalance: true },
      orderBy: { _sum: { outstandingBalance: "desc" } },
      take: 5,
    }),
  ]);

  const vendorIds = outstandingByVendor.map((v) => v.vendorId);
  const vendors = await prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, name: true } });
  const vendorNameById = new Map(vendors.map((v) => [v.id, v.name]));

  return {
    totalPayments: totalAgg._count._all,
    totalPaidAmount: (totalAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
    paidToday: (todayAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
    paidThisMonth: (monthAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
    byMode: modeGroups.map((g) => ({
      mode: g.mode ?? "UNSPECIFIED",
      count: g._count._all,
      amount: (g._sum.amount ?? new Prisma.Decimal(0)).toString(),
    })),
    recentPayments: recentPayments.map(toDTO),
    topOutstandingVendors: outstandingByVendor
      .filter((v) => Number(v._sum.outstandingBalance ?? 0) > 0)
      .map((v) => ({
        vendorId: v.vendorId,
        vendorName: vendorNameById.get(v.vendorId) ?? "Unknown",
        outstandingBalance: (v._sum.outstandingBalance ?? new Prisma.Decimal(0)).toString(),
      })),
  };
}

export async function exportVendorPaymentsToCSV(companyId: string, query: VendorPaymentListQuery) {
  const { data } = await listVendorPayments(companyId, { ...query, page: 1, limit: 5000 });

  const headers = [
    "Payment Number",
    "Vendor",
    "Bill Number",
    "Payment Date",
    "Amount",
    "Mode",
    "Reference/UTR/Cheque No.",
    "Company Bank Account",
    "Vendor Bank Account",
    "Remarks",
    "Status",
  ];

  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = data.map((p) =>
    [
      p.paymentNumber,
      p.vendor?.name ?? "",
      p.vendorBill?.billNumber ?? "",
      p.paymentDate,
      p.amount,
      p.mode,
      p.referenceNumber,
      p.companyBankAccount ? `${p.companyBankAccount.bankName} (${p.companyBankAccount.accountNumber})` : "",
      p.vendorBankAccount ? `${p.vendorBankAccount.bankName} (${p.vendorBankAccount.accountNumber})` : "",
      p.remarks,
      p.status,
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
