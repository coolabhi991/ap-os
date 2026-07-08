import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

export const ADVANCE_MODES = ["CASH", "COMPANY_BANK"];

export interface LabourAdvanceFormInput {
  labourId: string;
  projectId?: string;
  amount: number;
  advanceDate?: string;
  mode: string;
  companyBankAccountId?: string;
  remarks?: string;
}

export interface LabourAdvanceListQuery {
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
  if (!ADVANCE_MODES.includes(upper)) throw new Error(`Invalid mode: ${m}. Must be one of ${ADVANCE_MODES.join(", ")}`);
  return upper;
}

const include = {
  labour: { select: { id: true, name: true, category: true } },
  project: { select: { id: true, name: true } },
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true } },
  createdBy: { select: { id: true, name: true } },
};

type AdvanceRow = Prisma.LabourAdvanceGetPayload<{ include: typeof include }>;

function toDTO(a: AdvanceRow) {
  return {
    id: a.id,
    companyId: a.companyId,
    labourId: a.labourId,
    labour: a.labour,
    projectId: a.projectId ?? "",
    project: a.project,
    amount: a.amount.toString(),
    advanceDate: a.advanceDate.toISOString().slice(0, 10),
    mode: a.mode,
    companyBankAccountId: a.companyBankAccountId ?? "",
    companyBankAccount: a.companyBankAccount,
    remarks: a.remarks ?? "",
    createdById: a.createdById,
    createdBy: a.createdBy,
    isDeleted: a.isDeleted,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function listLabourAdvances(companyId: string, query: LabourAdvanceListQuery) {
  const { search = "", labourId, projectId, fromDate, toDate, page = 1, limit = 20, sortBy = "advanceDate", sortOrder = "desc" } = query;

  const where: Prisma.LabourAdvanceWhereInput = {
    companyId,
    isDeleted: false,
    ...(labourId && { labourId }),
    ...(projectId && { projectId }),
    ...(fromDate || toDate
      ? { advanceDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { labour: { name: { contains: search, mode: "insensitive" } } },
        { remarks: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowed = ["advanceDate", "amount", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "advanceDate";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, advances] = await Promise.all([
    prisma.labourAdvance.count({ where }),
    prisma.labourAdvance.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: advances.map(toDTO) };
}

export async function getLabourAdvanceById(id: string, companyId: string) {
  const advance = await prisma.labourAdvance.findFirst({ where: { id, companyId, isDeleted: false }, include });
  if (!advance) throw new Error("Advance not found");
  return toDTO(advance);
}

export async function createLabourAdvance(companyId: string, createdById: string, input: LabourAdvanceFormInput) {
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

  const advance = await prisma.labourAdvance.create({
    data: {
      companyId,
      labourId: input.labourId,
      projectId: input.projectId || null,
      amount: input.amount,
      advanceDate: input.advanceDate ? new Date(input.advanceDate) : new Date(),
      mode,
      companyBankAccountId,
      remarks: input.remarks || null,
      createdById,
    },
    include,
  });

  return toDTO(advance);
}

/** Soft delete only — advances are a financial record. */
export async function deleteLabourAdvance(id: string, companyId: string) {
  const existing = await prisma.labourAdvance.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Advance not found");
  if (existing.isDeleted) throw new Error("Advance already deleted");

  await prisma.labourAdvance.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
}

export async function exportLabourAdvancesToCSV(companyId: string, query: LabourAdvanceListQuery) {
  const { data } = await listLabourAdvances(companyId, { ...query, page: 1, limit: 5000 });

  const headers = ["Date", "Labour", "Project", "Amount", "Mode", "Company Bank Account", "Remarks", "Created By"];

  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = data.map((a) =>
    [
      a.advanceDate,
      a.labour?.name ?? "",
      a.project?.name ?? "",
      a.amount,
      a.mode,
      a.companyBankAccount ? `${a.companyBankAccount.bankName} (${a.companyBankAccount.accountNumber})` : "",
      a.remarks,
      a.createdBy?.name ?? "",
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
