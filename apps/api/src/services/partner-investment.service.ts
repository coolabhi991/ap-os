import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { sourceBankTransactionSelect, toSourceBankTransactionDTO } from "../utils/bank-traceability.js";

/**
 * Investment Ledger — a Partner's capital contribution into the company. Always global, never
 * Site-scoped (Sites only see this money indirectly, once it's later spent via a
 * SITE_EXPENSE/LABOUR TransactionAllocation out of the same bank account it landed in). Created
 * either directly here (e.g. a cash investment) or via transaction-allocation.service.ts
 * allocating a bank deposit (OWNER_INVESTMENT/PARTNER_INVESTMENT) — the exact dual-path pattern
 * already used by VendorPayment/LabourPayment.
 */

export const PAYMENT_MODES = ["CASH", "COMPANY_BANK"];

export interface PartnerInvestmentFormInput {
  partnerId: string;
  amount: number;
  investmentDate?: string;
  mode: string;
  companyBankAccountId?: string;
  referenceNumber?: string;
  remarks?: string;
}

export interface PartnerInvestmentListQuery {
  search?: string;
  partnerId?: string;
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

function autoNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${y}${m}-${rand}`;
}

const include = {
  partner: { select: { id: true, name: true, partnerType: true } },
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true } },
  createdBy: { select: { id: true, name: true } },
  allocation: { select: { bankTransaction: { select: sourceBankTransactionSelect } } },
};

type InvestmentRow = Prisma.PartnerInvestmentGetPayload<{ include: typeof include }>;

function toDTO(i: InvestmentRow) {
  return {
    id: i.id,
    companyId: i.companyId,
    partnerId: i.partnerId,
    partner: i.partner,
    investmentNumber: i.investmentNumber,
    amount: i.amount.toString(),
    investmentDate: i.investmentDate.toISOString().slice(0, 10),
    mode: i.mode,
    companyBankAccountId: i.companyBankAccountId ?? "",
    companyBankAccount: i.companyBankAccount,
    referenceNumber: i.referenceNumber ?? "",
    remarks: i.remarks ?? "",
    createdById: i.createdById,
    createdBy: i.createdBy,
    sourceBankTransaction: toSourceBankTransactionDTO(i.allocation),
    createdAt: i.createdAt.toISOString(),
  };
}

export async function listPartnerInvestments(companyId: string, query: PartnerInvestmentListQuery) {
  const { search = "", partnerId, fromDate, toDate, page = 1, limit = 50, sortBy = "investmentDate", sortOrder = "desc" } = query;

  const where: Prisma.PartnerInvestmentWhereInput = {
    companyId,
    ...(partnerId && { partnerId }),
    ...(fromDate || toDate
      ? { investmentDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { investmentNumber: { contains: search, mode: "insensitive" } },
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { partner: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const allowed = ["investmentDate", "amount", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "investmentDate";
  const take = Math.min(200, limit);

  const [total, investments] = await Promise.all([
    prisma.partnerInvestment.count({ where }),
    prisma.partnerInvestment.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip: (page - 1) * take, take }),
  ]);

  return { total, page, limit: take, data: investments.map(toDTO) };
}

export async function getPartnerInvestmentById(id: string, companyId: string) {
  const investment = await prisma.partnerInvestment.findFirst({ where: { id, companyId }, include });
  if (!investment) throw new Error("Partner Investment not found");
  return toDTO(investment);
}

export async function createPartnerInvestment(companyId: string, createdById: string, input: PartnerInvestmentFormInput) {
  if (!input.partnerId?.trim()) throw new Error("Partner is required");
  const partner = await prisma.partner.findFirst({ where: { id: input.partnerId, companyId } });
  if (!partner) throw new Error("Partner not found");

  if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than zero");
  if (!input.mode?.trim()) throw new Error("Payment mode is required");
  const mode = parseMode(input.mode);

  let companyBankAccountId: string | null = null;
  if (mode === "COMPANY_BANK") {
    if (!input.companyBankAccountId?.trim()) throw new Error("Company bank account is required for Company Bank investments");
    const account = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
    if (!account) throw new Error("Company bank account not found");
    companyBankAccountId = account.id;
  }

  const investment = await prisma.partnerInvestment.create({
    data: {
      companyId,
      partnerId: input.partnerId,
      investmentNumber: autoNumber(),
      amount: input.amount,
      investmentDate: input.investmentDate ? new Date(input.investmentDate) : new Date(),
      mode,
      companyBankAccountId,
      referenceNumber: input.referenceNumber || null,
      remarks: input.remarks || null,
      createdById,
    },
    include,
  });

  return toDTO(investment);
}

export async function deletePartnerInvestment(id: string, companyId: string) {
  const existing = await prisma.partnerInvestment.findFirst({ where: { id, companyId }, include: { allocation: true } });
  if (!existing) throw new Error("Partner Investment not found");
  if (existing.allocation) throw new Error("This investment was created from a bank transaction allocation and cannot be deleted");
  await prisma.partnerInvestment.delete({ where: { id } });
}
