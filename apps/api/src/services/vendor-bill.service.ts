import prisma from "../config/prisma.js";
import { Prisma, VendorBillStatus, PaymentStatus } from "@prisma/client";

export const PAYMENT_MODES = ["CASH", "BANK", "CHEQUE", "UPI", "NEFT", "RTGS"];

function parseMode(m: string): string {
  const upper = m.trim().toUpperCase();
  if (!PAYMENT_MODES.includes(upper)) {
    throw new Error(`Invalid payment mode: ${m}. Must be one of ${PAYMENT_MODES.join(", ")}`);
  }
  return upper;
}

/**
 * Vendor Bill: the central payable record for the actual AP Construction
 * workflow — vendor delivers material on a phone order, we log a Material
 * Receipt (which updates Inventory), then raise a Vendor Bill against the
 * vendor + project directly. Purchase Order and Material Receipt links are
 * both OPTIONAL — this company does not normally raise POs.
 *
 * Amount fields:
 *  - billAmount:     the vendor's invoiced base/subtotal amount
 *  - taxableAmount:  the amount GST is calculated on (defaults to billAmount)
 *  - gstAmount:      tax amount
 *  - totalAmount:    final payable (defaults to taxableAmount + gstAmount) —
 *                    this is the figure outstandingBalance/paidAmount track.
 */

export interface VendorBillFormInput {
  vendorId: string;
  projectId?: string;
  purchaseOrderId?: string;
  materialReceiptId?: string;
  subWorkId?: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  billAmount?: number;
  taxableAmount?: number;
  gstAmount?: number;
  totalAmount?: number;
  invoiceFileName?: string;
  invoiceFileUrl?: string;
  notes?: string;
}

export interface VendorBillListQuery {
  search?: string;
  status?: string;
  vendorId?: string;
  projectId?: string;
  fromDate?: string;
  toDate?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface RecordPaymentInput {
  amount: number;
  paymentDate?: string;
  mode: string;
  companyBankAccountId?: string;
  vendorBankAccountId?: string;
  referenceNumber?: string;
  attachmentFileName?: string;
  attachmentFileUrl?: string;
  remarks?: string;
  // Display/audit metadata only — never affects paidAmount/outstandingBalance below. Set when the
  // money was physically handed to someone other than the vendor (e.g. a site supervisor
  // collecting cash on the vendor's behalf).
  paidToOtherParty?: boolean;
  paidToName?: string;
  paidToReason?: string;
}

function parseStatus(s: string | undefined): VendorBillStatus | undefined {
  const valid: Record<string, VendorBillStatus> = {
    PENDING: "PENDING",
    PARTIALLY_PAID: "PARTIALLY_PAID",
    PAID: "PAID",
    CANCELLED: "CANCELLED",
  };
  return s ? valid[s] : undefined;
}

/** Bill status is always derived from paid-vs-total — never set directly by the client. */
function deriveBillStatus(paidAmount: number, totalAmount: number): VendorBillStatus {
  const outstanding = totalAmount - paidAmount;
  if (outstanding <= 0) return "PAID";
  if (paidAmount > 0) return "PARTIALLY_PAID";
  return "PENDING";
}

function autoBillNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `VB-${y}${m}-${rand}`;
}

function autoPaymentNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PMT-${y}${m}-${rand}`;
}

const include = {
  vendor: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
  purchaseOrder: { select: { id: true, poNumber: true } },
  materialReceipt: { select: { id: true, receiptNumber: true } },
  subWork: { select: { id: true, name: true } },
  payments: {
    orderBy: { paymentDate: "desc" as const },
    include: {
      companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true } },
      vendorBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true } },
    },
  },
};

type VendorBillRow = Prisma.VendorBillGetPayload<{ include: typeof include }>;

function toDTO(bill: VendorBillRow) {
  const isOverdue =
    !!bill.dueDate &&
    bill.dueDate.getTime() < Date.now() &&
    bill.status !== "PAID" &&
    bill.status !== "CANCELLED";

  return {
    id: bill.id,
    companyId: bill.companyId,
    vendorId: bill.vendorId,
    vendor: bill.vendor,
    projectId: bill.projectId ?? "",
    project: bill.project,
    purchaseOrderId: bill.purchaseOrderId ?? "",
    purchaseOrder: bill.purchaseOrder,
    materialReceiptId: bill.materialReceiptId ?? "",
    materialReceipt: bill.materialReceipt,
    subWorkId: bill.subWorkId ?? "",
    subWork: bill.subWork,
    billNumber: bill.billNumber,
    billDate: bill.billDate.toISOString().slice(0, 10),
    dueDate: bill.dueDate?.toISOString().slice(0, 10) ?? "",
    billAmount: bill.billAmount.toString(),
    taxableAmount: bill.taxableAmount.toString(),
    gstAmount: bill.gstAmount.toString(),
    totalAmount: bill.totalAmount.toString(),
    paidAmount: bill.paidAmount.toString(),
    outstandingBalance: bill.outstandingBalance.toString(),
    invoiceFileName: bill.invoiceFileName ?? "",
    invoiceFileUrl: bill.invoiceFileUrl ?? "",
    status: bill.status,
    isOverdue,
    notes: bill.notes ?? "",
    payments: bill.payments.map((p) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      paymentDate: p.paymentDate.toISOString(),
      amount: p.amount.toString(),
      mode: p.mode ?? "",
      referenceNumber: p.referenceNumber ?? "",
      attachmentFileName: p.attachmentFileName ?? "",
      attachmentFileUrl: p.attachmentFileUrl ?? "",
      companyBankAccount: p.companyBankAccount,
      vendorBankAccount: p.vendorBankAccount,
      remarks: p.remarks ?? "",
      paidToOtherParty: p.paidToOtherParty,
      paidToName: p.paidToName ?? "",
      paidToReason: p.paidToReason ?? "",
      status: p.status,
    })),
    createdAt: bill.createdAt.toISOString(),
    updatedAt: bill.updatedAt.toISOString(),
  };
}

export async function listVendorBills(companyId: string, query: VendorBillListQuery) {
  const {
    search = "",
    status,
    vendorId,
    projectId,
    fromDate,
    toDate,
    overdue,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.VendorBillWhereInput = {
    companyId,
    ...(parseStatus(status) && { status: parseStatus(status) }),
    ...(vendorId && { vendorId }),
    ...(projectId && { projectId }),
    ...(fromDate || toDate
      ? { billDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(overdue
      ? {
          dueDate: { lt: new Date() },
          status: { in: ["PENDING", "PARTIALLY_PAID"] },
        }
      : {}),
    ...(search && {
      OR: [
        { billNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const allowed = ["billNumber", "billDate", "dueDate", "totalAmount", "outstandingBalance", "status", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "createdAt";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, bills] = await Promise.all([
    prisma.vendorBill.count({ where }),
    prisma.vendorBill.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: bills.map(toDTO) };
}

export async function getVendorBillById(id: string, companyId: string) {
  const bill = await prisma.vendorBill.findFirst({ where: { id, companyId }, include });
  if (!bill) throw new Error("Vendor Bill not found");
  return toDTO(bill);
}

export async function createVendorBill(companyId: string, input: VendorBillFormInput) {
  if (!input.vendorId?.trim()) throw new Error("Vendor is required");

  const vendor = await prisma.vendor.findFirst({ where: { id: input.vendorId, companyId } });
  if (!vendor) throw new Error("Vendor not found");

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

  // Purchase Order and Material Receipt are optional — this company usually skips both.
  if (input.purchaseOrderId) {
    const po = await prisma.purchaseOrder.findFirst({ where: { id: input.purchaseOrderId, companyId } });
    if (!po) throw new Error("Purchase Order not found");
  }

  if (input.materialReceiptId) {
    const mr = await prisma.materialReceipt.findFirst({ where: { id: input.materialReceiptId, companyId } });
    if (!mr) throw new Error("Material Receipt not found");
  }

  let subWorkId: string | null = null;
  if (input.subWorkId) {
    if (!input.projectId) throw new Error("A Sub Work can only be set when a Project is also selected");
    const subWork = await prisma.subWork.findFirst({ where: { id: input.subWorkId, companyId, projectId: input.projectId } });
    if (!subWork) throw new Error("Sub Work not found");
    subWorkId = subWork.id;
  }

  const billAmount = input.billAmount ?? 0;
  const taxableAmount = input.taxableAmount ?? billAmount;
  const gstAmount = input.gstAmount ?? 0;
  const totalAmount = input.totalAmount ?? taxableAmount + gstAmount;
  const status = deriveBillStatus(0, totalAmount);

  const bill = await prisma.vendorBill.create({
    data: {
      companyId,
      vendorId: input.vendorId,
      projectId: input.projectId || null,
      purchaseOrderId: input.purchaseOrderId || null,
      materialReceiptId: input.materialReceiptId || null,
      subWorkId,
      billNumber: input.billNumber?.trim() || autoBillNumber(),
      billDate: input.billDate ? new Date(input.billDate) : new Date(),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      billAmount,
      taxableAmount,
      gstAmount,
      totalAmount,
      paidAmount: 0,
      outstandingBalance: totalAmount,
      invoiceFileName: input.invoiceFileName || null,
      invoiceFileUrl: input.invoiceFileUrl || null,
      status,
      notes: input.notes || null,
    },
    include,
  });

  return toDTO(bill);
}

export async function updateVendorBill(id: string, companyId: string, input: VendorBillFormInput) {
  const existing = await prisma.vendorBill.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Vendor Bill not found");

  if (existing.status === "CANCELLED") {
    throw new Error("Cannot edit a cancelled vendor bill");
  }

  if (input.vendorId) {
    const vendor = await prisma.vendor.findFirst({ where: { id: input.vendorId, companyId } });
    if (!vendor) throw new Error("Vendor not found");
  }

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

  if (input.purchaseOrderId) {
    const po = await prisma.purchaseOrder.findFirst({ where: { id: input.purchaseOrderId, companyId } });
    if (!po) throw new Error("Purchase Order not found");
  }

  if (input.materialReceiptId) {
    const mr = await prisma.materialReceipt.findFirst({ where: { id: input.materialReceiptId, companyId } });
    if (!mr) throw new Error("Material Receipt not found");
  }

  const effectiveProjectId = input.projectId || existing.projectId;
  let subWorkId: string | null = existing.subWorkId;
  if (input.subWorkId !== undefined) {
    if (input.subWorkId) {
      if (!effectiveProjectId) throw new Error("A Sub Work can only be set when a Project is also selected");
      const subWork = await prisma.subWork.findFirst({ where: { id: input.subWorkId, companyId, projectId: effectiveProjectId } });
      if (!subWork) throw new Error("Sub Work not found");
      subWorkId = subWork.id;
    } else {
      subWorkId = null;
    }
  }

  const billAmount = input.billAmount ?? Number(existing.billAmount);
  const taxableAmount = input.taxableAmount ?? Number(existing.taxableAmount);
  const gstAmount = input.gstAmount ?? Number(existing.gstAmount);
  const totalAmount = input.totalAmount ?? taxableAmount + gstAmount;
  const paidAmount = Number(existing.paidAmount);

  if (totalAmount < paidAmount) {
    throw new Error(
      `Total amount (${totalAmount}) cannot be less than the amount already paid (${paidAmount})`
    );
  }

  const outstandingBalance = totalAmount - paidAmount;
  const status = deriveBillStatus(paidAmount, totalAmount);

  const bill = await prisma.vendorBill.update({
    where: { id },
    data: {
      vendorId: input.vendorId || existing.vendorId,
      projectId: input.projectId || null,
      purchaseOrderId: input.purchaseOrderId || null,
      materialReceiptId: input.materialReceiptId || null,
      subWorkId,
      billDate: input.billDate ? new Date(input.billDate) : undefined,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      billAmount,
      taxableAmount,
      gstAmount,
      totalAmount,
      outstandingBalance,
      invoiceFileName: input.invoiceFileName || null,
      invoiceFileUrl: input.invoiceFileUrl || null,
      status,
      notes: input.notes || null,
    },
    include,
  });

  return toDTO(bill);
}

/** Records a payment against a bill, updates paidAmount/outstandingBalance, and derives the new status. */
export async function recordVendorBillPayment(id: string, companyId: string, input: RecordPaymentInput) {
  const existing = await prisma.vendorBill.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Vendor Bill not found");

  if (existing.status === "CANCELLED") {
    throw new Error("Cannot record a payment against a cancelled vendor bill");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const currentOutstanding = Number(existing.totalAmount) - Number(existing.paidAmount);
  if (input.amount > currentOutstanding) {
    throw new Error(`Payment amount (${input.amount}) exceeds outstanding balance (${currentOutstanding})`);
  }

  if (!input.mode?.trim()) throw new Error("Payment mode is required");
  const mode = parseMode(input.mode);

  let companyBankAccountId: string | null = null;
  let vendorBankAccountId: string | null = null;

  if (mode !== "CASH") {
    if (!input.companyBankAccountId?.trim()) throw new Error("Company bank account is required for non-cash payments");
    if (!input.vendorBankAccountId?.trim()) throw new Error("Vendor bank account is required for non-cash payments");

    const companyAccount = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
    if (!companyAccount) throw new Error("Company bank account not found");

    const vendorAccount = await prisma.vendorBankAccount.findFirst({
      where: { id: input.vendorBankAccountId, companyId, vendorId: existing.vendorId },
    });
    if (!vendorAccount) throw new Error("Vendor bank account not found");

    companyBankAccountId = companyAccount.id;
    vendorBankAccountId = vendorAccount.id;
  }

  if (input.paidToOtherParty && !input.paidToName?.trim()) {
    throw new Error("Paid To is required when paying another person on the vendor's behalf");
  }

  const newPaidAmount = Number(existing.paidAmount) + input.amount;
  const newOutstanding = Number(existing.totalAmount) - newPaidAmount;
  const newStatus = deriveBillStatus(newPaidAmount, Number(existing.totalAmount));

  const bill = await prisma.$transaction(async (tx) => {
    await tx.vendorPayment.create({
      data: {
        companyId,
        projectId: existing.projectId,
        vendorId: existing.vendorId,
        vendorBillId: id,
        companyBankAccountId,
        vendorBankAccountId,
        paymentNumber: autoPaymentNumber(),
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        amount: input.amount,
        mode,
        referenceNumber: input.referenceNumber || null,
        attachmentFileName: input.attachmentFileName || null,
        attachmentFileUrl: input.attachmentFileUrl || null,
        remarks: input.remarks || null,
        paidToOtherParty: !!input.paidToOtherParty,
        paidToName: input.paidToOtherParty ? input.paidToName!.trim() : null,
        paidToReason: input.paidToOtherParty ? input.paidToReason || null : null,
        status: "PAID" as PaymentStatus,
      },
    });

    return tx.vendorBill.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        outstandingBalance: newOutstanding,
        status: newStatus,
      },
      include,
    });
  });

  return toDTO(bill);
}

export async function cancelVendorBill(id: string, companyId: string) {
  const existing = await prisma.vendorBill.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Vendor Bill not found");

  if (Number(existing.paidAmount) > 0) {
    throw new Error("Cannot cancel a vendor bill that already has recorded payments");
  }

  const bill = await prisma.vendorBill.update({
    where: { id },
    data: { status: "CANCELLED" },
    include,
  });

  return toDTO(bill);
}

export async function deleteVendorBill(id: string, companyId: string) {
  const existing = await prisma.vendorBill.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Vendor Bill not found");

  const paymentCount = await prisma.vendorPayment.count({ where: { vendorBillId: id } });
  if (paymentCount > 0) {
    throw new Error("Cannot delete a vendor bill that already has recorded payments. Cancel it instead.");
  }

  return prisma.vendorBill.delete({ where: { id } });
}

export async function getVendorBillDashboard(companyId: string) {
  const [statusCounts, outstandingAgg, overdueBills, recentBills] = await Promise.all([
    prisma.vendorBill.groupBy({
      by: ["status"],
      where: { companyId },
      _count: { _all: true },
    }),
    prisma.vendorBill.aggregate({
      where: { companyId, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true, paidAmount: true, outstandingBalance: true },
    }),
    prisma.vendorBill.findMany({
      where: {
        companyId,
        status: { in: ["PENDING", "PARTIALLY_PAID"] },
        dueDate: { lt: new Date() },
      },
      include,
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.vendorBill.findMany({
      where: { companyId },
      include,
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const countsByStatus: Record<string, number> = { PENDING: 0, PARTIALLY_PAID: 0, PAID: 0, CANCELLED: 0 };
  for (const row of statusCounts) {
    countsByStatus[row.status] = row._count._all;
  }

  const overdueAmount = overdueBills.reduce((sum, b) => sum + Number(b.outstandingBalance), 0);

  return {
    totalBills: statusCounts.reduce((sum, r) => sum + r._count._all, 0),
    countsByStatus,
    totalBilled: (outstandingAgg._sum.totalAmount ?? new Prisma.Decimal(0)).toString(),
    totalPaid: (outstandingAgg._sum.paidAmount ?? new Prisma.Decimal(0)).toString(),
    totalOutstanding: (outstandingAgg._sum.outstandingBalance ?? new Prisma.Decimal(0)).toString(),
    overdueCount: overdueBills.length,
    overdueAmount: overdueAmount.toString(),
    overdueBills: overdueBills.map(toDTO),
    recentBills: recentBills.map(toDTO),
  };
}

export async function exportVendorBillsToCSV(companyId: string, query: VendorBillListQuery) {
  const { data } = await listVendorBills(companyId, { ...query, page: 1, limit: 5000 });

  const headers = [
    "Bill Number",
    "Vendor",
    "Project",
    "Bill Date",
    "Due Date",
    "Bill Amount",
    "Taxable Amount",
    "GST",
    "Total Amount",
    "Paid Amount",
    "Outstanding Balance",
    "Status",
  ];

  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = data.map((bill) =>
    [
      bill.billNumber,
      bill.vendor?.name ?? "",
      bill.project?.name ?? "",
      bill.billDate,
      bill.dueDate,
      bill.billAmount,
      bill.taxableAmount,
      bill.gstAmount,
      bill.totalAmount,
      bill.paidAmount,
      bill.outstandingBalance,
      bill.status,
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
