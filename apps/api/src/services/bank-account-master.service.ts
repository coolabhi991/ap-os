import prisma from "../config/prisma.js";
import { Prisma, BankAccountOwnerType, BankAccountStatus } from "@prisma/client";

export const BANK_ACCOUNT_OWNER_TYPES = ["COMPANY", "EMPLOYEE", "VENDOR", "CLIENT", "PARTNER", "LIABILITY", "OTHER"];
export const BANK_ACCOUNT_STATUSES = ["ACTIVE", "INACTIVE", "CLOSED"];

export interface BankAccountMasterFormInput {
  ownerType: string;
  ownerId?: string;
  ownerLabel?: string;
  bankName: string;
  branch?: string;
  accountHolder?: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  isPrimary?: boolean;
  status?: string;
}

export interface BankAccountMasterListQuery {
  ownerType?: string;
  ownerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

function parseOwnerType(t: string | undefined): BankAccountOwnerType {
  if (t && BANK_ACCOUNT_OWNER_TYPES.includes(t.toUpperCase())) return t.toUpperCase() as BankAccountOwnerType;
  throw new Error(`Invalid owner type: ${t}. Must be one of ${BANK_ACCOUNT_OWNER_TYPES.join(", ")}`);
}

function parseStatus(s: string | undefined): BankAccountStatus | undefined {
  return s && BANK_ACCOUNT_STATUSES.includes(s.toUpperCase()) ? (s.toUpperCase() as BankAccountStatus) : undefined;
}

function toDTO(a: {
  id: string;
  companyId: string;
  ownerType: BankAccountOwnerType;
  ownerId: string | null;
  ownerLabel: string | null;
  bankName: string;
  branch: string | null;
  accountHolder: string | null;
  accountNumber: string;
  ifscCode: string;
  upiId: string | null;
  isPrimary: boolean;
  status: BankAccountStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: a.id,
    companyId: a.companyId,
    ownerType: a.ownerType,
    ownerId: a.ownerId ?? "",
    ownerLabel: a.ownerLabel ?? "",
    bankName: a.bankName,
    branch: a.branch ?? "",
    accountHolder: a.accountHolder ?? "",
    accountNumber: a.accountNumber,
    ifscCode: a.ifscCode,
    upiId: a.upiId ?? "",
    isPrimary: a.isPrimary,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function listBankAccountMasters(companyId: string, query: BankAccountMasterListQuery) {
  const { ownerType, ownerId, status, page = 1, limit = 50 } = query;

  const where: Prisma.BankAccountMasterWhereInput = {
    companyId,
    ...(ownerType && { ownerType: parseOwnerType(ownerType) }),
    ...(ownerId && { ownerId }),
    ...(parseStatus(status) && { status: parseStatus(status) }),
  };

  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, accounts] = await Promise.all([
    prisma.bankAccountMaster.count({ where }),
    prisma.bankAccountMaster.findMany({ where, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], skip, take }),
  ]);

  return { total, page, limit: take, data: accounts.map(toDTO) };
}

export async function getBankAccountMasterById(id: string, companyId: string) {
  const account = await prisma.bankAccountMaster.findFirst({ where: { id, companyId } });
  if (!account) throw new Error("Bank account not found");
  return toDTO(account);
}

export async function createBankAccountMaster(companyId: string, input: BankAccountMasterFormInput) {
  const ownerType = parseOwnerType(input.ownerType);
  if (!input.bankName?.trim()) throw new Error("Bank name is required");
  if (!input.accountNumber?.trim()) throw new Error("Account number is required");
  if (!input.ifscCode?.trim()) throw new Error("IFSC code is required");

  const account = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.bankAccountMaster.updateMany({
        where: { companyId, ownerType, ownerId: input.ownerId || null },
        data: { isPrimary: false },
      });
    }

    return tx.bankAccountMaster.create({
      data: {
        companyId,
        ownerType,
        ownerId: input.ownerId || null,
        ownerLabel: input.ownerLabel || null,
        bankName: input.bankName.trim(),
        branch: input.branch || null,
        accountHolder: input.accountHolder || null,
        accountNumber: input.accountNumber.trim(),
        ifscCode: input.ifscCode.trim(),
        upiId: input.upiId || null,
        isPrimary: input.isPrimary ?? false,
        status: parseStatus(input.status) ?? "ACTIVE",
      },
    });
  });

  return toDTO(account);
}

export async function updateBankAccountMaster(id: string, companyId: string, input: BankAccountMasterFormInput) {
  const existing = await prisma.bankAccountMaster.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Bank account not found");

  const ownerType = input.ownerType ? parseOwnerType(input.ownerType) : existing.ownerType;
  if (!input.bankName?.trim()) throw new Error("Bank name is required");
  if (!input.accountNumber?.trim()) throw new Error("Account number is required");
  if (!input.ifscCode?.trim()) throw new Error("IFSC code is required");

  const account = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.bankAccountMaster.updateMany({
        where: { companyId, ownerType, ownerId: existing.ownerId, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    return tx.bankAccountMaster.update({
      where: { id },
      data: {
        ownerType,
        ownerId: input.ownerId !== undefined ? input.ownerId || null : existing.ownerId,
        ownerLabel: input.ownerLabel !== undefined ? input.ownerLabel || null : existing.ownerLabel,
        bankName: input.bankName.trim(),
        branch: input.branch || null,
        accountHolder: input.accountHolder || null,
        accountNumber: input.accountNumber.trim(),
        ifscCode: input.ifscCode.trim(),
        upiId: input.upiId || null,
        isPrimary: input.isPrimary ?? existing.isPrimary,
        status: parseStatus(input.status) ?? existing.status,
      },
    });
  });

  return toDTO(account);
}

export async function deleteBankAccountMaster(id: string, companyId: string) {
  const existing = await prisma.bankAccountMaster.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Bank account not found");
  await prisma.bankAccountMaster.delete({ where: { id } });
  return { deleted: true };
}
