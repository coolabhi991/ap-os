import prisma from "../config/prisma.js";

export interface VendorBankAccountFormInput {
  nickname?: string;
  beneficiaryName?: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch?: string;
  upiId?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

function toDTO(a: {
  id: string;
  companyId: string;
  vendorId: string;
  nickname: string | null;
  beneficiaryName: string | null;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string | null;
  upiId: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: a.id,
    companyId: a.companyId,
    vendorId: a.vendorId,
    nickname: a.nickname ?? "",
    beneficiaryName: a.beneficiaryName ?? "",
    bankName: a.bankName,
    accountNumber: a.accountNumber,
    ifscCode: a.ifscCode,
    branch: a.branch ?? "",
    upiId: a.upiId ?? "",
    isPrimary: a.isPrimary,
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

async function assertVendorOwnership(vendorId: string, companyId: string) {
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, companyId } });
  if (!vendor) throw new Error("Vendor not found");
}

export async function listVendorBankAccounts(companyId: string, vendorId: string) {
  await assertVendorOwnership(vendorId, companyId);
  const accounts = await prisma.vendorBankAccount.findMany({
    where: { companyId, vendorId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  return accounts.map(toDTO);
}

export async function getVendorBankAccountById(id: string, companyId: string) {
  const account = await prisma.vendorBankAccount.findFirst({ where: { id, companyId } });
  if (!account) throw new Error("Vendor bank account not found");
  return toDTO(account);
}

function validate(input: VendorBankAccountFormInput) {
  if (!input.bankName?.trim()) throw new Error("Bank name is required");
  if (!input.accountNumber?.trim()) throw new Error("Account number is required");
  if (!input.ifscCode?.trim()) throw new Error("IFSC code is required");
}

export async function createVendorBankAccount(companyId: string, vendorId: string, input: VendorBankAccountFormInput) {
  await assertVendorOwnership(vendorId, companyId);
  validate(input);

  const account = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.vendorBankAccount.updateMany({ where: { vendorId, companyId }, data: { isPrimary: false } });
    }

    return tx.vendorBankAccount.create({
      data: {
        companyId,
        vendorId,
        nickname: input.nickname || null,
        beneficiaryName: input.beneficiaryName || null,
        bankName: input.bankName.trim(),
        accountNumber: input.accountNumber.trim(),
        ifscCode: input.ifscCode.trim(),
        branch: input.branch || null,
        upiId: input.upiId || null,
        isPrimary: input.isPrimary ?? false,
        isActive: input.isActive ?? true,
      },
    });
  });

  return toDTO(account);
}

export async function updateVendorBankAccount(id: string, companyId: string, input: VendorBankAccountFormInput) {
  const existing = await prisma.vendorBankAccount.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Vendor bank account not found");
  validate(input);

  const account = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.vendorBankAccount.updateMany({
        where: { vendorId: existing.vendorId, companyId, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    return tx.vendorBankAccount.update({
      where: { id },
      data: {
        nickname: input.nickname || null,
        beneficiaryName: input.beneficiaryName || null,
        bankName: input.bankName.trim(),
        accountNumber: input.accountNumber.trim(),
        ifscCode: input.ifscCode.trim(),
        branch: input.branch || null,
        upiId: input.upiId || null,
        isPrimary: input.isPrimary ?? existing.isPrimary,
        isActive: input.isActive ?? existing.isActive,
      },
    });
  });

  return toDTO(account);
}

/**
 * Deletes a vendor bank account, unless it has payment history — in that case it is
 * soft-deleted (deactivated) instead, so historical VendorPayment records keep a
 * valid, readable reference.
 */
export async function deleteVendorBankAccount(id: string, companyId: string) {
  const existing = await prisma.vendorBankAccount.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Vendor bank account not found");

  const paymentCount = await prisma.vendorPayment.count({ where: { vendorBankAccountId: id } });

  if (paymentCount > 0) {
    const deactivated = await prisma.vendorBankAccount.update({ where: { id }, data: { isActive: false, isPrimary: false } });
    return { deleted: false, data: toDTO(deactivated) };
  }

  await prisma.vendorBankAccount.delete({ where: { id } });
  return { deleted: true, data: null };
}
