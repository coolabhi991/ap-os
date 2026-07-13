import prisma from "../config/prisma.js";
import { Prisma, LiabilityType, LiabilityInterestType, LiabilitySecurity, LiabilityStatus } from "@prisma/client";
import { getFinancialYear, padSeq } from "../utils/numbering.js";

/**
 * Liability Master — every borrowing the company carries (Home/Car/Gold/Bank Loan, Cash Credit,
 * Overdraft, Credit Card, Friend/Relative/Private/Personal loans). Global to the Company, never
 * Site-scoped here — mirrors Partner exactly. Repayments (see liability-repayment.service.ts) are
 * never entered directly against a Liability; they only ever arrive via
 * transaction-allocation.service.ts allocating a bank withdrawal (LIABILITY_REPAYMENT), which is
 * the only thing permitted to reduce outstandingAmount.
 */

export const LIABILITY_TYPES = [
  "HOME_LOAN",
  "CAR_LOAN",
  "GOLD_LOAN",
  "BANK_LOAN",
  "CASH_CREDIT",
  "OVERDRAFT",
  "CREDIT_CARD",
  "FRIEND_LOAN",
  "RELATIVE_LOAN",
  "PRIVATE_FINANCE",
  "PERSONAL_LOAN",
  "OTHER",
];

export const LIABILITY_TYPE_LABELS: Record<string, string> = {
  HOME_LOAN: "Home Loan",
  CAR_LOAN: "Car Loan",
  GOLD_LOAN: "Gold Loan",
  BANK_LOAN: "Bank Loan",
  CASH_CREDIT: "Cash Credit (CC)",
  OVERDRAFT: "Overdraft (OD)",
  CREDIT_CARD: "Credit Card",
  FRIEND_LOAN: "Friend Loan",
  RELATIVE_LOAN: "Relative Loan",
  PRIVATE_FINANCE: "Private Finance",
  PERSONAL_LOAN: "Personal Loan",
  OTHER: "Other",
};

// Types whose "sanction amount" behaves as a revolving credit limit rather than a one-time
// disbursed principal — drives CC Utilization reporting (see finance-reports.service.ts).
export const REVOLVING_LIABILITY_TYPES = ["CASH_CREDIT", "OVERDRAFT", "CREDIT_CARD"];

export const LIABILITY_INTEREST_TYPES = ["MONTHLY", "ANNUAL", "FIXED", "FLOATING", "NONE"];
export const LIABILITY_INTEREST_TYPE_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  ANNUAL: "Annual",
  FIXED: "Fixed",
  FLOATING: "Floating",
  NONE: "None",
};

export const LIABILITY_SECURITY_TYPES = ["HOUSE", "GOLD", "VEHICLE", "NONE", "OTHER"];
export const LIABILITY_SECURITY_LABELS: Record<string, string> = {
  HOUSE: "House",
  GOLD: "Gold",
  VEHICLE: "Vehicle",
  NONE: "None",
  OTHER: "Other",
};

export const LIABILITY_STATUSES = ["ACTIVE", "CLOSED"];
export const LIABILITY_STATUS_LABELS: Record<string, string> = { ACTIVE: "Active", CLOSED: "Closed" };

export interface LiabilityFormInput {
  loanName: string;
  liabilityType: string;
  lenderName?: string;
  lenderMobile?: string;
  bankName?: string;
  branch?: string;
  accountNumber?: string;
  loanNumber?: string;
  sanctionAmount: number;
  outstandingAmount?: number;
  interestType?: string;
  interestRate?: number;
  emiAmount?: number;
  emiDate?: number;
  statementDate?: number;
  minimumDue?: number;
  startDate: string;
  endDate?: string;
  security?: string;
  status?: string;
  notes?: string;
}

export interface LiabilityListQuery {
  search?: string;
  liabilityType?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

type LiabilityRow = {
  id: string;
  companyId: string;
  loanName: string;
  code: string | null;
  liabilityType: LiabilityType;
  lenderName: string | null;
  lenderMobile: string | null;
  bankName: string | null;
  branch: string | null;
  accountNumber: string | null;
  loanNumber: string | null;
  sanctionAmount: Prisma.Decimal;
  outstandingAmount: Prisma.Decimal;
  interestType: LiabilityInterestType;
  interestRate: Prisma.Decimal;
  emiAmount: Prisma.Decimal;
  emiDate: number | null;
  statementDate: number | null;
  minimumDue: Prisma.Decimal;
  startDate: Date;
  endDate: Date | null;
  security: LiabilitySecurity;
  status: LiabilityStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toDTO(l: LiabilityRow) {
  return {
    id: l.id,
    companyId: l.companyId,
    loanName: l.loanName,
    code: l.code ?? "",
    liabilityType: l.liabilityType,
    lenderName: l.lenderName ?? "",
    lenderMobile: l.lenderMobile ?? "",
    bankName: l.bankName ?? "",
    branch: l.branch ?? "",
    accountNumber: l.accountNumber ?? "",
    loanNumber: l.loanNumber ?? "",
    sanctionAmount: l.sanctionAmount.toString(),
    outstandingAmount: l.outstandingAmount.toString(),
    interestType: l.interestType,
    interestRate: l.interestRate.toString(),
    emiAmount: l.emiAmount.toString(),
    emiDate: l.emiDate,
    statementDate: l.statementDate,
    minimumDue: l.minimumDue.toString(),
    availableLimit: (Number(l.sanctionAmount) - Number(l.outstandingAmount)).toFixed(2),
    startDate: l.startDate.toISOString().slice(0, 10),
    endDate: l.endDate ? l.endDate.toISOString().slice(0, 10) : "",
    security: l.security,
    status: l.status,
    notes: l.notes ?? "",
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

function parseEnum<T extends string>(value: T | undefined, allowed: string[], fallback: T): T {
  return value && allowed.includes(value) ? value : fallback;
}

const SORTABLE_FIELDS = ["loanName", "sanctionAmount", "outstandingAmount", "startDate", "createdAt"];

export async function listLiabilities(companyId: string, query: LiabilityListQuery) {
  const { search = "", liabilityType, status, page = 1, limit = 50, sortBy = "createdAt", sortOrder = "desc" } = query;

  const where: Prisma.LiabilityWhereInput = {
    companyId,
    ...(liabilityType && LIABILITY_TYPES.includes(liabilityType) && { liabilityType: liabilityType as LiabilityType }),
    ...(status && LIABILITY_STATUSES.includes(status) && { status: status as LiabilityStatus }),
    ...(search && {
      OR: [
        { loanName: { contains: search, mode: "insensitive" } },
        { lenderName: { contains: search, mode: "insensitive" } },
        { bankName: { contains: search, mode: "insensitive" } },
        { accountNumber: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const orderField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : "createdAt";
  const take = Math.min(100, limit);

  const [total, liabilities] = await Promise.all([
    prisma.liability.count({ where }),
    prisma.liability.findMany({ where, orderBy: { [orderField]: sortOrder }, skip: (page - 1) * take, take }),
  ]);

  return { total, page, limit: take, data: liabilities.map(toDTO) };
}

export async function getLiabilityById(id: string, companyId: string) {
  const liability = await prisma.liability.findFirst({ where: { id, companyId } });
  if (!liability) throw new Error("Liability not found");
  return toDTO(liability);
}

function validateInput(input: Partial<LiabilityFormInput>, isCreate: boolean) {
  if (isCreate && !input.loanName?.trim()) throw new Error("Loan name is required");
  if (isCreate && !input.liabilityType) throw new Error("Liability type is required");
  if (isCreate && (input.sanctionAmount === undefined || input.sanctionAmount <= 0)) {
    throw new Error("Sanction amount must be greater than zero");
  }
  if (isCreate && !input.startDate) throw new Error("Start date is required");
}

/**
 * System-generated, permanent, read-only Liability code (Document Numbering Standard) —
 * LIA/<FY>/<Seq>, sequential per company within the Financial Year of creation.
 */
async function generateLiabilityCode(companyId: string): Promise<string> {
  const fy = getFinancialYear(new Date());
  const count = await prisma.liability.count({ where: { companyId, code: { startsWith: `LIA/${fy}/` } } });
  return `LIA/${fy}/${padSeq(count + 1)}`;
}

export async function createLiability(companyId: string, input: LiabilityFormInput) {
  validateInput(input, true);
  const sanctionAmount = input.sanctionAmount;
  const outstandingAmount = input.outstandingAmount !== undefined ? input.outstandingAmount : sanctionAmount;
  if (outstandingAmount < 0) throw new Error("Outstanding amount cannot be negative");
  const code = await generateLiabilityCode(companyId);

  const liability = await prisma.liability.create({
    data: {
      companyId,
      loanName: input.loanName.trim(),
      code,
      liabilityType: parseEnum(input.liabilityType as LiabilityType, LIABILITY_TYPES, "OTHER" as LiabilityType),
      lenderName: input.lenderName || null,
      lenderMobile: input.lenderMobile || null,
      bankName: input.bankName || null,
      branch: input.branch || null,
      accountNumber: input.accountNumber || null,
      loanNumber: input.loanNumber || null,
      sanctionAmount,
      outstandingAmount,
      interestType: parseEnum(input.interestType as LiabilityInterestType, LIABILITY_INTEREST_TYPES, "NONE" as LiabilityInterestType),
      interestRate: input.interestRate ?? 0,
      emiAmount: input.emiAmount ?? 0,
      emiDate: input.emiDate ?? null,
      statementDate: input.statementDate ?? null,
      minimumDue: input.minimumDue ?? 0,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      security: parseEnum(input.security as LiabilitySecurity, LIABILITY_SECURITY_TYPES, "NONE" as LiabilitySecurity),
      status: parseEnum(input.status as LiabilityStatus, LIABILITY_STATUSES, "ACTIVE" as LiabilityStatus),
      notes: input.notes || null,
    },
  });
  return toDTO(liability);
}

export async function updateLiability(id: string, companyId: string, input: Partial<LiabilityFormInput>) {
  const existing = await getLiabilityById(id, companyId);
  validateInput(input, false);
  if (input.sanctionAmount !== undefined && input.sanctionAmount <= 0) throw new Error("Sanction amount must be greater than zero");
  if (input.outstandingAmount !== undefined && input.outstandingAmount < 0) throw new Error("Outstanding amount cannot be negative");

  // Once a repayment exists, Outstanding is driven exclusively by the repayment ledger
  // (liability-repayment.service.ts) — allowing a direct edit here would silently desync the two.
  if (input.outstandingAmount !== undefined && input.outstandingAmount !== Number(existing.outstandingAmount)) {
    const repaymentCount = await prisma.liabilityRepayment.count({ where: { liabilityId: id } });
    if (repaymentCount > 0) {
      throw new Error("Outstanding amount cannot be edited directly once repayments exist — record a repayment instead");
    }
  }

  const liability = await prisma.liability.update({
    where: { id },
    data: {
      ...(input.loanName !== undefined && { loanName: input.loanName.trim() }),
      ...(input.liabilityType !== undefined && { liabilityType: parseEnum(input.liabilityType as LiabilityType, LIABILITY_TYPES, "OTHER" as LiabilityType) }),
      ...(input.lenderName !== undefined && { lenderName: input.lenderName || null }),
      ...(input.lenderMobile !== undefined && { lenderMobile: input.lenderMobile || null }),
      ...(input.bankName !== undefined && { bankName: input.bankName || null }),
      ...(input.branch !== undefined && { branch: input.branch || null }),
      ...(input.accountNumber !== undefined && { accountNumber: input.accountNumber || null }),
      ...(input.loanNumber !== undefined && { loanNumber: input.loanNumber || null }),
      ...(input.sanctionAmount !== undefined && { sanctionAmount: input.sanctionAmount }),
      ...(input.outstandingAmount !== undefined && { outstandingAmount: input.outstandingAmount }),
      ...(input.interestType !== undefined && { interestType: parseEnum(input.interestType as LiabilityInterestType, LIABILITY_INTEREST_TYPES, "NONE" as LiabilityInterestType) }),
      ...(input.interestRate !== undefined && { interestRate: input.interestRate }),
      ...(input.emiAmount !== undefined && { emiAmount: input.emiAmount }),
      ...(input.emiDate !== undefined && { emiDate: input.emiDate }),
      ...(input.statementDate !== undefined && { statementDate: input.statementDate }),
      ...(input.minimumDue !== undefined && { minimumDue: input.minimumDue }),
      ...(input.startDate !== undefined && { startDate: new Date(input.startDate) }),
      ...(input.endDate !== undefined && { endDate: input.endDate ? new Date(input.endDate) : null }),
      ...(input.security !== undefined && { security: parseEnum(input.security as LiabilitySecurity, LIABILITY_SECURITY_TYPES, "NONE" as LiabilitySecurity) }),
      ...(input.status !== undefined && { status: parseEnum(input.status as LiabilityStatus, LIABILITY_STATUSES, "ACTIVE" as LiabilityStatus) }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
    },
  });
  return toDTO(liability);
}

export async function deleteLiability(id: string, companyId: string) {
  const existing = await prisma.liability.findFirst({
    where: { id, companyId },
    include: { repayments: { take: 1 }, allocations: { take: 1 } },
  });
  if (!existing) throw new Error("Liability not found");
  if (existing.repayments.length > 0) {
    throw new Error("This liability has repayment history and cannot be deleted — close it instead");
  }
  if (existing.allocations.length > 0) {
    throw new Error("This liability has a linked bank transaction allocation and cannot be deleted");
  }
  await prisma.liability.delete({ where: { id } });
}
