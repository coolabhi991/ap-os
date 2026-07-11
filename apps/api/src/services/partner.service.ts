import prisma from "../config/prisma.js";
import { Prisma, PartnerType } from "@prisma/client";

/**
 * Partner Master — Owners and Partners are both rows here, global to the Company. Investments
 * and Settlements (see partner-investment.service.ts / partner-settlement.service.ts) are never
 * Site-scoped at this layer; a Partner's money is only later attributed to a Site once it's
 * spent, through the existing Transaction Allocation engine.
 */

export const PARTNER_TYPES = ["OWNER", "PARTNER"];
export const PARTNER_TYPE_LABELS: Record<string, string> = { OWNER: "Owner", PARTNER: "Partner" };

export interface PartnerFormInput {
  name: string;
  partnerType?: string;
  phone?: string;
  email?: string;
  address?: string;
  panNumber?: string;
  sharePercent?: number;
  isActive?: boolean;
}

export interface PartnerListQuery {
  search?: string;
  partnerType?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

type PartnerRow = {
  id: string;
  companyId: string;
  name: string;
  partnerType: PartnerType;
  phone: string | null;
  email: string | null;
  address: string | null;
  panNumber: string | null;
  sharePercent: Prisma.Decimal;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toDTO(p: PartnerRow) {
  return {
    id: p.id,
    companyId: p.companyId,
    name: p.name,
    partnerType: p.partnerType,
    phone: p.phone ?? "",
    email: p.email ?? "",
    address: p.address ?? "",
    panNumber: p.panNumber ?? "",
    sharePercent: p.sharePercent.toString(),
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function parsePartnerType(t: string | undefined): PartnerType {
  return PARTNER_TYPES.includes(t ?? "") ? (t as PartnerType) : "PARTNER";
}

function parseSharePercent(v: number | undefined): number {
  const value = v ?? 0;
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Share percent must be a number between 0 and 100");
  }
  return value;
}

const SORTABLE_FIELDS = ["name", "createdAt", "sharePercent"];

export async function listPartners(companyId: string, query: PartnerListQuery) {
  const { search = "", partnerType, isActive, page = 1, limit = 50, sortBy = "name", sortOrder = "asc" } = query;

  const where: Prisma.PartnerWhereInput = {
    companyId,
    ...(partnerType && PARTNER_TYPES.includes(partnerType) && { partnerType: partnerType as PartnerType }),
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const orderField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : "name";
  const take = Math.min(100, limit);

  const [total, partners] = await Promise.all([
    prisma.partner.count({ where }),
    prisma.partner.findMany({ where, orderBy: { [orderField]: sortOrder }, skip: (page - 1) * take, take }),
  ]);

  return { total, page, limit: take, data: partners.map(toDTO) };
}

export async function getPartnerById(id: string, companyId: string) {
  const partner = await prisma.partner.findFirst({ where: { id, companyId } });
  if (!partner) throw new Error("Partner not found");
  return toDTO(partner);
}

export async function createPartner(companyId: string, input: PartnerFormInput) {
  if (!input.name?.trim()) throw new Error("Partner name is required");
  const sharePercent = parseSharePercent(input.sharePercent);

  const partner = await prisma.partner.create({
    data: {
      companyId,
      name: input.name.trim(),
      partnerType: parsePartnerType(input.partnerType),
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      panNumber: input.panNumber || null,
      sharePercent,
      isActive: input.isActive ?? true,
    },
  });
  return toDTO(partner);
}

export async function updatePartner(id: string, companyId: string, input: Partial<PartnerFormInput>) {
  await getPartnerById(id, companyId);
  if (input.name !== undefined && !input.name.trim()) throw new Error("Partner name is required");

  const partner = await prisma.partner.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.partnerType !== undefined && { partnerType: parsePartnerType(input.partnerType) }),
      ...(input.phone !== undefined && { phone: input.phone || null }),
      ...(input.email !== undefined && { email: input.email || null }),
      ...(input.address !== undefined && { address: input.address || null }),
      ...(input.panNumber !== undefined && { panNumber: input.panNumber || null }),
      ...(input.sharePercent !== undefined && { sharePercent: parseSharePercent(input.sharePercent) }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
  return toDTO(partner);
}

export async function deletePartner(id: string, companyId: string) {
  await getPartnerById(id, companyId);
  // Investments/Settlements reference Partner with the default RESTRICT delete behavior, so a
  // Partner with any capital history will fail to delete at the DB level rather than orphaning it.
  await prisma.partner.delete({ where: { id } });
}
