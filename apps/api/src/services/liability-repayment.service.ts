import prisma from "../config/prisma.js";
import { Prisma, LiabilityType } from "@prisma/client";
import { LIABILITY_TYPES, deriveLiabilityStatus } from "./liability.service.js";
import { sourceBankTransactionSelect, toSourceBankTransactionDTO } from "../utils/bank-traceability.js";

/**
 * Liability Repayment History. Deliberately NO direct "create repayment" entry point exists here
 * — recordLiabilityRepayment is only ever called by transaction-allocation.service.ts when a bank
 * withdrawal is allocated as LIABILITY_REPAYMENT (Bank Statement → Transaction Allocation →
 * Liability, per the Finance module's mandate). This mirrors recordRunningBillPayment's role in
 * running-bill.service.ts exactly, except Running Bills/Vendor Bills also allow a direct manual
 * payment; Liability repayments never do. principalPaid reduces Liability.outstandingAmount;
 * interestPaid never does — the two are tracked separately here so Interest History
 * (finance-reports.service.ts) can roll up interest paid without a second ledger.
 */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function autoRepaymentNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `LRP-${y}${m}-${rand}`;
}

export interface RecordLiabilityRepaymentInput {
  liabilityId: string;
  principalPaid: number;
  interestPaid: number;
  paymentDate?: string;
  companyBankAccountId: string;
  remarks?: string;
}

export interface LiabilityRepaymentListQuery {
  liabilityId?: string;
  liabilityType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

const include = {
  liability: { select: { id: true, loanName: true, liabilityType: true } },
  companyBankAccount: { select: { id: true, nickname: true, bankName: true, accountNumber: true } },
  createdBy: { select: { id: true, name: true } },
  allocation: { select: { bankTransaction: { select: sourceBankTransactionSelect } } },
};

type RepaymentRow = Prisma.LiabilityRepaymentGetPayload<{ include: typeof include }>;

function toDTO(r: RepaymentRow) {
  return {
    id: r.id,
    companyId: r.companyId,
    liabilityId: r.liabilityId,
    liability: r.liability,
    repaymentNumber: r.repaymentNumber,
    paymentDate: r.paymentDate.toISOString().slice(0, 10),
    principalPaid: r.principalPaid.toString(),
    interestPaid: r.interestPaid.toString(),
    totalPaid: r.totalPaid.toString(),
    companyBankAccountId: r.companyBankAccountId,
    companyBankAccount: r.companyBankAccount,
    remarks: r.remarks ?? "",
    createdById: r.createdById,
    createdBy: r.createdBy,
    sourceBankTransaction: toSourceBankTransactionDTO(r.allocation),
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * Called only from transaction-allocation.service.ts. Creates the LiabilityRepayment row and
 * atomically decrements Liability.outstandingAmount by principalPaid — the only place that
 * balance is ever reduced.
 */
export async function recordLiabilityRepayment(companyId: string, createdById: string, input: RecordLiabilityRepaymentInput) {
  const liability = await prisma.liability.findFirst({ where: { id: input.liabilityId, companyId } });
  if (!liability) throw new Error("Liability not found");

  const principalPaid = Number(input.principalPaid) || 0;
  const interestPaid = Number(input.interestPaid) || 0;
  const totalPaid = round2(principalPaid + interestPaid);

  if (principalPaid < 0 || interestPaid < 0) throw new Error("Principal Paid and Interest Paid cannot be negative");
  if (totalPaid <= 0) throw new Error("Principal Paid + Interest Paid must be greater than zero");

  const currentOutstanding = Number(liability.outstandingAmount);
  if (principalPaid > currentOutstanding + 0.01) {
    throw new Error(`Principal Paid (${principalPaid}) exceeds the outstanding balance (${currentOutstanding})`);
  }

  const account = await prisma.companyBankAccount.findFirst({ where: { id: input.companyBankAccountId, companyId } });
  if (!account) throw new Error("Company bank account not found");

  const newOutstanding = round2(currentOutstanding - principalPaid);

  const { repayment } = await prisma.$transaction(async (tx) => {
    const created = await tx.liabilityRepayment.create({
      data: {
        companyId,
        liabilityId: input.liabilityId,
        repaymentNumber: autoRepaymentNumber(),
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        principalPaid,
        interestPaid,
        totalPaid,
        companyBankAccountId: account.id,
        remarks: input.remarks || null,
        createdById,
      },
    });

    // Outstanding = 0 -> Status automatically becomes Closed (Business Rules) — re-derived here,
    // never set independently, so it can never drift from the balance that determines it.
    await tx.liability.update({
      where: { id: input.liabilityId },
      data: { outstandingAmount: newOutstanding, status: deriveLiabilityStatus(newOutstanding) },
    });

    return { repayment: created };
  });

  return { id: repayment.id, totalPaid: repayment.totalPaid.toString() };
}

export async function listLiabilityRepayments(companyId: string, query: LiabilityRepaymentListQuery) {
  const { liabilityId, liabilityType, fromDate, toDate, page = 1, limit = 100 } = query;

  const where: Prisma.LiabilityRepaymentWhereInput = {
    companyId,
    ...(liabilityId && { liabilityId }),
    ...(liabilityType && LIABILITY_TYPES.includes(liabilityType) && { liability: { liabilityType: liabilityType as LiabilityType } }),
    ...(fromDate || toDate
      ? { paymentDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
  };

  const take = Math.min(200, limit);
  const [total, rows] = await Promise.all([
    prisma.liabilityRepayment.count({ where }),
    prisma.liabilityRepayment.findMany({ where, include, orderBy: { paymentDate: "desc" }, skip: (page - 1) * take, take }),
  ]);

  return { total, page, limit: take, data: rows.map(toDTO) };
}
