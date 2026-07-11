import prisma from "../config/prisma.js";
import { Prisma, BillStatus, BillType, DeductionType } from "@prisma/client";
import { PAYMENT_MODES } from "./vendor-bill.service.js";

/**
 * Running Bill — the client-billing module. There is deliberately no separate "Client
 * Billing" module: every Running Bill is generated from exactly one APPROVED Measurement
 * Book (enforced by the @unique on RunningBill.measurementBookId). Quantities, BOQ items,
 * rates, and Payment % are never re-entered — they're copied from the MB's items here, with
 * previousQuantity computed as the running cumulative total already certified for the same
 * boqItemNo across every earlier Running Bill on the same project. This is the one place
 * that math is ever done; everything downstream (reports, exports, the frontend) only reads
 * the stored, already-computed figures.
 *
 * Workflow: Measurement Book -> Running Bill (Draft -> Submitted -> Passed) -> Payment
 * Received (Partly Paid / Fully Paid). PARTLY_PAID/FULLY_PAID are never set directly —
 * see deriveRunningBillStatus.
 */

export const RB_STATUSES = ["DRAFT", "SUBMITTED", "PASSED", "PARTLY_PAID", "FULLY_PAID"];

export const RB_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PASSED: "Passed",
  PARTLY_PAID: "Partly Paid",
  FULLY_PAID: "Fully Paid",
};

export const BILL_TYPES = ["RA_BILL", "FINAL_BILL", "ADVANCE_BILL"];

export const BILL_TYPE_LABELS: Record<string, string> = {
  RA_BILL: "RA Bill",
  FINAL_BILL: "Final Bill",
  ADVANCE_BILL: "Advance Bill",
};

export const DEDUCTION_TYPES = ["SECURITY_DEPOSIT", "GST", "LABOUR_CESS", "ROYALTY", "TDS", "MOBILIZATION_RECOVERY", "OTHER"];

export const DEDUCTION_TYPE_LABELS: Record<string, string> = {
  SECURITY_DEPOSIT: "Security Deposit",
  GST: "GST",
  LABOUR_CESS: "Labour Cess",
  ROYALTY: "Royalty",
  TDS: "TDS",
  MOBILIZATION_RECOVERY: "Mobilization Recovery",
  OTHER: "Other Recovery",
};

export { PAYMENT_MODES };

export interface RunningBillDeductionInput {
  type: string;
  label?: string;
  amount: number;
  remarks?: string;
}

export interface RunningBillFormInput {
  measurementBookId: string;
  billNumber: string;
  billType?: string;
  site?: string;
  billPeriodFrom?: string;
  billPeriodTo?: string;
  billDate?: string;
  remarks?: string;
  deductions?: RunningBillDeductionInput[];
}

export interface RunningBillListQuery {
  search?: string;
  projectId?: string;
  siteId?: string;
  subWorkId?: string;
  status?: string;
  billType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface RecordRunningBillPaymentInput {
  amount: number;
  paymentDate?: string;
  mode: string;
  companyBankAccountId?: string;
  referenceNumber?: string;
  remarks?: string;
}

interface ReportDateQuery {
  projectId?: string;
  fromDate?: string;
  toDate?: string;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

function parseBillType(s: string | undefined): BillType {
  return s && BILL_TYPES.includes(s.toUpperCase()) ? (s.toUpperCase() as BillType) : "RA_BILL";
}

function parsePaymentMode(m: string): string {
  const upper = m.trim().toUpperCase();
  if (!PAYMENT_MODES.includes(upper)) {
    throw new Error(`Invalid payment mode: ${m}. Must be one of ${PAYMENT_MODES.join(", ")}`);
  }
  return upper;
}

function autoPaymentNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `RBP-${y}${m}-${rand}`;
}

/** Bill/payment status is always derived from received-vs-payable once a bill is Passed — never set directly by the client. */
function deriveRunningBillStatus(currentStatus: BillStatus, amountReceived: number, netPayable: number): BillStatus {
  if (currentStatus === "DRAFT" || currentStatus === "SUBMITTED") return currentStatus;
  if (amountReceived <= 0) return "PASSED";
  if (amountReceived >= netPayable) return "FULLY_PAID";
  return "PARTLY_PAID";
}

const include = {
  project: { select: { id: true, name: true, location: true, contractValue: true } },
  subWork: { select: { id: true, name: true } },
  measurementBook: { select: { id: true, mbNumber: true, mbDate: true } },
  createdBy: { select: { id: true, name: true } },
  items: { orderBy: { sortOrder: "asc" as const } },
  deductions: true,
};

type RBRow = Prisma.RunningBillGetPayload<{ include: typeof include }>;
type RBItemRow = RBRow["items"][number];
type RBDeductionRow = RBRow["deductions"][number];

function itemToDTO(item: RBItemRow) {
  return {
    id: item.id,
    sortOrder: item.sortOrder,
    boqItemNo: item.boqItemNo,
    boqDescription: item.boqDescription,
    unit: item.unit,
    previousQuantity: item.previousQuantity.toString(),
    currentQuantity: item.currentQuantity.toString(),
    totalQuantity: item.totalQuantity.toString(),
    boqRate: item.boqRate.toString(),
    paymentPercent: item.paymentPercent.toString(),
    effectiveRate: item.effectiveRate.toString(),
    previousAmount: item.previousAmount.toString(),
    currentAmount: item.currentAmount.toString(),
    totalAmount: item.totalAmount.toString(),
    remarks: item.remarks ?? "",
  };
}

function deductionToDTO(d: RBDeductionRow) {
  return {
    id: d.id,
    type: d.type,
    label: d.label,
    amount: d.amount.toString(),
    remarks: d.remarks ?? "",
  };
}

function toDTO(bill: RBRow) {
  return {
    id: bill.id,
    companyId: bill.companyId,
    projectId: bill.projectId,
    project: bill.project,
    siteId: bill.siteId,
    subWorkId: bill.subWorkId ?? "",
    subWork: bill.subWork,
    measurementBookId: bill.measurementBookId,
    measurementBook: bill.measurementBook,
    billNumber: bill.billNumber,
    billType: bill.billType,
    site: bill.site ?? bill.project.location ?? "",
    billPeriodFrom: bill.billPeriodFrom ? bill.billPeriodFrom.toISOString().slice(0, 10) : "",
    billPeriodTo: bill.billPeriodTo ? bill.billPeriodTo.toISOString().slice(0, 10) : "",
    billDate: bill.billDate.toISOString().slice(0, 10),
    previousCertifiedAmount: bill.previousCertifiedAmount.toString(),
    currentCertifiedAmount: bill.currentCertifiedAmount.toString(),
    totalCertifiedAmount: bill.totalCertifiedAmount.toString(),
    totalDeductions: bill.totalDeductions.toString(),
    netPayable: bill.netPayable.toString(),
    amountReceived: bill.amountReceived.toString(),
    outstandingAmount: bill.outstandingAmount.toString(),
    status: bill.status,
    submittedAt: bill.submittedAt ? bill.submittedAt.toISOString() : "",
    passedAt: bill.passedAt ? bill.passedAt.toISOString() : "",
    remarks: bill.remarks ?? "",
    items: bill.items.map(itemToDTO),
    deductions: bill.deductions.map(deductionToDTO),
    createdById: bill.createdById,
    createdBy: bill.createdBy,
    createdAt: bill.createdAt.toISOString(),
    updatedAt: bill.updatedAt.toISOString(),
  };
}

/** Sums, per boqItemNo, currentQuantity across every OTHER Running Bill already raised for this project — the cumulative "already certified" total. */
async function computePreviousQuantities(companyId: string, projectId: string, boqItemNos: string[], excludeRunningBillId?: string) {
  if (!boqItemNos.length) return new Map<string, number>();

  const rows = await prisma.runningBillItem.findMany({
    where: {
      companyId,
      boqItemNo: { in: boqItemNos },
      runningBill: { projectId, ...(excludeRunningBillId ? { id: { not: excludeRunningBillId } } : {}) },
    },
    select: { boqItemNo: true, currentQuantity: true },
  });

  const map = new Map<string, number>();
  for (const r of rows) map.set(r.boqItemNo, (map.get(r.boqItemNo) ?? 0) + Number(r.currentQuantity));
  return map;
}

interface MBItemSource {
  boqItemNo: string;
  boqDescription: string;
  unit: string;
  quantity: Prisma.Decimal;
  boqRate: Prisma.Decimal;
  paymentPercent: Prisma.Decimal;
  effectiveRate: Prisma.Decimal;
  remarks: string | null;
}

/** The one place Previous/Current/Total Quantity and Amount are computed for a Running Bill's Abstract — never trust a client-sent value for these. */
async function buildItemsFromMB(companyId: string, projectId: string, mbItems: MBItemSource[], excludeRunningBillId?: string) {
  const boqItemNos = mbItems.map((i) => i.boqItemNo);
  const previousMap = await computePreviousQuantities(companyId, projectId, boqItemNos, excludeRunningBillId);

  return mbItems.map((item, index) => {
    const currentQuantity = round4(Number(item.quantity));
    const previousQuantity = round4(previousMap.get(item.boqItemNo) ?? 0);
    const totalQuantity = round4(previousQuantity + currentQuantity);
    const boqRate = Number(item.boqRate);
    const paymentPercent = Number(item.paymentPercent);
    const effectiveRate = Number(item.effectiveRate);
    const previousAmount = round2(previousQuantity * effectiveRate);
    const currentAmount = round2(currentQuantity * effectiveRate);
    const totalAmount = round2(totalQuantity * effectiveRate);

    return {
      sortOrder: index,
      boqItemNo: item.boqItemNo,
      boqDescription: item.boqDescription,
      unit: item.unit,
      previousQuantity,
      currentQuantity,
      totalQuantity,
      boqRate,
      paymentPercent,
      effectiveRate,
      previousAmount,
      currentAmount,
      totalAmount,
      remarks: item.remarks || null,
    };
  });
}

function buildDeductions(input: RunningBillDeductionInput[] | undefined) {
  return (input ?? []).map((d) => {
    const type = DEDUCTION_TYPES.includes((d.type ?? "").toUpperCase()) ? ((d.type ?? "").toUpperCase() as DeductionType) : ("OTHER" as DeductionType);
    const amount = Number(d.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("Every deduction amount must be a number greater than or equal to zero");
    const label = d.label?.trim() || DEDUCTION_TYPE_LABELS[type];
    return { type, label, amount: round2(amount), remarks: d.remarks || null };
  });
}

export async function listRunningBills(companyId: string, query: RunningBillListQuery) {
  const { search = "", projectId, siteId, subWorkId, status, billType, fromDate, toDate, page = 1, limit = 20, sortBy = "billDate", sortOrder = "desc" } = query;

  const where: Prisma.RunningBillWhereInput = {
    companyId,
    ...(projectId && { projectId }),
    ...(siteId && { siteId }),
    ...(subWorkId && { subWorkId }),
    ...(status && RB_STATUSES.includes(status.toUpperCase()) && { status: status.toUpperCase() as BillStatus }),
    ...(billType && BILL_TYPES.includes(billType.toUpperCase()) && { billType: billType.toUpperCase() as BillType }),
    ...(fromDate || toDate ? { billDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } } : {}),
    ...(search && {
      OR: [
        { billNumber: { contains: search, mode: "insensitive" } },
        { remarks: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const allowed = ["billDate", "billNumber", "netPayable", "outstandingAmount", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "billDate";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, bills] = await Promise.all([
    prisma.runningBill.count({ where }),
    prisma.runningBill.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: bills.map(toDTO) };
}

export async function getRunningBillById(id: string, companyId: string) {
  const bill = await prisma.runningBill.findFirst({ where: { id, companyId }, include });
  if (!bill) throw new Error("Running Bill not found");
  return toDTO(bill);
}

/** Bills the linked MB's items are only ever available to bill once an eligible, unlinked, APPROVED MB is chosen server-side. */
export async function listBillableMeasurementBooks(companyId: string, projectId?: string) {
  const mbs = await prisma.measurementBook.findMany({
    where: { companyId, status: "APPROVED", runningBill: null, ...(projectId && { projectId }) },
    select: {
      id: true,
      mbNumber: true,
      mbDate: true,
      project: { select: { id: true, name: true } },
      subWork: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { mbDate: "desc" },
  });

  return mbs.map((mb) => ({
    id: mb.id,
    mbNumber: mb.mbNumber,
    mbDate: mb.mbDate.toISOString().slice(0, 10),
    project: mb.project,
    subWork: mb.subWork,
    itemCount: mb._count.items,
  }));
}

export async function createRunningBill(companyId: string, createdById: string, input: RunningBillFormInput) {
  if (!input.measurementBookId?.trim()) throw new Error("Measurement Book is required");
  if (!input.billNumber?.trim()) throw new Error("Running Bill No. is required");

  const mb = await prisma.measurementBook.findFirst({
    where: { id: input.measurementBookId, companyId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!mb) throw new Error("Measurement Book not found");
  if (mb.status !== "APPROVED") throw new Error("Only an Approved Measurement Book can be billed");
  if (!mb.items.length) throw new Error("This Measurement Book has no BOQ rows to bill");

  const alreadyLinked = await prisma.runningBill.findFirst({ where: { measurementBookId: mb.id } });
  if (alreadyLinked) throw new Error(`This Measurement Book is already linked to Running Bill ${alreadyLinked.billNumber}`);

  const existingNumber = await prisma.runningBill.findFirst({ where: { companyId, billNumber: input.billNumber.trim() } });
  if (existingNumber) throw new Error(`Running Bill No. "${input.billNumber}" already exists`);

  const items = await buildItemsFromMB(companyId, mb.projectId, mb.items);
  const deductions = buildDeductions(input.deductions);

  const previousCertifiedAmount = round2(items.reduce((s, i) => s + i.previousAmount, 0));
  const currentCertifiedAmount = round2(items.reduce((s, i) => s + i.currentAmount, 0));
  const totalCertifiedAmount = round2(items.reduce((s, i) => s + i.totalAmount, 0));
  const totalDeductions = round2(deductions.reduce((s, d) => s + d.amount, 0));
  const netPayable = round2(currentCertifiedAmount - totalDeductions);

  const bill = await prisma.$transaction(async (tx) => {
    const created = await tx.runningBill.create({
      data: {
        companyId,
        projectId: mb.projectId,
        siteId: mb.siteId,
        subWorkId: mb.subWorkId,
        measurementBookId: mb.id,
        billNumber: input.billNumber.trim(),
        billType: parseBillType(input.billType),
        site: input.site || mb.site,
        billPeriodFrom: input.billPeriodFrom ? new Date(input.billPeriodFrom) : null,
        billPeriodTo: input.billPeriodTo ? new Date(input.billPeriodTo) : null,
        billDate: input.billDate ? new Date(input.billDate) : new Date(),
        previousCertifiedAmount,
        currentCertifiedAmount,
        totalCertifiedAmount,
        totalDeductions,
        netPayable,
        amountReceived: 0,
        outstandingAmount: netPayable,
        status: "DRAFT",
        remarks: input.remarks || null,
        createdById,
      },
    });

    await tx.runningBillItem.createMany({ data: items.map((i) => ({ ...i, companyId, runningBillId: created.id })) });
    if (deductions.length) {
      await tx.runningBillDeduction.createMany({ data: deductions.map((d) => ({ ...d, companyId, runningBillId: created.id })) });
    }

    return tx.runningBill.findFirstOrThrow({ where: { id: created.id }, include });
  });

  return toDTO(bill);
}

export async function updateRunningBill(id: string, companyId: string, input: Partial<RunningBillFormInput>) {
  const existing = await prisma.runningBill.findFirst({
    where: { id, companyId },
    include: { measurementBook: { include: { items: { orderBy: { sortOrder: "asc" } } } } },
  });
  if (!existing) throw new Error("Running Bill not found");
  if (existing.status !== "DRAFT") throw new Error("Only a Draft Running Bill can be edited");

  if (input.billNumber && input.billNumber.trim() !== existing.billNumber) {
    const clash = await prisma.runningBill.findFirst({ where: { companyId, billNumber: input.billNumber.trim(), id: { not: id } } });
    if (clash) throw new Error(`Running Bill No. "${input.billNumber}" already exists`);
  }

  const items = await buildItemsFromMB(companyId, existing.projectId, existing.measurementBook.items, id);
  const deductions = input.deductions !== undefined ? buildDeductions(input.deductions) : null;

  const previousCertifiedAmount = round2(items.reduce((s, i) => s + i.previousAmount, 0));
  const currentCertifiedAmount = round2(items.reduce((s, i) => s + i.currentAmount, 0));
  const totalCertifiedAmount = round2(items.reduce((s, i) => s + i.totalAmount, 0));

  const bill = await prisma.$transaction(async (tx) => {
    await tx.runningBillItem.deleteMany({ where: { runningBillId: id } });
    await tx.runningBillItem.createMany({ data: items.map((i) => ({ ...i, companyId, runningBillId: id })) });

    if (deductions !== null) {
      await tx.runningBillDeduction.deleteMany({ where: { runningBillId: id } });
      if (deductions.length) {
        await tx.runningBillDeduction.createMany({ data: deductions.map((d) => ({ ...d, companyId, runningBillId: id })) });
      }
    }

    const effectiveDeductions =
      deductions !== null ? deductions.map((d) => d.amount) : (await tx.runningBillDeduction.findMany({ where: { runningBillId: id }, select: { amount: true } })).map((d) => Number(d.amount));
    const totalDeductions = round2(effectiveDeductions.reduce((s, a) => s + a, 0));
    const netPayable = round2(currentCertifiedAmount - totalDeductions);

    const updated = await tx.runningBill.update({
      where: { id },
      data: {
        billNumber: input.billNumber?.trim() || existing.billNumber,
        billType: input.billType !== undefined ? parseBillType(input.billType) : existing.billType,
        site: input.site !== undefined ? input.site || null : existing.site,
        billPeriodFrom: input.billPeriodFrom !== undefined ? (input.billPeriodFrom ? new Date(input.billPeriodFrom) : null) : existing.billPeriodFrom,
        billPeriodTo: input.billPeriodTo !== undefined ? (input.billPeriodTo ? new Date(input.billPeriodTo) : null) : existing.billPeriodTo,
        billDate: input.billDate ? new Date(input.billDate) : existing.billDate,
        remarks: input.remarks !== undefined ? input.remarks || null : existing.remarks,
        previousCertifiedAmount,
        currentCertifiedAmount,
        totalCertifiedAmount,
        totalDeductions,
        netPayable,
        outstandingAmount: netPayable,
      },
    });

    return tx.runningBill.findFirstOrThrow({ where: { id: updated.id }, include });
  });

  return toDTO(bill);
}

/** Hard delete only allowed pre-Submission — once Submitted a bill has entered the certification workflow and is never removable. */
export async function deleteRunningBill(id: string, companyId: string) {
  const existing = await prisma.runningBill.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Running Bill not found");
  if (existing.status !== "DRAFT") throw new Error("Only a Draft Running Bill can be deleted");

  await prisma.$transaction([
    prisma.runningBillItem.deleteMany({ where: { runningBillId: id } }),
    prisma.runningBillDeduction.deleteMany({ where: { runningBillId: id } }),
    prisma.runningBill.delete({ where: { id } }),
  ]);
}

export async function submitRunningBill(id: string, companyId: string) {
  const existing = await prisma.runningBill.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Running Bill not found");
  if (existing.status !== "DRAFT") throw new Error("Only a Draft Running Bill can be submitted");

  const bill = await prisma.runningBill.update({ where: { id }, data: { status: "SUBMITTED", submittedAt: new Date() }, include });
  return toDTO(bill);
}

export async function passRunningBill(id: string, companyId: string) {
  const existing = await prisma.runningBill.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Running Bill not found");
  if (existing.status !== "SUBMITTED") throw new Error("Only a Submitted Running Bill can be Passed");

  const bill = await prisma.runningBill.update({ where: { id }, data: { status: "PASSED", passedAt: new Date() }, include });
  return toDTO(bill);
}

const paymentInclude = {
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true, ifscCode: true } },
  runningBill: { select: { id: true, billNumber: true } },
  project: { select: { id: true, name: true } },
};

type RBPaymentRow = Prisma.RunningBillPaymentGetPayload<{ include: typeof paymentInclude }>;

function paymentToDTO(p: RBPaymentRow) {
  return {
    id: p.id,
    runningBillId: p.runningBillId,
    runningBill: p.runningBill,
    projectId: p.projectId,
    project: p.project,
    companyBankAccountId: p.companyBankAccountId ?? "",
    companyBankAccount: p.companyBankAccount,
    paymentNumber: p.paymentNumber,
    paymentDate: p.paymentDate.toISOString().slice(0, 10),
    amount: p.amount.toString(),
    mode: p.mode ?? "",
    referenceNumber: p.referenceNumber ?? "",
    remarks: p.remarks ?? "",
    createdAt: p.createdAt.toISOString(),
  };
}

/** Records a payment received against a bill; updates amountReceived/outstandingAmount and derives the new status. Feeds Bank Reconciliation via companyBankAccountId. */
export async function recordRunningBillPayment(id: string, companyId: string, createdById: string, input: RecordRunningBillPaymentInput) {
  const existing = await prisma.runningBill.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Running Bill not found");
  if (existing.status === "DRAFT" || existing.status === "SUBMITTED") {
    throw new Error("Running Bill must be Passed before recording a payment");
  }
  if (existing.status === "FULLY_PAID") throw new Error("Running Bill is already fully paid");

  if (!input.amount || input.amount <= 0) throw new Error("Payment amount must be greater than zero");
  const currentOutstanding = Number(existing.outstandingAmount);
  if (input.amount > currentOutstanding) {
    throw new Error(`Payment amount (${input.amount}) exceeds outstanding balance (${currentOutstanding})`);
  }

  if (!input.mode?.trim()) throw new Error("Payment mode is required");
  const mode = parsePaymentMode(input.mode);

  let companyBankAccountId: string | null = null;
  if (mode !== "CASH") {
    if (!input.companyBankAccountId?.trim()) throw new Error("Company bank account is required for non-cash payments");
    const account = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
    if (!account) throw new Error("Company bank account not found");
    companyBankAccountId = account.id;
  }

  const newAmountReceived = round2(Number(existing.amountReceived) + input.amount);
  const newOutstanding = round2(Number(existing.netPayable) - newAmountReceived);
  const newStatus = deriveRunningBillStatus(existing.status, newAmountReceived, Number(existing.netPayable));

  const { bill, paymentId } = await prisma.$transaction(async (tx) => {
    const created = await tx.runningBillPayment.create({
      data: {
        companyId,
        runningBillId: id,
        projectId: existing.projectId,
        companyBankAccountId,
        paymentNumber: autoPaymentNumber(),
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        amount: input.amount,
        mode,
        referenceNumber: input.referenceNumber || null,
        remarks: input.remarks || null,
        createdById,
      },
    });

    const updated = await tx.runningBill.update({
      where: { id },
      data: { amountReceived: newAmountReceived, outstandingAmount: newOutstanding, status: newStatus },
      include,
    });
    return { bill: updated, paymentId: created.id };
  });

  return { ...toDTO(bill), paymentId };
}

export async function listRunningBillPayments(runningBillId: string, companyId: string) {
  const bill = await prisma.runningBill.findFirst({ where: { id: runningBillId, companyId } });
  if (!bill) throw new Error("Running Bill not found");

  const payments = await prisma.runningBillPayment.findMany({ where: { runningBillId, companyId }, include: paymentInclude, orderBy: { paymentDate: "desc" } });
  return payments.map(paymentToDTO);
}

function dateRangeWhere(query: ReportDateQuery) {
  const { fromDate, toDate } = query;
  if (!fromDate && !toDate) return undefined;
  return { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) };
}

/** Report: Running Bill Register — one row per Running Bill with full figures. */
export async function getRunningBillRegisterReport(companyId: string, query: ReportDateQuery & { status?: string }) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.RunningBillWhereInput = {
    companyId,
    ...(query.projectId && { projectId: query.projectId }),
    ...(query.status && RB_STATUSES.includes(query.status.toUpperCase()) && { status: query.status.toUpperCase() as BillStatus }),
    ...(dateRange && { billDate: dateRange }),
  };

  const bills = await prisma.runningBill.findMany({ where, include, orderBy: { billDate: "desc" } });
  return bills.map(toDTO);
}

/** Report: Outstanding Bills — Passed/Partly Paid bills with a balance still due. */
export async function getOutstandingBillsReport(companyId: string, query: { projectId?: string }) {
  const bills = await prisma.runningBill.findMany({
    where: { companyId, status: { in: ["PASSED", "PARTLY_PAID"] }, ...(query.projectId && { projectId: query.projectId }) },
    include,
    orderBy: { billDate: "asc" },
  });

  return bills.map((b) => {
    const dto = toDTO(b);
    return {
      id: dto.id,
      billNumber: dto.billNumber,
      billDate: dto.billDate,
      project: dto.project,
      subWork: dto.subWork,
      status: dto.status,
      netPayable: dto.netPayable,
      amountReceived: dto.amountReceived,
      outstandingAmount: dto.outstandingAmount,
      daysOutstanding: Math.floor((Date.now() - b.billDate.getTime()) / (1000 * 60 * 60 * 24)),
    };
  });
}

/** Report: Payment Register — every payment received, flattened across bills. */
export async function getPaymentRegisterReport(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const payments = await prisma.runningBillPayment.findMany({
    where: { companyId, ...(query.projectId && { projectId: query.projectId }), ...(dateRange && { paymentDate: dateRange }) },
    include: paymentInclude,
    orderBy: { paymentDate: "desc" },
  });

  return payments.map(paymentToDTO);
}

/** Report: Recovery Register — every deduction row, flattened across bills. */
export async function getRecoveryRegisterReport(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const bills = await prisma.runningBill.findMany({
    where: { companyId, ...(query.projectId && { projectId: query.projectId }), ...(dateRange && { billDate: dateRange }) },
    include: { deductions: true, project: { select: { id: true, name: true } } },
    orderBy: { billDate: "desc" },
  });

  return bills.flatMap((b) =>
    b.deductions.map((d) => ({
      billId: b.id,
      billNumber: b.billNumber,
      billDate: b.billDate.toISOString().slice(0, 10),
      project: b.project.name,
      type: d.type,
      label: d.label,
      amount: d.amount.toString(),
      remarks: d.remarks ?? "",
    }))
  );
}

/** Report: Project Billing Summary — Contract Value vs cumulative certified/received/outstanding, per project. */
export async function getProjectBillingSummaryReport(companyId: string, query: { projectId?: string }) {
  const projects = await prisma.project.findMany({
    where: { companyId, ...(query.projectId && { id: query.projectId }) },
    select: { id: true, name: true, contractValue: true },
    orderBy: { name: "asc" },
  });

  const bills = await prisma.runningBill.findMany({
    where: { companyId, status: { not: "DRAFT" }, ...(query.projectId && { projectId: query.projectId }) },
    select: { projectId: true, totalCertifiedAmount: true, amountReceived: true, outstandingAmount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byProject = new Map<string, { billsCount: number; totalCertified: number; totalReceived: number; totalOutstanding: number }>();
  for (const b of bills) {
    const bucket = byProject.get(b.projectId) ?? { billsCount: 0, totalCertified: 0, totalReceived: 0, totalOutstanding: 0 };
    bucket.billsCount += 1;
    // totalCertifiedAmount is already the running cumulative-to-date figure on each bill, so the
    // latest bill (bills are queried oldest-first) always overwrites with the up-to-date total.
    bucket.totalCertified = Number(b.totalCertifiedAmount);
    bucket.totalReceived += Number(b.amountReceived);
    bucket.totalOutstanding += Number(b.outstandingAmount);
    byProject.set(b.projectId, bucket);
  }

  return projects.map((p) => {
    const bucket = byProject.get(p.id) ?? { billsCount: 0, totalCertified: 0, totalReceived: 0, totalOutstanding: 0 };
    const contractValue = Number(p.contractValue);
    return {
      projectId: p.id,
      projectName: p.name,
      contractValue: contractValue.toFixed(2),
      billsSubmittedCount: bucket.billsCount,
      totalBillsSubmitted: bucket.totalCertified.toFixed(2),
      totalAmountReceived: bucket.totalReceived.toFixed(2),
      outstandingAmount: bucket.totalOutstanding.toFixed(2),
      balanceContractValue: (contractValue - bucket.totalCertified).toFixed(2),
    };
  });
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** CSV Export — the Running Bill Register (the most detailed, bill-level view). */
export async function exportRunningBillRegisterToCSV(companyId: string, query: ReportDateQuery & { status?: string }) {
  const rows = await getRunningBillRegisterReport(companyId, query);

  const headers = [
    "Bill Number", "Bill Date", "Project", "Sub Work", "Bill Type", "Status",
    "Previous Certified", "Current Certified", "Total Certified",
    "Total Deductions", "Net Payable", "Amount Received", "Outstanding",
  ];

  const csvRows = rows.map((r) =>
    [
      r.billNumber, r.billDate, r.project?.name ?? "", r.subWork?.name ?? "", r.billType, r.status,
      r.previousCertifiedAmount, r.currentCertifiedAmount, r.totalCertifiedAmount,
      r.totalDeductions, r.netPayable, r.amountReceived, r.outstandingAmount,
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
}
