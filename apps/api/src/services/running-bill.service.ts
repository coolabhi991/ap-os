import prisma from "../config/prisma.js";
import { Prisma, BillStatus, BillType, DeductionType } from "@prisma/client";
import { PAYMENT_MODES } from "./vendor-bill.service.js";
import { createSiteBillItem } from "./site-bill-item.service.js";
import { sourceBankTransactionSelect, toSourceBankTransactionDTO } from "../utils/bank-traceability.js";

/**
 * Running Bill — the client-billing module, and the direct system representation of one
 * Government Form No. 58 (one RA Bill = one Form 58 = one RunningBill row). Two ways a bill can
 * be created:
 *  - Form 58 flow (current, primary): createRunningBillFromForm58 — items are drawn from the
 *    Site's Bill Item Master (SiteBillItem), auto-carrying Previous Quantity forward; a brand new
 *    item entered on any bill is added to the master automatically. raSequence orders bills
 *    per-Site (RA Bill 1, 2, 3...), independent of every other Site's numbering.
 *  - Measurement Book flow (legacy, retired from the UI, kept read-only): createRunningBill /
 *    createRunningBillFromApprovedMB — every such bill has measurementBookId set; this path is
 *    unchanged so historical records keep working exactly as before.
 *
 * Workflow: Form 58 -> Running Bill (Draft -> Submitted -> Passed) -> Payment Received (Partly
 * Paid / Fully Paid). PARTLY_PAID/FULLY_PAID are never set directly — see deriveRunningBillStatus.
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

// GST is kept only so historical rows still resolve to a label — new Form 58 bills use
// GST_STATE/GST_CENTRAL instead (see DEDUCTION_TYPES below, which intentionally omits it from
// the active/default set exposed to new bills).
export const DEDUCTION_TYPES = [
  "SECURITY_DEPOSIT",
  "TDS",
  "INCOME_TAX",
  "ROYALTY",
  "LABOUR_CESS",
  "INSURANCE",
  "MOBILIZATION_RECOVERY",
  "MSEB",
  "FINE",
  "OTHER",
  "GST_STATE",
  "GST_CENTRAL",
  "GST",
];

export const DEDUCTION_TYPE_LABELS: Record<string, string> = {
  SECURITY_DEPOSIT: "Security Deposit",
  TDS: "GST TDS",
  INCOME_TAX: "Income Tax",
  ROYALTY: "Royalty",
  LABOUR_CESS: "Labour Cess",
  INSURANCE: "Insurance",
  MOBILIZATION_RECOVERY: "Mobilization Recovery",
  MSEB: "MSEB",
  FINE: "Fine",
  OTHER: "Other",
  GST_STATE: "GST State",
  GST_CENTRAL: "GST Central",
  GST: "GST (legacy)",
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
  billDate?: string;
  billSubmittedDate?: string;
  remarks?: string;
  deductions?: RunningBillDeductionInput[];
}

export interface Form58ItemInput {
  // Existing Bill Item Master row — provide this for every item already on the roster.
  siteBillItemId?: string;
  // Only required when siteBillItemId is omitted — creates a new Bill Item Master row, which
  // every subsequent RA Bill for this Site then auto-includes.
  itemNo?: string;
  description?: string;
  unit?: string;
  rate?: number;
  subWorkId?: string;
  currentQuantity: number;
  remarks?: string;
}

export interface Form58BillFormInput {
  siteId: string;
  billNumber?: string;
  billType?: string;
  billDate?: string;
  billSubmittedDate?: string;
  remarks?: string;
  items: Form58ItemInput[];
  deductions?: RunningBillDeductionInput[];
  // Optional additional GST % when Government billing GST differs from the Work Order's own
  // gstPercent. Defaults to 0 — frozen into the bill at creation, exactly like tenderAboveBelowPercent/gstPercent.
  gstDifferencePercent?: number;
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

/**
 * Child document numbering (Document Numbering Standard) — Client Payment inherits the Site
 * code: <SiteCode>/CP-<Seq>, sequential per Site. Falls back to the legacy random format for
 * Sites created before that milestone (no siteCode yet).
 */
async function generateClientPaymentNumber(companyId: string, siteId: string, siteCode: string | null): Promise<string> {
  if (!siteCode) return autoPaymentNumber();
  const count = await prisma.runningBillPayment.count({ where: { companyId, runningBill: { siteId } } });
  return `${siteCode}/CP-${count + 1}`;
}

function autoBillNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `RA-${y}${m}-${rand}`;
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
  siteRecord: { select: { id: true, name: true } },
  subWork: { select: { id: true, name: true } },
  measurementBook: { select: { id: true, mbNumber: true, mbDate: true } },
  createdBy: { select: { id: true, name: true } },
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: { siteBillItem: { select: { subWorkId: true, subWork: { select: { id: true, name: true } } } } },
  },
  deductions: true,
};

type RBRow = Prisma.RunningBillGetPayload<{ include: typeof include }>;
type RBItemRow = RBRow["items"][number];
type RBDeductionRow = RBRow["deductions"][number];

function itemToDTO(item: RBItemRow) {
  return {
    id: item.id,
    sortOrder: item.sortOrder,
    siteBillItemId: item.siteBillItemId ?? "",
    subWorkId: item.siteBillItem?.subWorkId ?? "",
    subWorkName: item.siteBillItem?.subWork?.name ?? "",
    boqItemNo: item.boqItemNo,
    boqDescription: item.boqDescription,
    unit: item.unit,
    previousQuantity: item.previousQuantity.toString(),
    currentQuantity: item.currentQuantity.toString(),
    totalQuantity: item.totalQuantity.toString(),
    boqRate: item.boqRate.toString(),
    paymentPercent: item.paymentPercent.toString(),
    effectiveRate: item.effectiveRate.toString(),
    // Now To Pay Amount mirrors Current Amount on Form 58 unless a payment percent < 100% applies.
    previousAmount: item.previousAmount.toString(),
    currentAmount: item.currentAmount.toString(),
    nowToPayAmount: item.currentAmount.toString(),
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
    siteRecord: bill.siteRecord,
    subWorkId: bill.subWorkId ?? "",
    subWork: bill.subWork,
    measurementBookId: bill.measurementBookId ?? "",
    measurementBook: bill.measurementBook,
    raSequence: bill.raSequence,
    billNumber: bill.billNumber,
    billType: bill.billType,
    site: bill.site ?? bill.project.location ?? "",
    billDate: bill.billDate.toISOString().slice(0, 10),
    billSubmittedDate: bill.billSubmittedDate ? bill.billSubmittedDate.toISOString().slice(0, 10) : "",
    previousCertifiedAmount: bill.previousCertifiedAmount.toString(),
    currentCertifiedAmount: bill.currentCertifiedAmount.toString(),
    totalCertifiedAmount: bill.totalCertifiedAmount.toString(),
    // Form 58 calculation flow — frozen at bill creation, never recalculated afterward.
    tenderAboveBelowPercent: bill.tenderAboveBelowPercent ? bill.tenderAboveBelowPercent.toString() : "",
    tenderAdjustmentAmount: bill.tenderAdjustmentAmount ? bill.tenderAdjustmentAmount.toString() : "0",
    adjustedTotal: bill.adjustedTotal ? bill.adjustedTotal.toString() : bill.currentCertifiedAmount.toString(),
    gstPercent: bill.gstPercent ? bill.gstPercent.toString() : "",
    gstAmount: bill.gstAmount ? bill.gstAmount.toString() : "0",
    gstDifferencePercent: bill.gstDifferencePercent ? bill.gstDifferencePercent.toString() : "0",
    gstDifferenceAmount: bill.gstDifferenceAmount ? bill.gstDifferenceAmount.toString() : "0",
    // Total GST is never stored — always gstAmount + gstDifferenceAmount, both already frozen above.
    totalGstAmount: (Number(bill.gstAmount ?? 0) + Number(bill.gstDifferenceAmount ?? 0)).toFixed(2),
    grossBillAmount: bill.grossBillAmount ? bill.grossBillAmount.toString() : bill.currentCertifiedAmount.toString(),
    roundOff: bill.roundOff ? bill.roundOff.toString() : "0",
    finalBillAmount: bill.finalBillAmount ? bill.finalBillAmount.toString() : bill.currentCertifiedAmount.toString(),
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

interface ResolvedRBItem {
  siteBillItemId?: string;
  // Internal only — never persisted on RunningBillItem (stripped before createMany). Used to sort
  // items into Sub Work order and to filter out Sub Works with no work executed this period
  // (Form 58 UI & Workflow Refinement). Absent for legacy MB-sourced items (buildItemsFromMB),
  // which have no Sub Work concept and are left completely unchanged by this milestone.
  subWorkId?: string;
  sortOrder: number;
  boqItemNo: string;
  boqDescription: string;
  unit: string;
  previousQuantity: number;
  currentQuantity: number;
  totalQuantity: number;
  boqRate: number;
  paymentPercent: number;
  effectiveRate: number;
  previousAmount: number;
  currentAmount: number;
  totalAmount: number;
  remarks: string | null;
}

/** The one place Previous/Current/Total Quantity and Amount are computed for a Running Bill's Abstract — never trust a client-sent value for these. */
async function buildItemsFromMB(companyId: string, projectId: string, mbItems: MBItemSource[], excludeRunningBillId?: string): Promise<ResolvedRBItem[]> {
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

/** Sums currentQuantity across every prior RunningBillItem referencing this Bill Item Master row — the cumulative "already certified" total for this item, at this Site. Robust to bills being created/edited/deleted out of order, since it always re-sums rather than chaining off "the previous bill". */
async function computePreviousQuantityForSiteBillItem(companyId: string, siteBillItemId: string, excludeRunningBillId?: string): Promise<number> {
  const agg = await prisma.runningBillItem.aggregate({
    where: { companyId, siteBillItemId, ...(excludeRunningBillId ? { runningBillId: { not: excludeRunningBillId } } : {}) },
    _sum: { currentQuantity: true },
  });
  return round4(Number(agg._sum.currentQuantity ?? 0));
}

/**
 * Resolves one Form 58 bill's item rows against the Site's Bill Item Master. Existing items
 * (siteBillItemId provided) always use the master's current description/unit/rate — a client
 * can never override those for an existing item, only Current Quantity. A row with no
 * siteBillItemId is a brand-new item: it's added to the master here (via
 * site-bill-item.service.ts, so every later bill for this Site auto-includes it too), starting
 * at Previous Quantity 0 — and must always name the Sub Work it belongs to (createSiteBillItem
 * now rejects a missing one), so an "Unassigned" bucket can never be created again.
 *
 * Two Form 58 UI & Workflow Refinement rules are applied here, centrally, so both
 * createRunningBillFromForm58 and updateRunningBill get them for free:
 *  - Show Only Work Executed: a Sub Work only survives into the resolved/saved bill if at least
 *    one of its items has Current Qty > 0 this period. Sub Works with zero activity are dropped
 *    entirely (their previously-certified items simply carry forward untouched to next time).
 *  - Items are laid out in Recapitulation Register order (Sub Work sortOrder, then each item's
 *    original position within it) so every downstream view/PDF groups and orders correctly just
 *    by respecting sortOrder ascending.
 */
async function resolveForm58Items(
  companyId: string,
  createdById: string,
  siteId: string,
  rows: Form58ItemInput[],
  excludeRunningBillId?: string
): Promise<ResolvedRBItem[]> {
  const masterCache = new Map<string, { subWorkId: string | null; itemNo: string; description: string; unit: string; rate: number }>();
  const existingIds = Array.from(new Set(rows.filter((r) => r.siteBillItemId?.trim()).map((r) => r.siteBillItemId!.trim())));
  if (existingIds.length) {
    const masters = await prisma.siteBillItem.findMany({ where: { id: { in: existingIds }, companyId, siteId } });
    for (const m of masters) masterCache.set(m.id, { subWorkId: m.subWorkId, itemNo: m.itemNo, description: m.description, unit: m.unit, rate: Number(m.rate) });
  }

  const referencedSubWorkIds = new Set<string>();
  for (const row of rows) {
    if (row.siteBillItemId?.trim()) {
      const m = masterCache.get(row.siteBillItemId.trim());
      if (m?.subWorkId) referencedSubWorkIds.add(m.subWorkId);
    } else if (row.subWorkId?.trim()) {
      referencedSubWorkIds.add(row.subWorkId.trim());
    }
  }
  const subWorkSortOrders = new Map<string, number>();
  if (referencedSubWorkIds.size) {
    const subWorks = await prisma.subWork.findMany({
      where: { id: { in: Array.from(referencedSubWorkIds) }, companyId, siteId },
      select: { id: true, sortOrder: true },
    });
    for (const sw of subWorks) subWorkSortOrders.set(sw.id, sw.sortOrder);
  }

  const working: Array<ResolvedRBItem & { subWorkId: string }> = [];

  for (const row of rows) {
    const currentQuantity = round4(Number(row.currentQuantity) || 0);
    if (currentQuantity < 0) throw new Error("Current Quantity must be a number greater than or equal to zero");

    let siteBillItemId: string;
    let itemNo: string;
    let description: string;
    let unit: string;
    let rate: number;
    let subWorkId: string;

    if (row.siteBillItemId?.trim()) {
      const master = masterCache.get(row.siteBillItemId.trim());
      if (!master) throw new Error("Bill Item not found on this Site");
      siteBillItemId = row.siteBillItemId.trim();
      itemNo = master.itemNo;
      description = master.description;
      unit = master.unit;
      rate = master.rate;
      subWorkId = master.subWorkId ?? "";
    } else {
      if (!row.subWorkId?.trim()) throw new Error("Sub Work is required for a new item");
      if (!row.description?.trim() || !row.unit?.trim()) throw new Error("Description and Unit are required for a new item");
      const rateInput = Number(row.rate);
      if (!Number.isFinite(rateInput) || rateInput < 0) throw new Error("Rate must be a number greater than or equal to zero for a new item");
      const created = await createSiteBillItem(companyId, createdById, {
        siteId,
        subWorkId: row.subWorkId,
        itemNo: row.itemNo?.trim() || String(working.length + 1),
        description: row.description.trim(),
        unit: row.unit.trim(),
        rate: rateInput,
      });
      siteBillItemId = created.id;
      itemNo = created.itemNo;
      description = created.description;
      unit = created.unit;
      rate = Number(created.rate);
      subWorkId = row.subWorkId.trim();
    }

    const previousQuantity = await computePreviousQuantityForSiteBillItem(companyId, siteBillItemId, excludeRunningBillId);
    const totalQuantity = round4(previousQuantity + currentQuantity);
    const previousAmount = round2(previousQuantity * rate);
    const currentAmount = round2(currentQuantity * rate);
    const totalAmount = round2(totalQuantity * rate);

    working.push({
      siteBillItemId,
      subWorkId,
      sortOrder: 0,
      boqItemNo: itemNo,
      boqDescription: description,
      unit,
      previousQuantity,
      currentQuantity,
      totalQuantity,
      boqRate: rate,
      paymentPercent: 100,
      effectiveRate: rate,
      previousAmount,
      currentAmount,
      totalAmount,
      remarks: row.remarks?.trim() || null,
    });
  }

  const activeSubWorkIds = new Set(working.filter((w) => w.currentQuantity > 0).map((w) => w.subWorkId));
  const active = working.filter((w) => activeSubWorkIds.has(w.subWorkId));

  active.sort((a, b) => {
    const soA = subWorkSortOrders.get(a.subWorkId) ?? Number.MAX_SAFE_INTEGER;
    const soB = subWorkSortOrders.get(b.subWorkId) ?? Number.MAX_SAFE_INTEGER;
    if (soA !== soB) return soA - soB;
    return a.subWorkId.localeCompare(b.subWorkId);
  });

  return active.map((item, index) => ({ ...item, sortOrder: index }));
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

/**
 * The draft a new Form 58 / RA Bill screen loads before the user touches anything: every active
 * Bill Item Master row for the Site, each with its Previous Quantity already carried forward and
 * Current Quantity defaulted to 0 — the user only has to fill in Current Quantity for items that
 * were actually worked on, and can add wholly new rows on top. isFirstBill is true when the Site
 * has no master items yet (nothing to carry forward — RA Bill 1's items are entered from scratch,
 * which itself creates the master).
 */
export async function getNextRABillDraft(siteId: string, companyId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, companyId } });
  if (!site) throw new Error("Site not found");

  const latest = await prisma.runningBill.findFirst({
    where: { companyId, siteId, raSequence: { not: null } },
    orderBy: { raSequence: "desc" },
  });
  const nextRaSequence = (latest?.raSequence ?? 0) + 1;

  // Final Bill Rules — once a Final Bill exists for this Site, billing is Completed and no
  // further bill (RA/Advance/Final) may be created until that Final Bill is cancelled (deleted
  // while still Draft, the only reversal path any bill supports).
  const finalBill = await prisma.runningBill.findFirst({ where: { companyId, siteId, billType: "FINAL_BILL" } });

  // Every Sub Work for this Site (from the Recapitulation Register) is always shown — including
  // ones with no billable item yet — so a brand-new Sub Work still gets its own "+ Add Item"
  // section instead of forcing items into an "Unassigned" bucket.
  const subWorks = await prisma.subWork.findMany({
    where: { companyId, siteId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, sortOrder: true },
  });

  const masterItems = await prisma.siteBillItem.findMany({
    where: { companyId, siteId, isActive: true },
    orderBy: [{ subWork: { sortOrder: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: { subWork: { select: { id: true, name: true } } },
  });

  const items = await Promise.all(
    masterItems.map(async (m) => ({
      siteBillItemId: m.id,
      itemNo: m.itemNo,
      description: m.description,
      unit: m.unit,
      rate: m.rate.toString(),
      subWorkId: m.subWorkId ?? "",
      subWorkName: m.subWork?.name ?? "",
      previousQuantity: (await computePreviousQuantityForSiteBillItem(companyId, m.id)).toString(),
      currentQuantity: "0",
    }))
  );

  return {
    siteId,
    nextRaSequence,
    suggestedBillNumber: `RA-${nextRaSequence}`,
    isFirstBill: masterItems.length === 0,
    isBillingCompleted: !!finalBill,
    subWorks: subWorks.map((sw) => ({ id: sw.id, name: sw.name })),
    items,
    // Read-only preview of the Work Order values every new bill will freeze in at Save time.
    tenderAboveBelowPercent: site.tenderAboveBelowPercent ? site.tenderAboveBelowPercent.toString() : "0",
    gstPercent: site.gstPercent ? site.gstPercent.toString() : "0",
  };
}

/**
 * Creates one RA Bill / Form 58 directly against a Site's Bill Item Master — the primary
 * creation path going forward (Measurement Book is no longer involved). Any active master item
 * the caller's payload doesn't mention is still included, at Current Quantity 0, so an item that
 * simply wasn't worked on this period never drops off the bill or the register.
 */
/** Bill Types — Advance Bill/RA Bill/Final Bill each get their own numbering prefix (ADV/RA/FINAL), sharing the same per-Site raSequence counter. */
function billTypePrefix(billType: BillType): string {
  if (billType === "ADVANCE_BILL") return "ADV";
  if (billType === "FINAL_BILL") return "FINAL";
  return "RA";
}

export async function createRunningBillFromForm58(companyId: string, createdById: string, input: Form58BillFormInput) {
  if (!input.siteId?.trim()) throw new Error("Site is required");
  const site = await prisma.site.findFirst({ where: { id: input.siteId, companyId } });
  if (!site) throw new Error("Site not found");
  if (!input.items?.length) throw new Error("At least one item is required");

  const billType = parseBillType(input.billType);

  // Final Bill Rules — only one Final Bill is ever allowed per Site, and once it exists no
  // further bill of any type may be created until it's cancelled (deleted while still Draft —
  // the only reversal any bill supports).
  const existingFinalBill = await prisma.runningBill.findFirst({ where: { companyId, siteId: input.siteId, billType: "FINAL_BILL" } });
  if (existingFinalBill) {
    throw new Error("This Site's billing is Completed — a Final Bill has already been raised. Cancel it first to create another bill.");
  }

  const latest = await prisma.runningBill.findFirst({
    where: { companyId, siteId: input.siteId, raSequence: { not: null } },
    orderBy: { raSequence: "desc" },
  });
  const raSequence = (latest?.raSequence ?? 0) + 1;

  // Child document numbering (Document Numbering Standard) — RA Bill inherits the Site code.
  // Sites created before that milestone have no siteCode yet, so fall back to the old label.
  // The prefix reflects the Bill Type (ADV/RA/FINAL) — user may always override with their own number.
  const prefix = billTypePrefix(billType);
  const billNumber = input.billNumber?.trim() || (site.siteCode ? `${site.siteCode}/${prefix}-${raSequence}` : `${prefix}-${raSequence}`);
  const existingNumber = await prisma.runningBill.findFirst({ where: { companyId, siteId: input.siteId, billNumber } });
  if (existingNumber) throw new Error(`Running Bill No. "${billNumber}" already exists for this Site`);

  const masterItems = await prisma.siteBillItem.findMany({ where: { companyId, siteId: input.siteId, isActive: true } });
  const providedIds = new Set(input.items.filter((i) => i.siteBillItemId?.trim()).map((i) => i.siteBillItemId));
  const missingRows: Form58ItemInput[] = masterItems.filter((m) => !providedIds.has(m.id)).map((m) => ({ siteBillItemId: m.id, currentQuantity: 0 }));

  const resolvedItems = await resolveForm58Items(companyId, createdById, input.siteId, [...input.items, ...missingRows]);
  const deductions = buildDeductions(input.deductions);

  const previousCertifiedAmount = round2(resolvedItems.reduce((s, i) => s + i.previousAmount, 0));
  const currentCertifiedAmount = round2(resolvedItems.reduce((s, i) => s + i.currentAmount, 0));
  const totalCertifiedAmount = round2(resolvedItems.reduce((s, i) => s + i.totalAmount, 0));

  // Form 58 calculation flow — read once from the Site's Work Order and frozen into this bill
  // forever. If the Site's percentages change later, only bills created afterward pick it up;
  // this bill's own stored figures never move (Freeze Tender Values requirement).
  const tenderAboveBelowPercent = site.tenderAboveBelowPercent ? Number(site.tenderAboveBelowPercent) : 0;
  const gstPercent = site.gstPercent ? Number(site.gstPercent) : 0;

  // Grand Total of Items -> Tender Above/Below Adjustment -> Adjusted Total
  const grandTotalOfItems = currentCertifiedAmount;
  const tenderAdjustmentAmount = round2(grandTotalOfItems * (tenderAboveBelowPercent / 100));
  const adjustedTotal = round2(grandTotalOfItems + tenderAdjustmentAmount);
  // Adjusted Total -> GST (+ optional GST Difference, when Government billing GST differs from
  // the Work Order's own gstPercent) -> Gross Bill Amount
  const gstDifferencePercent = round2(Number(input.gstDifferencePercent) || 0);
  const gstAmount = round2(adjustedTotal * (gstPercent / 100));
  const gstDifferenceAmount = round2(adjustedTotal * (gstDifferencePercent / 100));
  const grossBillAmount = round2(adjustedTotal + gstAmount + gstDifferenceAmount);
  // Gross Bill Amount -> Round Off -> Final Bill Amount
  const finalBillAmount = Math.round(grossBillAmount);
  const roundOff = round2(finalBillAmount - grossBillAmount);
  // Final Bill Amount -> Deductions -> Net Payable
  const totalDeductions = round2(deductions.reduce((s, d) => s + d.amount, 0));
  const netPayable = round2(finalBillAmount - totalDeductions);

  const bill = await prisma.$transaction(async (tx) => {
    const created = await tx.runningBill.create({
      data: {
        companyId,
        projectId: site.projectId,
        siteId: site.id,
        subWorkId: null,
        measurementBookId: null,
        raSequence,
        billNumber,
        billType,
        billDate: input.billDate ? new Date(input.billDate) : new Date(),
        billSubmittedDate: input.billSubmittedDate ? new Date(input.billSubmittedDate) : null,
        previousCertifiedAmount,
        currentCertifiedAmount,
        totalCertifiedAmount,
        tenderAboveBelowPercent,
        tenderAdjustmentAmount,
        adjustedTotal,
        gstPercent,
        gstAmount,
        gstDifferencePercent,
        gstDifferenceAmount,
        grossBillAmount,
        roundOff,
        finalBillAmount,
        totalDeductions,
        netPayable,
        amountReceived: 0,
        outstandingAmount: netPayable,
        status: "DRAFT",
        remarks: input.remarks || null,
        createdById,
      },
    });

    await tx.runningBillItem.createMany({ data: resolvedItems.map(({ subWorkId: _subWorkId, ...i }) => ({ ...i, companyId, runningBillId: created.id })) });
    if (deductions.length) {
      await tx.runningBillDeduction.createMany({ data: deductions.map((d) => ({ ...d, companyId, runningBillId: created.id })) });
    }

    return tx.runningBill.findFirstOrThrow({ where: { id: created.id }, include });
  });

  return toDTO(bill);
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

  const existingNumber = await prisma.runningBill.findFirst({ where: { companyId, siteId: mb.siteId, billNumber: input.billNumber.trim() } });
  if (existingNumber) throw new Error(`Running Bill No. "${input.billNumber}" already exists for this Site`);

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
        billDate: input.billDate ? new Date(input.billDate) : new Date(),
        billSubmittedDate: input.billSubmittedDate ? new Date(input.billSubmittedDate) : null,
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

/**
 * Auto-invoked when a Measurement Book transitions to APPROVED (see measurement-book.service.ts's
 * updateMB) — Running Bills are never manually created from scratch; every one of them is this
 * function's output, with an auto-generated Bill No. and today's date as the Bill Date. Deductions
 * are always empty at auto-creation time; they're added afterward via updateRunningBill while the
 * bill is still Draft.
 */
export async function createRunningBillFromApprovedMB(companyId: string, createdById: string, measurementBookId: string, billDate?: string) {
  const mb = await prisma.measurementBook.findFirst({ where: { id: measurementBookId, companyId }, select: { siteId: true } });
  let billNumber = autoBillNumber();
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.runningBill.findFirst({ where: { companyId, siteId: mb?.siteId, billNumber } });
    if (!clash) break;
    billNumber = autoBillNumber();
  }
  return createRunningBill(companyId, createdById, { measurementBookId, billNumber, billDate });
}

export async function updateRunningBill(id: string, companyId: string, input: Partial<RunningBillFormInput> & { items?: Form58ItemInput[]; gstDifferencePercent?: number }) {
  const existing = await prisma.runningBill.findFirst({
    where: { id, companyId },
    include: { measurementBook: { include: { items: { orderBy: { sortOrder: "asc" } } } } },
  });
  if (!existing) throw new Error("Running Bill not found");
  if (existing.status !== "DRAFT") throw new Error("Only a Draft Running Bill can be edited");

  if (input.billNumber && input.billNumber.trim() !== existing.billNumber) {
    const clash = await prisma.runningBill.findFirst({ where: { companyId, siteId: existing.siteId, billNumber: input.billNumber.trim(), id: { not: id } } });
    if (clash) throw new Error(`Running Bill No. "${input.billNumber}" already exists for this Site`);
  }

  // Final Bill Rules — switching this Draft bill's type to Final Bill must not create a second one.
  if (input.billType !== undefined && parseBillType(input.billType) === "FINAL_BILL" && existing.billType !== "FINAL_BILL") {
    const existingFinalBill = await prisma.runningBill.findFirst({ where: { companyId, siteId: existing.siteId, billType: "FINAL_BILL", id: { not: id } } });
    if (existingFinalBill) throw new Error("This Site already has a Final Bill — only one is allowed");
  }

  // Legacy MB-sourced bills always re-import from the MB, unchanged from before. Form 58 bills
  // (measurementBookId null) only recompute items when the caller actually sent corrected
  // quantities — otherwise the existing item rows are left exactly as they are.
  let resolvedItems: ResolvedRBItem[] | null = null;
  if (existing.measurementBookId && existing.measurementBook) {
    resolvedItems = await buildItemsFromMB(companyId, existing.projectId, existing.measurementBook.items, id);
  } else if (input.items !== undefined) {
    resolvedItems = await resolveForm58Items(companyId, existing.createdById, existing.siteId, input.items, id);
  }

  const previousCertifiedAmount = resolvedItems ? round2(resolvedItems.reduce((s, i) => s + i.previousAmount, 0)) : Number(existing.previousCertifiedAmount);
  const currentCertifiedAmount = resolvedItems ? round2(resolvedItems.reduce((s, i) => s + i.currentAmount, 0)) : Number(existing.currentCertifiedAmount);
  const totalCertifiedAmount = resolvedItems ? round2(resolvedItems.reduce((s, i) => s + i.totalAmount, 0)) : Number(existing.totalCertifiedAmount);
  const deductions = input.deductions !== undefined ? buildDeductions(input.deductions) : null;

  // Re-run the Form 58 calculation flow using the percentages already frozen on this bill at
  // creation — never re-read from the Site, even while the bill is still a Draft being edited.
  const tenderAboveBelowPercent = existing.tenderAboveBelowPercent ? Number(existing.tenderAboveBelowPercent) : 0;
  const gstPercent = existing.gstPercent ? Number(existing.gstPercent) : 0;
  // GST Difference % is only re-derived when the caller explicitly sends a new value — otherwise
  // whatever is already frozen on this Draft bill is kept, exactly like tenderAboveBelowPercent/gstPercent above.
  const gstDifferencePercent =
    input.gstDifferencePercent !== undefined
      ? round2(Number(input.gstDifferencePercent) || 0)
      : existing.gstDifferencePercent
        ? Number(existing.gstDifferencePercent)
        : 0;
  const tenderAdjustmentAmount = round2(currentCertifiedAmount * (tenderAboveBelowPercent / 100));
  const adjustedTotal = round2(currentCertifiedAmount + tenderAdjustmentAmount);
  const gstAmount = round2(adjustedTotal * (gstPercent / 100));
  const gstDifferenceAmount = round2(adjustedTotal * (gstDifferencePercent / 100));
  const grossBillAmount = round2(adjustedTotal + gstAmount + gstDifferenceAmount);
  const finalBillAmount = Math.round(grossBillAmount);
  const roundOff = round2(finalBillAmount - grossBillAmount);

  const bill = await prisma.$transaction(async (tx) => {
    if (resolvedItems) {
      await tx.runningBillItem.deleteMany({ where: { runningBillId: id } });
      await tx.runningBillItem.createMany({ data: resolvedItems.map(({ subWorkId: _subWorkId, ...i }) => ({ ...i, companyId, runningBillId: id })) });
    }

    if (deductions !== null) {
      await tx.runningBillDeduction.deleteMany({ where: { runningBillId: id } });
      if (deductions.length) {
        await tx.runningBillDeduction.createMany({ data: deductions.map((d) => ({ ...d, companyId, runningBillId: id })) });
      }
    }

    const effectiveDeductions =
      deductions !== null ? deductions.map((d) => d.amount) : (await tx.runningBillDeduction.findMany({ where: { runningBillId: id }, select: { amount: true } })).map((d) => Number(d.amount));
    const totalDeductions = round2(effectiveDeductions.reduce((s, a) => s + a, 0));
    const netPayable = round2(finalBillAmount - totalDeductions);

    const updated = await tx.runningBill.update({
      where: { id },
      data: {
        billNumber: input.billNumber?.trim() || existing.billNumber,
        billType: input.billType !== undefined ? parseBillType(input.billType) : existing.billType,
        site: input.site !== undefined ? input.site || null : existing.site,
        billDate: input.billDate ? new Date(input.billDate) : existing.billDate,
        billSubmittedDate: input.billSubmittedDate !== undefined ? (input.billSubmittedDate ? new Date(input.billSubmittedDate) : null) : existing.billSubmittedDate,
        remarks: input.remarks !== undefined ? input.remarks || null : existing.remarks,
        previousCertifiedAmount,
        currentCertifiedAmount,
        totalCertifiedAmount,
        tenderAdjustmentAmount,
        adjustedTotal,
        gstAmount,
        gstDifferencePercent,
        gstDifferenceAmount,
        grossBillAmount,
        roundOff,
        finalBillAmount,
        totalDeductions,
        netPayable,
        outstandingAmount: netPayable,
      },
    });

    return tx.runningBill.findFirstOrThrow({ where: { id: updated.id }, include });
  });

  return toDTO(bill);
}

/**
 * A legacy MB-sourced bill can never be deleted: it's auto-generated 1:1 from an Approved
 * Measurement Book that can itself never be edited or re-approved, so deleting the bill would
 * strand the MB in an Approved-but-unbillable state with no way to regenerate one. A Form 58 bill
 * has no such constraint — it can always be recreated — so Draft ones may be deleted normally.
 */
export async function deleteRunningBill(id: string, companyId: string) {
  const existing = await prisma.runningBill.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Running Bill not found");
  if (existing.measurementBookId) {
    throw new Error("Running Bills generated from a Measurement Book can no longer be deleted — edit the Draft bill instead");
  }
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
  allocation: { select: { bankTransaction: { select: sourceBankTransactionSelect } } },
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
    sourceBankTransaction: toSourceBankTransactionDTO(p.allocation),
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

  const site = await prisma.site.findFirst({ where: { id: existing.siteId, companyId }, select: { siteCode: true } });
  const paymentNumber = await generateClientPaymentNumber(companyId, existing.siteId, site?.siteCode ?? null);

  const { bill, paymentId } = await prisma.$transaction(async (tx) => {
    const created = await tx.runningBillPayment.create({
      data: {
        companyId,
        runningBillId: id,
        projectId: existing.projectId,
        companyBankAccountId,
        paymentNumber,
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
