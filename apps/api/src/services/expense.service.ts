import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

export const PAYMENT_MODES = ["CASH", "COMPANY_BANK", "CREDIT_CARD", "VENDOR_CREDIT"];

export interface ExpenseFormInput {
  projectId: string;
  categoryId: string;
  vendorId?: string;
  expenseDate?: string;
  description?: string;
  amount: number;
  paymentMode: string;
  companyBankAccountId?: string;
  attachmentFileName?: string;
  attachmentFileUrl?: string;
  remarks?: string;
}

export interface ExpenseListQuery {
  search?: string;
  projectId?: string;
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

function autoNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EXP-${y}${m}-${rand}`;
}

const include = {
  project: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true } },
  createdBy: { select: { id: true, name: true } },
};

type ExpenseRow = Prisma.ExpenseGetPayload<{ include: typeof include }>;

function toDTO(e: ExpenseRow) {
  return {
    id: e.id,
    companyId: e.companyId,
    projectId: e.projectId,
    project: e.project,
    categoryId: e.categoryId,
    category: e.category,
    vendorId: e.vendorId ?? "",
    vendor: e.vendor,
    expenseNumber: e.expenseNumber,
    expenseDate: e.expenseDate.toISOString().slice(0, 10),
    description: e.description ?? "",
    amount: e.amount.toString(),
    paymentMode: e.paymentMode,
    companyBankAccountId: e.companyBankAccountId ?? "",
    companyBankAccount: e.companyBankAccount,
    attachmentFileName: e.attachmentFileName ?? "",
    attachmentFileUrl: e.attachmentFileUrl ?? "",
    remarks: e.remarks ?? "",
    createdById: e.createdById,
    createdBy: e.createdBy,
    isDeleted: e.isDeleted,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

/** Validates project/category/vendor/bank-account references and cross-field payment-mode rules. */
async function validateAndNormalize(companyId: string, input: ExpenseFormInput) {
  if (!input.projectId?.trim()) throw new Error("Project is required");
  const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
  if (!project) throw new Error("Project not found");

  if (!input.categoryId?.trim()) throw new Error("Category is required");
  const category = await prisma.expenseCategory.findFirst({ where: { id: input.categoryId, companyId } });
  if (!category) throw new Error("Expense category not found");

  if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than zero");

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

  let companyBankAccountId: string | null = null;
  if (paymentMode === "COMPANY_BANK") {
    if (!input.companyBankAccountId?.trim()) throw new Error("Company bank account is required for Company Bank payments");
    const account = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
    if (!account) throw new Error("Company bank account not found");
    companyBankAccountId = account.id;
  }

  return { paymentMode, vendorId, companyBankAccountId };
}

export async function listExpenses(companyId: string, query: ExpenseListQuery) {
  const {
    search = "",
    projectId,
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
  const { paymentMode, vendorId, companyBankAccountId } = await validateAndNormalize(companyId, input);

  const expense = await prisma.expense.create({
    data: {
      companyId,
      projectId: input.projectId,
      categoryId: input.categoryId,
      vendorId,
      expenseNumber: autoNumber(),
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
      description: input.description || null,
      amount: input.amount,
      paymentMode,
      companyBankAccountId,
      attachmentFileName: input.attachmentFileName || null,
      attachmentFileUrl: input.attachmentFileUrl || null,
      remarks: input.remarks || null,
      createdById,
    },
    include,
  });

  return toDTO(expense);
}

export async function updateExpense(id: string, companyId: string, input: ExpenseFormInput) {
  const existing = await prisma.expense.findFirst({ where: { id, companyId, isDeleted: false } });
  if (!existing) throw new Error("Expense not found");

  const { paymentMode, vendorId, companyBankAccountId } = await validateAndNormalize(companyId, input);

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      projectId: input.projectId,
      categoryId: input.categoryId,
      vendorId,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : existing.expenseDate,
      description: input.description || null,
      amount: input.amount,
      paymentMode,
      companyBankAccountId,
      attachmentFileName: input.attachmentFileName || null,
      attachmentFileUrl: input.attachmentFileUrl || null,
      remarks: input.remarks || null,
    },
    include,
  });

  return toDTO(expense);
}

/** Soft delete only — expenses are a financial record and are never hard-deleted. */
export async function deleteExpense(id: string, companyId: string) {
  const existing = await prisma.expense.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Expense not found");
  if (existing.isDeleted) throw new Error("Expense already deleted");

  await prisma.expense.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
}

export async function getExpenseDashboard(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const baseWhere: Prisma.ExpenseWhereInput = { companyId, isDeleted: false };

  const [todayAgg, monthAgg, byProjectRaw, byCategoryRaw, byModeRaw, vendorCreditAgg, recentExpenses] = await Promise.all([
    prisma.expense.aggregate({ where: { ...baseWhere, expenseDate: { gte: startOfDay } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ where: { ...baseWhere, expenseDate: { gte: startOfMonth } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.groupBy({ by: ["projectId"], where: baseWhere, _sum: { amount: true }, _count: { _all: true }, orderBy: { _sum: { amount: "desc" } }, take: 10 }),
    prisma.expense.groupBy({ by: ["categoryId"], where: baseWhere, _sum: { amount: true }, _count: { _all: true }, orderBy: { _sum: { amount: "desc" } } }),
    prisma.expense.groupBy({ by: ["paymentMode"], where: baseWhere, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ where: { ...baseWhere, paymentMode: "VENDOR_CREDIT" }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.findMany({ where: baseWhere, include, orderBy: { expenseDate: "desc" }, take: 10 }),
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
    recentExpenses: recentExpenses.map(toDTO),
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
      e.remarks,
      e.createdBy?.name ?? "",
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
