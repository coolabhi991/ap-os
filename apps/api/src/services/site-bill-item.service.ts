import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

/**
 * Bill Item Master — the persistent per-Site roster of billable items that Form 58 RA Bills
 * carry forward automatically. See SiteBillItem in schema.prisma for the full rationale. Rate
 * lives here as the canonical/current value; each RunningBillItem still snapshots its own rate at
 * billing time (see running-bill.service.ts), so editing a rate here never rewrites a historical
 * bill's figures — only future bills pick up the new rate.
 */

export interface SiteBillItemFormInput {
  siteId: string;
  subWorkId?: string;
  itemNo: string;
  description: string;
  unit: string;
  rate: number;
}

const include = {
  subWork: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { billItems: true } },
};

type SiteBillItemRow = Prisma.SiteBillItemGetPayload<{ include: typeof include }>;

function toDTO(item: SiteBillItemRow) {
  return {
    id: item.id,
    companyId: item.companyId,
    siteId: item.siteId,
    subWorkId: item.subWorkId ?? "",
    subWork: item.subWork,
    itemNo: item.itemNo,
    description: item.description,
    unit: item.unit,
    rate: item.rate.toString(),
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    billedCount: item._count.billItems,
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

/** Every active item for a Site, in display order — the full roster a new RA Bill auto-seeds from. */
export async function listSiteBillItems(siteId: string, companyId: string, includeInactive = false) {
  await verifySiteOwnership(siteId, companyId);
  const items = await prisma.siteBillItem.findMany({
    where: { siteId, companyId, ...(includeInactive ? {} : { isActive: true }) },
    include,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return items.map(toDTO);
}

export async function getSiteBillItemById(id: string, companyId: string) {
  const item = await prisma.siteBillItem.findFirst({ where: { id, companyId }, include });
  if (!item) throw new Error("Bill Item not found");
  return toDTO(item);
}

export async function createSiteBillItem(companyId: string, createdById: string, input: SiteBillItemFormInput) {
  if (!input.siteId?.trim()) throw new Error("Site is required");
  if (!input.itemNo?.trim()) throw new Error("Item No. is required");
  if (!input.description?.trim()) throw new Error("Description is required");
  if (!input.unit?.trim()) throw new Error("Unit is required");
  const rate = Number(input.rate);
  if (!Number.isFinite(rate) || rate < 0) throw new Error("Rate must be a number greater than or equal to zero");

  await verifySiteOwnership(input.siteId, companyId);
  if (input.subWorkId) {
    const subWork = await prisma.subWork.findFirst({ where: { id: input.subWorkId, companyId, siteId: input.siteId } });
    if (!subWork) throw new Error("Sub Work not found");
  }

  const maxSort = await prisma.siteBillItem.aggregate({ where: { siteId: input.siteId, companyId }, _max: { sortOrder: true } });

  const item = await prisma.siteBillItem.create({
    data: {
      companyId,
      siteId: input.siteId,
      subWorkId: input.subWorkId || null,
      itemNo: input.itemNo.trim(),
      description: input.description.trim(),
      unit: input.unit.trim(),
      rate,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      createdById,
    },
    include,
  });
  return toDTO(item);
}

export async function updateSiteBillItem(id: string, companyId: string, input: Partial<SiteBillItemFormInput> & { isActive?: boolean }) {
  const existing = await prisma.siteBillItem.findFirst({ where: { id, companyId }, include: { _count: { select: { billItems: true } } } });
  if (!existing) throw new Error("Bill Item not found");

  // Once an item has appeared on any bill, it must keep appearing on every future bill (with
  // Current Quantity 0 if untouched) — it can never be hidden or removed, only its rate/label
  // corrected going forward.
  if (input.isActive === false && existing._count.billItems > 0) {
    throw new Error("This item has already been billed and must keep appearing on every future RA Bill — it cannot be hidden");
  }

  if (input.subWorkId) {
    const subWork = await prisma.subWork.findFirst({ where: { id: input.subWorkId, companyId, siteId: existing.siteId } });
    if (!subWork) throw new Error("Sub Work not found");
  }
  if (input.rate !== undefined && (!Number.isFinite(Number(input.rate)) || Number(input.rate) < 0)) {
    throw new Error("Rate must be a number greater than or equal to zero");
  }

  const item = await prisma.siteBillItem.update({
    where: { id },
    data: {
      ...(input.subWorkId !== undefined && { subWorkId: input.subWorkId || null }),
      ...(input.itemNo !== undefined && { itemNo: input.itemNo.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.unit !== undefined && { unit: input.unit.trim() }),
      ...(input.rate !== undefined && { rate: Number(input.rate) }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include,
  });
  return toDTO(item);
}

/** Only allowed when the item has never been billed — items already used on a bill must never disappear (per the Form 58 rule), so deactivate instead of deleting them once billed. */
export async function deleteSiteBillItem(id: string, companyId: string) {
  const existing = await prisma.siteBillItem.findFirst({ where: { id, companyId }, include: { _count: { select: { billItems: true } } } });
  if (!existing) throw new Error("Bill Item not found");
  if (existing._count.billItems > 0) {
    throw new Error("This item has already been billed and cannot be removed — deactivate it instead so future bills stop including it");
  }
  await prisma.siteBillItem.delete({ where: { id } });
}
