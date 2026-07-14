import prisma from "../config/prisma.js";
import { Prisma, SettlementType } from "@prisma/client";
import { sourceBankTransactionSelect, toSourceBankTransactionDTO } from "../utils/bank-traceability.js";

/**
 * Settlement — money paid OUT to a Partner (a profit distribution or a return of capital). The
 * counterpart of PartnerInvestment; same dual-path (direct entry here, or a PARTNER_SETTLEMENT
 * transaction-allocation.service.ts allocation of a bank withdrawal).
 */

export const PAYMENT_MODES = ["CASH", "COMPANY_BANK"];
export const SETTLEMENT_TYPES = ["PROFIT_SHARE", "INVESTMENT_RETURN", "OTHER"];
export const SETTLEMENT_TYPE_LABELS: Record<string, string> = {
  PROFIT_SHARE: "Profit Share",
  INVESTMENT_RETURN: "Investment Return",
  OTHER: "Other",
};

export interface PartnerSettlementFormInput {
  partnerId: string;
  settlementType?: string;
  amount: number;
  settlementDate?: string;
  mode: string;
  companyBankAccountId?: string;
  referenceNumber?: string;
  remarks?: string;
}

export interface PartnerSettlementListQuery {
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

function parseSettlementType(t: string | undefined): SettlementType {
  return SETTLEMENT_TYPES.includes(t ?? "") ? (t as SettlementType) : "OTHER";
}

function autoNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SET-${y}${m}-${rand}`;
}

const include = {
  partner: { select: { id: true, name: true, partnerType: true } },
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true } },
  createdBy: { select: { id: true, name: true } },
  allocation: { select: { bankTransaction: { select: sourceBankTransactionSelect } } },
};

type SettlementRow = Prisma.PartnerSettlementGetPayload<{ include: typeof include }>;

function toDTO(s: SettlementRow) {
  return {
    id: s.id,
    companyId: s.companyId,
    partnerId: s.partnerId,
    partner: s.partner,
    settlementNumber: s.settlementNumber,
    settlementType: s.settlementType,
    amount: s.amount.toString(),
    settlementDate: s.settlementDate.toISOString().slice(0, 10),
    mode: s.mode,
    companyBankAccountId: s.companyBankAccountId ?? "",
    companyBankAccount: s.companyBankAccount,
    referenceNumber: s.referenceNumber ?? "",
    remarks: s.remarks ?? "",
    createdById: s.createdById,
    createdBy: s.createdBy,
    sourceBankTransaction: toSourceBankTransactionDTO(s.allocation),
    createdAt: s.createdAt.toISOString(),
  };
}

export async function listPartnerSettlements(companyId: string, query: PartnerSettlementListQuery) {
  const { search = "", partnerId, fromDate, toDate, page = 1, limit = 50, sortBy = "settlementDate", sortOrder = "desc" } = query;

  const where: Prisma.PartnerSettlementWhereInput = {
    companyId,
    ...(partnerId && { partnerId }),
    ...(fromDate || toDate
      ? { settlementDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { settlementNumber: { contains: search, mode: "insensitive" } },
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { partner: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const allowed = ["settlementDate", "amount", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "settlementDate";
  const take = Math.min(200, limit);

  const [total, settlements] = await Promise.all([
    prisma.partnerSettlement.count({ where }),
    prisma.partnerSettlement.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip: (page - 1) * take, take }),
  ]);

  return { total, page, limit: take, data: settlements.map(toDTO) };
}

export async function getPartnerSettlementById(id: string, companyId: string) {
  const settlement = await prisma.partnerSettlement.findFirst({ where: { id, companyId }, include });
  if (!settlement) throw new Error("Partner Settlement not found");
  return toDTO(settlement);
}

export async function createPartnerSettlement(companyId: string, createdById: string, input: PartnerSettlementFormInput) {
  if (!input.partnerId?.trim()) throw new Error("Partner is required");
  const partner = await prisma.partner.findFirst({ where: { id: input.partnerId, companyId } });
  if (!partner) throw new Error("Partner not found");

  if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than zero");
  if (!input.mode?.trim()) throw new Error("Payment mode is required");
  const mode = parseMode(input.mode);

  let companyBankAccountId: string | null = null;
  if (mode === "COMPANY_BANK") {
    if (!input.companyBankAccountId?.trim()) throw new Error("Company bank account is required for Company Bank settlements");
    const account = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
    if (!account) throw new Error("Company bank account not found");
    companyBankAccountId = account.id;
  }

  const settlement = await prisma.partnerSettlement.create({
    data: {
      companyId,
      partnerId: input.partnerId,
      settlementNumber: autoNumber(),
      settlementType: parseSettlementType(input.settlementType),
      amount: input.amount,
      settlementDate: input.settlementDate ? new Date(input.settlementDate) : new Date(),
      mode,
      companyBankAccountId,
      referenceNumber: input.referenceNumber || null,
      remarks: input.remarks || null,
      createdById,
    },
    include,
  });

  return toDTO(settlement);
}

export async function deletePartnerSettlement(id: string, companyId: string) {
  const existing = await prisma.partnerSettlement.findFirst({ where: { id, companyId }, include: { allocation: true } });
  if (!existing) throw new Error("Partner Settlement not found");
  if (existing.allocation) throw new Error("This settlement was created from a bank transaction allocation and cannot be deleted");
  await prisma.partnerSettlement.delete({ where: { id } });
}
