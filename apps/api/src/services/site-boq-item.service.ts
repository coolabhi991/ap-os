import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

/**
 * BOQ (Bill of Quantities) — an optional, Sub Work-wise contract item catalog. See SiteBoqItem in
 * schema.prisma for the full rationale: it exists purely to speed up Form 58 data entry
 * ("Import From BOQ" copies description/unit/rate into a new Form 58 row) and has no FK to
 * RunningBillItem/SiteBillItem, so it can always be freely edited/deleted regardless of billing
 * history — unlike SiteBillItem, once a bill has been raised there is nothing here to protect.
 */

export interface SiteBoqItemFormInput {
  siteId: string;
  subWorkId: string;
  description: string;
  unit: string;
  contractQuantity: number;
  rate: number;
  remarks?: string;
}

const include = {
  subWork: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
};

type SiteBoqItemRow = Prisma.SiteBoqItemGetPayload<{ include: typeof include }>;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toDTO(item: SiteBoqItemRow) {
  return {
    id: item.id,
    companyId: item.companyId,
    siteId: item.siteId,
    subWorkId: item.subWorkId,
    subWork: item.subWork,
    description: item.description,
    unit: item.unit,
    contractQuantity: item.contractQuantity.toString(),
    rate: item.rate.toString(),
    amount: round2(Number(item.contractQuantity) * Number(item.rate)).toFixed(2),
    remarks: item.remarks ?? "",
    sortOrder: item.sortOrder,
    createdById: item.createdById,
    createdBy: item.createdBy,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

async function verifySiteOwnership(siteId: string, companyId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, companyId } });
  if (!site) throw new Error("Site not found");
  return site;
}

/** Every BOQ item for a Site, in display order (grouped by Sub Work client-side). */
export async function listSiteBoqItems(siteId: string, companyId: string) {
  await verifySiteOwnership(siteId, companyId);
  const items = await prisma.siteBoqItem.findMany({
    where: { siteId, companyId },
    include,
    orderBy: [{ subWorkId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return items.map(toDTO);
}

export async function getSiteBoqItemById(id: string, companyId: string) {
  const item = await prisma.siteBoqItem.findFirst({ where: { id, companyId }, include });
  if (!item) throw new Error("BOQ Item not found");
  return toDTO(item);
}

export async function createSiteBoqItem(companyId: string, createdById: string, input: SiteBoqItemFormInput) {
  if (!input.siteId?.trim()) throw new Error("Site is required");
  if (!input.subWorkId?.trim()) throw new Error("Sub Work is required");
  if (!input.description?.trim()) throw new Error("Item Description is required");
  if (!input.unit?.trim()) throw new Error("Unit is required");
  const contractQuantity = Number(input.contractQuantity);
  if (!Number.isFinite(contractQuantity) || contractQuantity < 0) throw new Error("Contract Quantity must be a number greater than or equal to zero");
  const rate = Number(input.rate);
  if (!Number.isFinite(rate) || rate < 0) throw new Error("Rate must be a number greater than or equal to zero");

  await verifySiteOwnership(input.siteId, companyId);
  const subWork = await prisma.subWork.findFirst({ where: { id: input.subWorkId, companyId, siteId: input.siteId } });
  if (!subWork) throw new Error("Sub Work not found");

  const maxSort = await prisma.siteBoqItem.aggregate({ where: { siteId: input.siteId, subWorkId: input.subWorkId, companyId }, _max: { sortOrder: true } });

  const item = await prisma.siteBoqItem.create({
    data: {
      companyId,
      siteId: input.siteId,
      subWorkId: input.subWorkId,
      description: input.description.trim(),
      unit: input.unit.trim(),
      contractQuantity,
      rate,
      remarks: input.remarks?.trim() || null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      createdById,
    },
    include,
  });
  return toDTO(item);
}

export async function updateSiteBoqItem(id: string, companyId: string, input: Partial<SiteBoqItemFormInput>) {
  const existing = await prisma.siteBoqItem.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("BOQ Item not found");

  if (input.subWorkId) {
    const subWork = await prisma.subWork.findFirst({ where: { id: input.subWorkId, companyId, siteId: existing.siteId } });
    if (!subWork) throw new Error("Sub Work not found");
  }
  if (input.contractQuantity !== undefined && (!Number.isFinite(Number(input.contractQuantity)) || Number(input.contractQuantity) < 0)) {
    throw new Error("Contract Quantity must be a number greater than or equal to zero");
  }
  if (input.rate !== undefined && (!Number.isFinite(Number(input.rate)) || Number(input.rate) < 0)) {
    throw new Error("Rate must be a number greater than or equal to zero");
  }

  const item = await prisma.siteBoqItem.update({
    where: { id },
    data: {
      ...(input.subWorkId !== undefined && { subWorkId: input.subWorkId }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.unit !== undefined && { unit: input.unit.trim() }),
      ...(input.contractQuantity !== undefined && { contractQuantity: Number(input.contractQuantity) }),
      ...(input.rate !== undefined && { rate: Number(input.rate) }),
      ...(input.remarks !== undefined && { remarks: input.remarks?.trim() || null }),
    },
    include,
  });
  return toDTO(item);
}

export async function deleteSiteBoqItem(id: string, companyId: string) {
  const existing = await prisma.siteBoqItem.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("BOQ Item not found");
  await prisma.siteBoqItem.delete({ where: { id } });
}
