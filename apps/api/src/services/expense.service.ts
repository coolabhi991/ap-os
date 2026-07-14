import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { deriveLiabilityStatus } from "./liability.service.js";
import { sourceBankTransactionSelect, toSourceBankTransactionDTO } from "../utils/bank-traceability.js";

export const PAYMENT_MODES = ["CASH", "COMPANY_BANK", "CREDIT_CARD", "VENDOR_CREDIT"];

export const MACHINE_TYPES = [
  "JCB",
  "EXCAVATOR",
  "HYDRA",
  "CRANE",
  "ROLLER",
  "POCLAIN",
  "DUMPER",
  "TRACTOR",
  "GENERATOR",
  "COMPRESSOR",
  "OTHER",
];

/** The one ExpenseCategory name that triggers the machinery-specific fields/validation/reports. */
const MACHINERY_CATEGORY_NAME = "machinery";

export interface ExpenseFormInput {
  projectId: string;
  siteId: string;
  categoryId: string;
  vendorId?: string;
  subWorkId?: string;
  expenseDate?: string;
  description?: string;
  amount: number;
  paymentMode: string;
  companyBankAccountId?: string;
  // Only used when paymentMode = "CREDIT_CARD" — the Credit Card (a Liability with
  // liabilityType = CREDIT_CARD) this expense was charged to.
  liabilityId?: string;
  attachmentFileName?: string;
  attachmentFileUrl?: string;
  remarks?: string;
  machineType?: string;
  machineHours?: number;
  machineRatePerHour?: number;
}

export interface ExpenseListQuery {
  search?: string;
  projectId?: string;
  siteId?: string;
  vendorId?: string;
  categoryId?: string;
  paymentMode?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function parseMode(m: string): string {
  const upper = m.trim().toUpperCase();
  if (!PAYMENT_MODES.includes(upper)) {
    throw new Error(`Invalid payment mode: ${m}. Must be one of ${PAYMENT_MODES.join(", ")}`);
  }
  return upper;
}

function parseMachineType(t: string): string {
  const upper = t.trim().toUpperCase();
  if (!MACHINE_TYPES.includes(upper)) {
    throw new Error(`Invalid machine type: ${t}. Must be one of ${MACHINE_TYPES.join(", ")}`);
  }
  return upper;
}

function autoNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EXP-${y}${m}-${rand}`;
}

/**
 * Child document numbering (Document Numbering Standard) — Site Expense inherits the Site
 * code: <SiteCode>/EXP-<Seq>, sequential per Site. Falls back to the legacy random format for
 * Sites created before that milestone (no siteCode yet).
 */
async function generateExpenseNumber(companyId: string, siteId: string): Promise<string> {
  const site = await prisma.site.findFirst({ where: { id: siteId, companyId }, select: { siteCode: true } });
  if (!site?.siteCode) return autoNumber();
  const count = await prisma.expense.count({ where: { companyId, siteId } });
  return `${site.siteCode}/EXP-${count + 1}`;
}

const include = {
  project: { select: { id: true, name: true } },
  site: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  subWork: { select: { id: true, name: true } },
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true, accountType: true } },
  liability: { select: { id: true, loanName: true, liabilityType: true } },
  createdBy: { select: { id: true, name: true } },
  allocation: { select: { bankTransaction: { select: sourceBankTransactionSelect } } },
};

type ExpenseRow = Prisma.ExpenseGetPayload<{ include: typeof include }>;

function toDTO(e: ExpenseRow) {
  return {
    id: e.id,
    companyId: e.companyId,
    projectId: e.projectId,
    project: e.project,
    siteId: e.siteId,
    site: e.site,
    categoryId: e.categoryId,
    category: e.category,
    vendorId: e.vendorId ?? "",
    vendor: e.vendor,
    subWorkId: e.subWorkId ?? "",
    subWork: e.subWork,
    expenseNumber: e.expenseNumber,
    expenseDate: e.expenseDate.toISOString().slice(0, 10),
    description: e.description ?? "",
    amount: e.amount.toString(),
    paymentMode: e.paymentMode,
    companyBankAccountId: e.companyBankAccountId ?? "",
    companyBankAccount: e.companyBankAccount,
    liabilityId: e.liabilityId ?? "",
    liability: e.liability,
    attachmentFileName: e.attachmentFileName ?? "",
    attachmentFileUrl: e.attachmentFileUrl ?? "",
    remarks: e.remarks ?? "",
    machineType: e.machineType ?? "",
    machineHours: e.machineHours?.toString() ?? "",
    machineRatePerHour: e.machineRatePerHour?.toString() ?? "",
    createdById: e.createdById,
    createdBy: e.createdBy,
    isDeleted: e.isDeleted,
    sourceBankTransaction: toSourceBankTransactionDTO(e.allocation),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

/** Validates project/category/vendor/bank-account references and cross-field payment-mode/machinery rules. */
async function validateAndNormalize(companyId: string, input: ExpenseFormInput) {
  if (!input.projectId?.trim()) throw new Error("Project is required");
  const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
  if (!project) throw new Error("Project not found");

  if (!input.siteId?.trim()) throw new Error("Site is required");
  const site = await prisma.site.findFirst({ where: { id: input.siteId, companyId, projectId: input.projectId } });
  if (!site) throw new Error("Site not found");

  if (!input.categoryId?.trim()) throw new Error("Category is required");
  const category = await prisma.expenseCategory.findFirst({ where: { id: input.categoryId, companyId } });
  if (!category) throw new Error("Expense category not found");

  if (!input.paymentMode?.trim()) throw new Error("Payment mode is required");
  const paymentMode = parseMode(input.paymentMode);

  if (paymentMode === "VENDOR_CREDIT" && !input.vendorId?.trim()) {
    throw new Error("Vendor is required for Vendor Credit payments");
  }

  let vendorId: string | null = null;
  if (input.vendorId?.trim()) {
    const vendor = await prisma.vendor.findFirst({ where: { id: input.vendorId, companyId } });
    if (!vendor) throw new Error("Vendor not found");
    vendorId = vendor.id;
  }

  // Source Account Workflow — Payment Mode identifies HOW the payment was made; Source Account
  // identifies WHERE the money came from. CASH and COMPANY_BANK both resolve to a
  // CompanyBankAccount row (the existing "Company Bank Accounts Master" already supports named
  // CASH-type rows — e.g. "Company Cash", "Site Petty Cash - Malunje" — so this doubles as the
  // Cash Account Master without a second, parallel model). The accountType is re-verified here,
  // not just filtered client-side, so a mismatched account can never be saved even via a raw API
  // call — Source Account must always be picked from the Master, never free text.
  let companyBankAccountId: string | null = null;
  if (paymentMode === "CASH" || paymentMode === "COMPANY_BANK") {
    if (!input.companyBankAccountId?.trim()) throw new Error("Source Account is required");
    const expectedType = paymentMode === "CASH" ? "CASH" : "BANK";
    const account = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
    if (!account) throw new Error("Source Account not found");
    if (account.accountType !== expectedType) {
      throw new Error(`Selected Source Account is not a ${expectedType === "CASH" ? "Cash" : "Bank"} account`);
    }
    companyBankAccountId = account.id;
  }

  // Credit Card Expense Workflow — the Site Expense is recorded on the actual transaction date,
  // and the linked Credit Card's outstandingAmount is increased automatically by createExpense/
  // updateExpense (never entered as a second figure on the card itself).
  let liabilityId: string | null = null;
  if (paymentMode === "CREDIT_CARD") {
    if (!input.liabilityId?.trim()) throw new Error("Source Account is required");
    const liability = await prisma.liability.findFirst({ where: { id: input.liabilityId, companyId, liabilityType: "CREDIT_CARD" } });
    if (!liability) throw new Error("Source Account not found");
    liabilityId = liability.id;
  }

  let subWorkId: string | null = null;
  if (input.subWorkId?.trim()) {
    const subWork = await prisma.subWork.findFirst({ where: { id: input.subWorkId, companyId, projectId: input.projectId } });
    if (!subWork) throw new Error("Sub Work not found");
    subWorkId = subWork.id;
  }

  // Machinery: Machine Type, Hours, and Rate Per Hour are required, and the total
  // amount is always auto-calculated from them — never taken from client input.
  const isMachinery = category.name.trim().toLowerCase() === MACHINERY_CATEGORY_NAME;
  let machineType: string | null = null;
  let machineHours: number | null = null;
  let machineRatePerHour: number | null = null;
  let amount = input.amount;

  if (isMachinery) {
    if (!input.machineType?.trim()) throw new Error("Machine type is required for Machinery expenses");
    machineType = parseMachineType(input.machineType);

    if (!input.machineHours || input.machineHours <= 0) throw new Error("Hours must be greater than zero for Machinery expenses");
    machineHours = input.machineHours;

    if (!input.machineRatePerHour || input.machineRatePerHour <= 0) throw new Error("Rate per hour must be greater than zero for Machinery expenses");
    machineRatePerHour = input.machineRatePerHour;

    amount = Math.round(machineHours * machineRatePerHour * 100) / 100;
  } else if (!input.amount || input.amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  return { paymentMode, vendorId, companyBankAccountId, liabilityId, subWorkId, machineType, machineHours, machineRatePerHour, amount };
}

export async function listExpenses(companyId: string, query: ExpenseListQuery) {
  const {
    search = "",
    projectId,
    siteId,
    vendorId,
    categoryId,
    paymentMode,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    page = 1,
    limit = 20,
    sortBy = "expenseDate",
    sortOrder = "desc",
  } = query;

  const where: Prisma.ExpenseWhereInput = {
    companyId,
    isDeleted: false,
    ...(projectId && { projectId }),
    ...(siteId && { siteId }),
    ...(vendorId && { vendorId }),
    ...(categoryId && { categoryId }),
    ...(paymentMode && PAYMENT_MODES.includes(paymentMode.toUpperCase()) && { paymentMode: paymentMode.toUpperCase() }),
    ...(fromDate || toDate
      ? { expenseDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...((minAmount !== undefined || maxAmount !== undefined) && {
      amount: { ...(minAmount !== undefined ? { gte: minAmount } : {}), ...(maxAmount !== undefined ? { lte: maxAmount } : {}) },
    }),
    ...(search && {
      OR: [
        { expenseNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { remarks: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const allowed = ["expenseNumber", "expenseDate", "amount", "paymentMode", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "expenseDate";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: expenses.map(toDTO) };
}

export async function getExpenseById(id: string, companyId: string) {
  const expense = await prisma.expense.findFirst({ where: { id, companyId, isDeleted: false }, include });
  if (!expense) throw new Error("Expense not found");
  return toDTO(expense);
}

export async function createExpense(companyId: string, createdById: string, input: ExpenseFormInput) {
  const { paymentMode, vendorId, companyBankAccountId, liabilityId, subWorkId, machineType, machineHours, machineRatePerHour, amount } =
    await validateAndNormalize(companyId, input);
  const expenseNumber = await generateExpenseNumber(companyId, input.siteId);

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        companyId,
        projectId: input.projectId,
        siteId: input.siteId,
        categoryId: input.categoryId,
        vendorId,
        subWorkId,
        expenseNumber,
        expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
        description: input.description || null,
        amount,
        paymentMode,
        companyBankAccountId,
        liabilityId,
        attachmentFileName: input.attachmentFileName || null,
        attachmentFileUrl: input.attachmentFileUrl || null,
        remarks: input.remarks || null,
        machineType,
        machineHours,
        machineRatePerHour,
        createdById,
      },
      include,
    });

    // Credit Card Expense Workflow — the card's Outstanding increases automatically the moment
    // the expense is recorded, atomically with the expense row itself.
    if (liabilityId) {
      const card = await tx.liability.findUniqueOrThrow({ where: { id: liabilityId } });
      const newOutstanding = Math.round((Number(card.outstandingAmount) + amount) * 100) / 100;
      await tx.liability.update({ where: { id: liabilityId }, data: { outstandingAmount: newOutstanding, status: deriveLiabilityStatus(newOutstanding) } });
    }

    return created;
  });

  return toDTO(expense);
}

export async function updateExpense(id: string, companyId: string, input: ExpenseFormInput) {
  const existing = await prisma.expense.findFirst({ where: { id, companyId, isDeleted: false } });
  if (!existing) throw new Error("Expense not found");

  const { paymentMode, vendorId, companyBankAccountId, liabilityId, subWorkId, machineType, machineHours, machineRatePerHour, amount } =
    await validateAndNormalize(companyId, input);

  // Credit Card Expense Workflow — reconcile whichever card(s) this expense affected before and
  // after the edit, so an edited amount, a switched card, or a payment-mode change away from/to
  // Credit Card never leaves stale money sitting on a card's Outstanding.
  const oldLiabilityId = existing.paymentMode === "CREDIT_CARD" ? existing.liabilityId : null;
  const oldAmount = oldLiabilityId ? Number(existing.amount) : 0;
  const newLiabilityId = liabilityId;
  const newAmount = newLiabilityId ? amount : 0;

  const expense = await prisma.$transaction(async (tx) => {
    const updated = await tx.expense.update({
      where: { id },
      data: {
        projectId: input.projectId,
        siteId: input.siteId,
        categoryId: input.categoryId,
        vendorId,
        subWorkId,
        expenseDate: input.expenseDate ? new Date(input.expenseDate) : existing.expenseDate,
        description: input.description || null,
        amount,
        paymentMode,
        companyBankAccountId,
        liabilityId: newLiabilityId,
        attachmentFileName: input.attachmentFileName || null,
        attachmentFileUrl: input.attachmentFileUrl || null,
        remarks: input.remarks || null,
        machineType,
        machineHours,
        machineRatePerHour,
      },
      include,
    });

    const adjustLiability = async (liabId: string, delta: number) => {
      const card = await tx.liability.findUniqueOrThrow({ where: { id: liabId } });
      const newOutstanding = Math.round((Number(card.outstandingAmount) + delta) * 100) / 100;
      await tx.liability.update({ where: { id: liabId }, data: { outstandingAmount: newOutstanding, status: deriveLiabilityStatus(newOutstanding) } });
    };

    if (oldLiabilityId && newLiabilityId && oldLiabilityId === newLiabilityId) {
      if (newAmount !== oldAmount) await adjustLiability(oldLiabilityId, newAmount - oldAmount);
    } else {
      if (oldLiabilityId) await adjustLiability(oldLiabilityId, -oldAmount);
      if (newLiabilityId) await adjustLiability(newLiabilityId, newAmount);
    }

    return updated;
  });

  return toDTO(expense);
}

/**
 * Soft delete only — expenses are a financial record and are never hard-deleted. If the deleted
 * expense was charged to a Credit Card, its amount is reversed off that card's Outstanding in
 * the same transaction as the soft delete, so a deleted Credit Card expense never leaves a
 * balance behind. Negative Outstanding is deliberately allowed here (a real "credit balance"
 * state) rather than clamped to zero — clamping would silently lose money from the ledger if a
 * separate Credit Card Bill Payment already reduced the balance in between.
 */
export async function deleteExpense(id: string, companyId: string) {
  const existing = await prisma.expense.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Expense not found");
  if (existing.isDeleted) throw new Error("Expense already deleted");

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });

    if (existing.paymentMode === "CREDIT_CARD" && existing.liabilityId) {
      const card = await tx.liability.findUniqueOrThrow({ where: { id: existing.liabilityId } });
      const newOutstanding = Math.round((Number(card.outstandingAmount) - Number(existing.amount)) * 100) / 100;
      await tx.liability.update({ where: { id: existing.liabilityId }, data: { outstandingAmount: newOutstanding, status: deriveLiabilityStatus(newOutstanding) } });
    }
  });
}

export async function getExpenseDashboard(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const baseWhere: Prisma.ExpenseWhereInput = { companyId, isDeleted: false };

  const [todayAgg, monthAgg, byProjectRaw, byCategoryRaw, byModeRaw, vendorCreditAgg, recentExpenses, machineryAgg] = await Promise.all([
    prisma.expense.aggregate({ where: { ...baseWhere, expenseDate: { gte: startOfDay } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ where: { ...baseWhere, expenseDate: { gte: startOfMonth } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.groupBy({ by: ["projectId"], where: baseWhere, _sum: { amount: true }, _count: { _all: true }, orderBy: { _sum: { amount: "desc" } }, take: 10 }),
    prisma.expense.groupBy({ by: ["categoryId"], where: baseWhere, _sum: { amount: true }, _count: { _all: true }, orderBy: { _sum: { amount: "desc" } } }),
    prisma.expense.groupBy({ by: ["paymentMode"], where: baseWhere, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ where: { ...baseWhere, paymentMode: "VENDOR_CREDIT" }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.findMany({ where: baseWhere, include, orderBy: { expenseDate: "desc" }, take: 10 }),
    prisma.expense.aggregate({ where: { ...baseWhere, machineHours: { not: null } }, _sum: { amount: true, machineHours: true }, _count: { _all: true } }),
  ]);

  const projects = await prisma.project.findMany({ where: { id: { in: byProjectRaw.map((p) => p.projectId) } }, select: { id: true, name: true } });
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  const categories = await prisma.expenseCategory.findMany({ where: { id: { in: byCategoryRaw.map((c) => c.categoryId) } }, select: { id: true, name: true } });
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return {
    today: { amount: (todayAgg._sum.amount ?? new Prisma.Decimal(0)).toString(), count: todayAgg._count._all },
    thisMonth: { amount: (monthAgg._sum.amount ?? new Prisma.Decimal(0)).toString(), count: monthAgg._count._all },
    byProject: byProjectRaw.map((p) => ({
      projectId: p.projectId,
      projectName: projectNameById.get(p.projectId) ?? "Unknown",
      amount: (p._sum.amount ?? new Prisma.Decimal(0)).toString(),
      count: p._count._all,
    })),
    byCategory: byCategoryRaw.map((c) => ({
      categoryId: c.categoryId,
      categoryName: categoryNameById.get(c.categoryId) ?? "Unknown",
      amount: (c._sum.amount ?? new Prisma.Decimal(0)).toString(),
      count: c._count._all,
    })),
    byPaymentMode: PAYMENT_MODES.map((mode) => {
      const row = byModeRaw.find((m) => m.paymentMode === mode);
      return { mode, amount: (row?._sum.amount ?? new Prisma.Decimal(0)).toString(), count: row?._count._all ?? 0 };
    }),
    outstandingVendorCredit: {
      amount: (vendorCreditAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
      count: vendorCreditAgg._count._all,
    },
    machineryCost: {
      amount: (machineryAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
      hours: (machineryAgg._sum.machineHours ?? new Prisma.Decimal(0)).toString(),
      count: machineryAgg._count._all,
    },
    recentExpenses: recentExpenses.map(toDTO),
  };
}

/**
 * Site-scoped Today/Month/Site totals for the Expense Register (Register Component milestone) —
 * computed via Prisma aggregate, never by summing a paginated list client-side, so the figures
 * stay correct however many hundreds of expenses a Site accumulates.
 */
export async function getSiteExpenseSummary(companyId: string, siteId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const baseWhere: Prisma.ExpenseWhereInput = { companyId, siteId, isDeleted: false };

  const [todayAgg, monthAgg, siteAgg] = await Promise.all([
    prisma.expense.aggregate({ where: { ...baseWhere, expenseDate: { gte: startOfDay } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ where: { ...baseWhere, expenseDate: { gte: startOfMonth } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ where: baseWhere, _sum: { amount: true }, _count: { _all: true } }),
  ]);

  return {
    today: { amount: (todayAgg._sum.amount ?? new Prisma.Decimal(0)).toString(), count: todayAgg._count._all },
    thisMonth: { amount: (monthAgg._sum.amount ?? new Prisma.Decimal(0)).toString(), count: monthAgg._count._all },
    site: { amount: (siteAgg._sum.amount ?? new Prisma.Decimal(0)).toString(), count: siteAgg._count._all },
  };
}

interface ReportDateQuery {
  fromDate?: string;
  toDate?: string;
}

function dateRangeWhere(query: ReportDateQuery) {
  const { fromDate, toDate } = query;
  if (!fromDate && !toDate) return undefined;
  return { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) };
}

export async function getProjectExpenseSummary(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.ExpenseWhereInput = { companyId, isDeleted: false, ...(dateRange && { expenseDate: dateRange }) };

  const rows = await prisma.expense.groupBy({
    by: ["projectId"],
    where,
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const projects = await prisma.project.findMany({ where: { id: { in: rows.map((r) => r.projectId) } }, select: { id: true, name: true } });
  const nameById = new Map(projects.map((p) => [p.id, p.name]));

  return rows.map((r) => ({
    projectId: r.projectId,
    projectName: nameById.get(r.projectId) ?? "Unknown",
    totalAmount: (r._sum.amount ?? new Prisma.Decimal(0)).toString(),
    count: r._count._all,
  }));
}

export async function getCategoryExpenseSummary(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.ExpenseWhereInput = { companyId, isDeleted: false, ...(dateRange && { expenseDate: dateRange }) };

  const rows = await prisma.expense.groupBy({
    by: ["categoryId"],
    where,
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const categories = await prisma.expenseCategory.findMany({ where: { id: { in: rows.map((r) => r.categoryId) } }, select: { id: true, name: true } });
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  return rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName: nameById.get(r.categoryId) ?? "Unknown",
    totalAmount: (r._sum.amount ?? new Prisma.Decimal(0)).toString(),
    count: r._count._all,
  }));
}

export async function getMonthlyExpenseSummary(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.ExpenseWhereInput = { companyId, isDeleted: false, ...(dateRange && { expenseDate: dateRange }) };

  const expenses = await prisma.expense.findMany({ where, select: { expenseDate: true, amount: true } });

  const buckets = new Map<string, { amount: number; count: number }>();
  for (const e of expenses) {
    const key = e.expenseDate.toISOString().slice(0, 7);
    const bucket = buckets.get(key) ?? { amount: 0, count: 0 };
    bucket.amount += Number(e.amount);
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, totalAmount: v.amount.toString(), count: v.count }));
}

export async function getVendorCreditSummary(companyId: string, query: ReportDateQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.ExpenseWhereInput = {
    companyId,
    isDeleted: false,
    paymentMode: "VENDOR_CREDIT",
    vendorId: { not: null },
    ...(dateRange && { expenseDate: dateRange }),
  };

  const rows = await prisma.expense.groupBy({
    by: ["vendorId"],
    where,
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const vendorIds = rows.map((r) => r.vendorId).filter((v): v is string => v !== null);
  const vendors = await prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, name: true } });
  const nameById = new Map(vendors.map((v) => [v.id, v.name]));

  return rows.map((r) => ({
    vendorId: r.vendorId as string,
    vendorName: nameById.get(r.vendorId as string) ?? "Unknown",
    totalAmount: (r._sum.amount ?? new Prisma.Decimal(0)).toString(),
    count: r._count._all,
  }));
}

/** All 5 machinery reports scope to `machineHours: { not: null }` rather than joining on category name, since that FK is stable even if the category is later renamed. */
const machineryWhere = (companyId: string, dateRange?: { gte?: Date; lte?: Date }): Prisma.ExpenseWhereInput => ({
  companyId,
  isDeleted: false,
  machineHours: { not: null },
  ...(dateRange && { expenseDate: dateRange }),
});

export async function getMachineryCostByProjectReport(companyId: string, query: ReportDateQuery) {
  const where = machineryWhere(companyId, dateRangeWhere(query));

  const rows = await prisma.expense.groupBy({
    by: ["projectId"],
    where,
    _sum: { amount: true, machineHours: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const projects = await prisma.project.findMany({ where: { id: { in: rows.map((r) => r.projectId) } }, select: { id: true, name: true } });
  const nameById = new Map(projects.map((p) => [p.id, p.name]));

  return rows.map((r) => ({
    projectId: r.projectId,
    projectName: nameById.get(r.projectId) ?? "Unknown",
    totalAmount: (r._sum.amount ?? new Prisma.Decimal(0)).toString(),
    totalHours: (r._sum.machineHours ?? new Prisma.Decimal(0)).toString(),
    count: r._count._all,
  }));
}

/** "Site" = the assigned project's location field, since this app has no separate Site entity — a project IS a site. */
export async function getMachineryCostBySiteReport(companyId: string, query: ReportDateQuery) {
  const where = machineryWhere(companyId, dateRangeWhere(query));

  const expenses = await prisma.expense.findMany({
    where,
    select: { amount: true, machineHours: true, project: { select: { location: true } } },
  });

  const buckets = new Map<string, { amount: number; hours: number; count: number }>();
  for (const e of expenses) {
    const key = e.project.location?.trim() || "Unspecified";
    const bucket = buckets.get(key) ?? { amount: 0, hours: 0, count: 0 };
    bucket.amount += Number(e.amount);
    bucket.hours += Number(e.machineHours ?? 0);
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([site, v]) => ({ site, totalAmount: v.amount.toString(), totalHours: v.hours.toString(), count: v.count }));
}

export async function getVendorWiseMachineryCostReport(companyId: string, query: ReportDateQuery) {
  const where: Prisma.ExpenseWhereInput = { ...machineryWhere(companyId, dateRangeWhere(query)), vendorId: { not: null } };

  const rows = await prisma.expense.groupBy({
    by: ["vendorId"],
    where,
    _sum: { amount: true, machineHours: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const vendorIds = rows.map((r) => r.vendorId).filter((v): v is string => v !== null);
  const vendors = await prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, name: true } });
  const nameById = new Map(vendors.map((v) => [v.id, v.name]));

  return rows.map((r) => ({
    vendorId: r.vendorId as string,
    vendorName: nameById.get(r.vendorId as string) ?? "Unknown",
    totalAmount: (r._sum.amount ?? new Prisma.Decimal(0)).toString(),
    totalHours: (r._sum.machineHours ?? new Prisma.Decimal(0)).toString(),
    count: r._count._all,
  }));
}

export async function getMonthlyMachineryCostReport(companyId: string, query: ReportDateQuery) {
  const where = machineryWhere(companyId, dateRangeWhere(query));

  const expenses = await prisma.expense.findMany({ where, select: { expenseDate: true, amount: true, machineHours: true } });

  const buckets = new Map<string, { amount: number; hours: number; count: number }>();
  for (const e of expenses) {
    const key = e.expenseDate.toISOString().slice(0, 7);
    const bucket = buckets.get(key) ?? { amount: 0, hours: 0, count: 0 };
    bucket.amount += Number(e.amount);
    bucket.hours += Number(e.machineHours ?? 0);
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, totalAmount: v.amount.toString(), totalHours: v.hours.toString(), count: v.count }));
}

/** Total Machine Hours — grouped by machine type, so it doubles as "which machines are used most." */
export async function getMachineHoursByTypeReport(companyId: string, query: ReportDateQuery) {
  const where: Prisma.ExpenseWhereInput = { ...machineryWhere(companyId, dateRangeWhere(query)), machineType: { not: null } };

  const rows = await prisma.expense.groupBy({
    by: ["machineType"],
    where,
    _sum: { amount: true, machineHours: true },
    _count: { _all: true },
    orderBy: { _sum: { machineHours: "desc" } },
  });

  return rows.map((r) => ({
    machineType: r.machineType as string,
    totalHours: (r._sum.machineHours ?? new Prisma.Decimal(0)).toString(),
    totalAmount: (r._sum.amount ?? new Prisma.Decimal(0)).toString(),
    count: r._count._all,
  }));
}

export async function exportExpensesToCSV(companyId: string, query: ExpenseListQuery) {
  const { data } = await listExpenses(companyId, { ...query, page: 1, limit: 5000 });

  const headers = [
    "Expense Number",
    "Date",
    "Project",
    "Category",
    "Vendor",
    "Description",
    "Amount",
    "Payment Mode",
    "Company Bank Account",
    "Machine Type",
    "Hours",
    "Rate Per Hour",
    "Remarks",
    "Created By",
  ];

  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = data.map((e) =>
    [
      e.expenseNumber,
      e.expenseDate,
      e.project?.name ?? "",
      e.category?.name ?? "",
      e.vendor?.name ?? "",
      e.description,
      e.amount,
      e.paymentMode,
      e.companyBankAccount ? `${e.companyBankAccount.bankName} (${e.companyBankAccount.accountNumber})` : "",
      e.machineType,
      e.machineHours,
      e.machineRatePerHour,
      e.remarks,
      e.createdBy?.name ?? "",
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
