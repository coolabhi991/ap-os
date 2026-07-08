import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { createExpense } from "./expense.service.js";

export const PAYMENT_MODES = ["CASH", "COMPANY_BANK"];

export interface LabourPaymentFormInput {
  labourId: string;
  projectId?: string;
  amount: number;
  paymentDate?: string;
  periodFrom?: string;
  periodTo?: string;
  mode: string;
  companyBankAccountId?: string;
  remarks?: string;
  /** Opt-in only — never automatic. Requires projectId and a "Labour" expense category to exist. */
  logAsExpense?: boolean;
}

export interface LabourPaymentListQuery {
  search?: string;
  labourId?: string;
  projectId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function parseMode(m: string): string {
  const upper = m.trim().toUpperCase();
  if (!PAYMENT_MODES.includes(upper)) throw new Error(`Invalid mode: ${m}. Must be one of ${PAYMENT_MODES.join(", ")}`);
  return upper;
}

const include = {
  labour: { select: { id: true, name: true, category: true, contractorId: true } },
  project: { select: { id: true, name: true } },
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true } },
  expense: { select: { id: true, expenseNumber: true } },
  createdBy: { select: { id: true, name: true } },
};

type PaymentRow = Prisma.LabourPaymentGetPayload<{ include: typeof include }>;

function toDTO(p: PaymentRow) {
  return {
    id: p.id,
    companyId: p.companyId,
    labourId: p.labourId,
    labour: p.labour,
    projectId: p.projectId ?? "",
    project: p.project,
    amount: p.amount.toString(),
    paymentDate: p.paymentDate.toISOString().slice(0, 10),
    periodFrom: p.periodFrom?.toISOString().slice(0, 10) ?? "",
    periodTo: p.periodTo?.toISOString().slice(0, 10) ?? "",
    mode: p.mode,
    companyBankAccountId: p.companyBankAccountId ?? "",
    companyBankAccount: p.companyBankAccount,
    expenseId: p.expenseId ?? "",
    expense: p.expense,
    remarks: p.remarks ?? "",
    createdById: p.createdById,
    createdBy: p.createdBy,
    isDeleted: p.isDeleted,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function listLabourPayments(companyId: string, query: LabourPaymentListQuery) {
  const { search = "", labourId, projectId, fromDate, toDate, page = 1, limit = 20, sortBy = "paymentDate", sortOrder = "desc" } = query;

  const where: Prisma.LabourPaymentWhereInput = {
    companyId,
    isDeleted: false,
    ...(labourId && { labourId }),
    ...(projectId && { projectId }),
    ...(fromDate || toDate
      ? { paymentDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { labour: { name: { contains: search, mode: "insensitive" } } },
        { remarks: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowed = ["paymentDate", "amount", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "paymentDate";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, payments] = await Promise.all([
    prisma.labourPayment.count({ where }),
    prisma.labourPayment.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: payments.map(toDTO) };
}

export async function getLabourPaymentById(id: string, companyId: string) {
  const payment = await prisma.labourPayment.findFirst({ where: { id, companyId, isDeleted: false }, include });
  if (!payment) throw new Error("Payment not found");
  return toDTO(payment);
}

export async function createLabourPayment(companyId: string, createdById: string, input: LabourPaymentFormInput) {
  if (!input.labourId?.trim()) throw new Error("Labour is required");
  const labour = await prisma.labour.findFirst({ where: { id: input.labourId, companyId, isDeleted: false } });
  if (!labour) throw new Error("Labour not found");

  if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than zero");
  if (!input.mode?.trim()) throw new Error("Payment mode is required");
  const mode = parseMode(input.mode);

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

  let companyBankAccountId: string | null = null;
  if (mode === "COMPANY_BANK") {
    if (!input.companyBankAccountId?.trim()) throw new Error("Company bank account is required for Company Bank payments");
    const account = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
    if (!account) throw new Error("Company bank account not found");
    companyBankAccountId = account.id;
  }

  let expenseId: string | null = null;
  if (input.logAsExpense) {
    if (!input.projectId) throw new Error("Project is required to log this payment as a Site Expense");

    const labourCategory = await prisma.expenseCategory.findFirst({ where: { companyId, name: "Labour" } });
    if (!labourCategory) throw new Error('"Labour" expense category not found — create it under Site Expenses first');

    // Reuses the existing Expense service (auto-numbering, validation) rather than duplicating it.
    // Not transactional with the LabourPayment insert below; if that insert fails, the Expense
    // row remains as a harmless orphan rather than risking a partial/inconsistent transaction.
    const expense = await createExpense(companyId, createdById, {
      projectId: input.projectId,
      categoryId: labourCategory.id,
      vendorId: labour.contractorId || undefined,
      amount: input.amount,
      paymentMode: mode,
      companyBankAccountId: companyBankAccountId || undefined,
      expenseDate: input.paymentDate,
      description: `Labour payment — ${labour.name}`,
    });
    expenseId = expense.id;
  }

  const payment = await prisma.labourPayment.create({
    data: {
      companyId,
      labourId: input.labourId,
      projectId: input.projectId || null,
      amount: input.amount,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
      periodFrom: input.periodFrom ? new Date(input.periodFrom) : null,
      periodTo: input.periodTo ? new Date(input.periodTo) : null,
      mode,
      companyBankAccountId,
      expenseId,
      remarks: input.remarks || null,
      createdById,
    },
    include,
  });

  return toDTO(payment);
}

/** Soft delete only — payments are a financial record. Does not reverse any linked Site Expense. */
export async function deleteLabourPayment(id: string, companyId: string) {
  const existing = await prisma.labourPayment.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Payment not found");
  if (existing.isDeleted) throw new Error("Payment already deleted");

  await prisma.labourPayment.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
}

export async function exportLabourPaymentsToCSV(companyId: string, query: LabourPaymentListQuery) {
  const { data } = await listLabourPayments(companyId, { ...query, page: 1, limit: 5000 });

  const headers = ["Date", "Labour", "Project", "Amount", "Mode", "Company Bank Account", "Linked Expense", "Remarks", "Created By"];

  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = data.map((p) =>
    [
      p.paymentDate,
      p.labour?.name ?? "",
      p.project?.name ?? "",
      p.amount,
      p.mode,
      p.companyBankAccount ? `${p.companyBankAccount.bankName} (${p.companyBankAccount.accountNumber})` : "",
      p.expense?.expenseNumber ?? "",
      p.remarks,
      p.createdBy?.name ?? "",
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
