import prisma from "../config/prisma.js";

export interface BankStatementMappingInput {
  signature: string;
  bankName?: string;
  dateColumn: number;
  descriptionColumn?: number | null;
  debitColumn?: number | null;
  creditColumn?: number | null;
  balanceColumn?: number | null;
  referenceColumn?: number | null;
}

function toDTO(m: {
  id: string;
  companyId: string;
  signature: string;
  bankName: string | null;
  dateColumn: number;
  descriptionColumn: number | null;
  debitColumn: number | null;
  creditColumn: number | null;
  balanceColumn: number | null;
  referenceColumn: number | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: m.id,
    companyId: m.companyId,
    signature: m.signature,
    bankName: m.bankName ?? "",
    dateColumn: m.dateColumn,
    descriptionColumn: m.descriptionColumn,
    debitColumn: m.debitColumn,
    creditColumn: m.creditColumn,
    balanceColumn: m.balanceColumn,
    referenceColumn: m.referenceColumn,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

export async function getBankStatementMapping(companyId: string, signature: string) {
  const mapping = await prisma.bankStatementMapping.findUnique({
    where: { companyId_signature: { companyId, signature } },
  });
  return mapping ? toDTO(mapping) : null;
}

/** Upserted by (companyId, signature) — re-saving a mapping for the same header layout overwrites it. */
export async function saveBankStatementMapping(companyId: string, input: BankStatementMappingInput) {
  if (!input.signature?.trim()) throw new Error("Signature is required");
  if (input.dateColumn === undefined || input.dateColumn === null) throw new Error("Date column is required");

  const data = {
    bankName: input.bankName || null,
    dateColumn: input.dateColumn,
    descriptionColumn: input.descriptionColumn ?? null,
    debitColumn: input.debitColumn ?? null,
    creditColumn: input.creditColumn ?? null,
    balanceColumn: input.balanceColumn ?? null,
    referenceColumn: input.referenceColumn ?? null,
  };

  const mapping = await prisma.bankStatementMapping.upsert({
    where: { companyId_signature: { companyId, signature: input.signature } },
    create: { companyId, signature: input.signature, ...data },
    update: data,
  });

  return toDTO(mapping);
}
