import prisma from "../config/prisma.js";
import { BankAccountType } from "@prisma/client";

export const ACCOUNT_TYPES = ["BANK", "CASH"];

export interface CompanyBankAccountFormInput {
  nickname?: string;
  beneficiaryName?: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch?: string;
  upiId?: string;
  accountType?: string;
  openingBalance?: number;
  isPrimary?: boolean;
  isActive?: boolean;
}

function parseAccountType(t: string | undefined): BankAccountType {
  return t && ACCOUNT_TYPES.includes(t.toUpperCase()) ? (t.toUpperCase() as BankAccountType) : "BANK";
}

function toDTO(a: {
  id: string;
  companyId: string;
  nickname: string | null;
  beneficiaryName: string | null;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string | null;
  upiId: string | null;
  accountType: BankAccountType;
  openingBalance: { toString(): string };
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: a.id,
    companyId: a.companyId,
    nickname: a.nickname ?? "",
    beneficiaryName: a.beneficiaryName ?? "",
    bankName: a.bankName,
    accountNumber: a.accountNumber,
    ifscCode: a.ifscCode,
    branch: a.branch ?? "",
    upiId: a.upiId ?? "",
    accountType: a.accountType,
    openingBalance: a.openingBalance.toString(),
    isPrimary: a.isPrimary,
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function listCompanyBankAccounts(companyId: string) {
  const accounts = await prisma.companyBankAccount.findMany({
    where: { companyId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  return accounts.map(toDTO);
}

export async function getCompanyBankAccountById(id: string, companyId: string) {
  const account = await prisma.companyBankAccount.findFirst({ where: { id, companyId } });
  if (!account) throw new Error("Company bank account not found");
  return toDTO(account);
}

/** bankName/accountNumber/ifscCode stay NOT NULL columns — a CASH account fills them with fixed placeholder values instead of relaxing the schema. */
function resolveBankFields(input: CompanyBankAccountFormInput, accountType: BankAccountType) {
  if (accountType === "CASH") {
    return { bankName: "Cash", accountNumber: "CASH", ifscCode: "CASH" };
  }
  if (!input.bankName?.trim()) throw new Error("Bank name is required");
  if (!input.accountNumber?.trim()) throw new Error("Account number is required");
  if (!input.ifscCode?.trim()) throw new Error("IFSC code is required");
  return { bankName: input.bankName.trim(), accountNumber: input.accountNumber.trim(), ifscCode: input.ifscCode.trim() };
}

function resolveOpeningBalance(input: CompanyBankAccountFormInput) {
  const value = input.openingBalance ?? 0;
  if (!Number.isFinite(value)) throw new Error("Opening balance must be a number");
  return value;
}

export async function createCompanyBankAccount(companyId: string, input: CompanyBankAccountFormInput) {
  const accountType = parseAccountType(input.accountType);
  const bankFields = resolveBankFields(input, accountType);
  const openingBalance = resolveOpeningBalance(input);

  const account = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.companyBankAccount.updateMany({ where: { companyId }, data: { isPrimary: false } });
    }

    return tx.companyBankAccount.create({
      data: {
        companyId,
        nickname: input.nickname || null,
        beneficiaryName: input.beneficiaryName || null,
        ...bankFields,
        branch: input.branch || null,
        upiId: input.upiId || null,
        accountType,
        openingBalance,
        isPrimary: input.isPrimary ?? false,
        isActive: input.isActive ?? true,
      },
    });
  });

  return toDTO(account);
}

export async function updateCompanyBankAccount(id: string, companyId: string, input: CompanyBankAccountFormInput) {
  const existing = await prisma.companyBankAccount.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Company bank account not found");
  const accountType = parseAccountType(input.accountType ?? existing.accountType);
  const bankFields = resolveBankFields(input, accountType);
  const openingBalance = resolveOpeningBalance(input);

  const account = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.companyBankAccount.updateMany({
        where: { companyId, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    return tx.companyBankAccount.update({
      where: { id },
      data: {
        nickname: input.nickname || null,
        beneficiaryName: input.beneficiaryName || null,
        ...bankFields,
        branch: input.branch || null,
        upiId: input.upiId || null,
        accountType,
        openingBalance,
        isPrimary: input.isPrimary ?? existing.isPrimary,
        isActive: input.isActive ?? existing.isActive,
      },
    });
  });

  return toDTO(account);
}

/**
 * Deletes a company bank account, unless it has payment history — in that case it is
 * soft-deleted (deactivated) instead, so historical VendorPayment records keep a
 * valid, readable reference.
 */
export async function deleteCompanyBankAccount(id: string, companyId: string) {
  const existing = await prisma.companyBankAccount.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Company bank account not found");

  const [paymentCount, transactionCount] = await Promise.all([
    prisma.vendorPayment.count({ where: { companyBankAccountId: id } }),
    prisma.bankTransaction.count({ where: { companyBankAccountId: id } }),
  ]);

  if (paymentCount > 0 || transactionCount > 0) {
    const deactivated = await prisma.companyBankAccount.update({ where: { id }, data: { isActive: false, isPrimary: false } });
    return { deleted: false, data: toDTO(deactivated) };
  }

  await prisma.companyBankAccount.delete({ where: { id } });
  return { deleted: true, data: null };
}
