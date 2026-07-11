import prisma from "../config/prisma.js";
import { SubWorkStatus, Prisma } from "@prisma/client";

/**
 * Planned budget by cost head — mirrors the same 7 heads used for Actual Cost in
 * project-control-center.service.ts, so Budget and Actual can always be compared
 * head-for-head. The total is NEVER stored; it's always the sum of these 7, computed
 * fresh every time (same rule as Actual Cost, which also is never stored).
 */
export interface BudgetHeads {
  material: string;
  labour: string;
  machinery: string;
  fuel: string;
  vendorBills: string;
  siteExpenses: string;
  other: string;
  total: string;
}

export interface SubWorkFormInput {
  siteId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  remarks?: string;
  physicalProgress?: number;
  budgetMaterial?: number;
  budgetLabour?: number;
  budgetMachinery?: number;
  budgetFuel?: number;
  budgetSiteExpenses?: number;
  budgetVendorBills?: number;
  budgetOther?: number;
}

export interface SubWorkUpdateInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  remarks?: string;
  physicalProgress?: number;
  budgetMaterial?: number;
  budgetLabour?: number;
  budgetMachinery?: number;
  budgetFuel?: number;
  budgetSiteExpenses?: number;
  budgetVendorBills?: number;
  budgetOther?: number;
}

export interface ReorderEntry {
  id: string;
  sortOrder: number;
}

export const SUBWORK_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"];

export const SUBWORK_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

function parseStatus(s: string | undefined): SubWorkStatus {
  return SUBWORK_STATUSES.includes(s ?? "") ? (s as SubWorkStatus) : "PLANNED";
}

/** Physical Progress is always a manually-entered engineer input — validated here, never derived from cost. */
function parsePhysicalProgress(p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 100) {
    throw new Error("Physical progress must be a number between 0 and 100");
  }
  return Math.round(p);
}

/** Every budget-head field must be a non-negative number — never trust a negative planned budget. */
function parseBudgetValue(v: number, label: string): number {
  if (!Number.isFinite(v) || v < 0) {
    throw new Error(`${label} budget must be a number greater than or equal to zero`);
  }
  return v;
}

type SubWorkRow = {
  id: string;
  companyId: string;
  projectId: string;
  siteId: string | null;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  status: SubWorkStatus;
  remarks: string | null;
  sortOrder: number;
  physicalProgress: number;
  progressUpdatedAt: Date | null;
  budgetMaterial: Prisma.Decimal;
  budgetLabour: Prisma.Decimal;
  budgetMachinery: Prisma.Decimal;
  budgetFuel: Prisma.Decimal;
  budgetSiteExpenses: Prisma.Decimal;
  budgetVendorBills: Prisma.Decimal;
  budgetOther: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
};

/** Sums the 7 stored budget-head columns into the same shape as Actual Cost's CostHeads, so the two can be compared head-for-head. Never persisted. */
export function sumBudgetHeads(sw: {
  budgetMaterial: Prisma.Decimal | string;
  budgetLabour: Prisma.Decimal | string;
  budgetMachinery: Prisma.Decimal | string;
  budgetFuel: Prisma.Decimal | string;
  budgetSiteExpenses: Prisma.Decimal | string;
  budgetVendorBills: Prisma.Decimal | string;
  budgetOther: Prisma.Decimal | string;
}): BudgetHeads {
  const material = Number(sw.budgetMaterial);
  const labour = Number(sw.budgetLabour);
  const machinery = Number(sw.budgetMachinery);
  const fuel = Number(sw.budgetFuel);
  const siteExpenses = Number(sw.budgetSiteExpenses);
  const vendorBills = Number(sw.budgetVendorBills);
  const other = Number(sw.budgetOther);
  const total = material + labour + machinery + fuel + vendorBills + siteExpenses + other;

  return {
    material: material.toFixed(2),
    labour: labour.toFixed(2),
    machinery: machinery.toFixed(2),
    fuel: fuel.toFixed(2),
    vendorBills: vendorBills.toFixed(2),
    siteExpenses: siteExpenses.toFixed(2),
    other: other.toFixed(2),
    total: total.toFixed(2),
  };
}

function toDTO(sw: SubWorkRow) {
  const budgetHeads = sumBudgetHeads(sw);
  return {
    id: sw.id,
    companyId: sw.companyId,
    projectId: sw.projectId,
    siteId: sw.siteId ?? "",
    name: sw.name,
    startDate: sw.startDate?.toISOString().slice(0, 10) ?? "",
    endDate: sw.endDate?.toISOString().slice(0, 10) ?? "",
    status: sw.status,
    remarks: sw.remarks ?? "",
    sortOrder: sw.sortOrder,
    physicalProgress: sw.physicalProgress,
    progressUpdatedAt: sw.progressUpdatedAt?.toISOString() ?? "",
    budgetMaterial: sw.budgetMaterial.toString(),
    budgetLabour: sw.budgetLabour.toString(),
    budgetMachinery: sw.budgetMachinery.toString(),
    budgetFuel: sw.budgetFuel.toString(),
    budgetSiteExpenses: sw.budgetSiteExpenses.toString(),
    budgetVendorBills: sw.budgetVendorBills.toString(),
    budgetOther: sw.budgetOther.toString(),
    totalBudget: budgetHeads.total,
    createdAt: sw.createdAt.toISOString(),
    updatedAt: sw.updatedAt.toISOString(),
  };
}

async function verifyProjectOwnership(projectId: string, companyId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new Error("Project not found");
  return project;
}

async function verifySiteOwnership(siteId: string, companyId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, companyId } });
  if (!site) throw new Error("Site not found");
  return site;
}

export interface SubWorkListQuery {
  projectId?: string;
  siteId?: string;
}

export async function listSubWorks(companyId: string, query: SubWorkListQuery) {
  if (!query.siteId && !query.projectId) throw new Error("Project not found");
  if (query.siteId) await verifySiteOwnership(query.siteId, companyId);
  else if (query.projectId) await verifyProjectOwnership(query.projectId, companyId);

  const subWorks = await prisma.subWork.findMany({
    where: { companyId, ...(query.siteId ? { siteId: query.siteId } : { projectId: query.projectId }) },
    orderBy: { sortOrder: "asc" },
  });
  return subWorks.map(toDTO);
}

export async function getSubWorkById(id: string, companyId: string) {
  const sw = await prisma.subWork.findFirst({ where: { id, companyId } });
  if (!sw) throw new Error("Sub Work not found");
  return toDTO(sw);
}

export async function createSubWork(companyId: string, input: SubWorkFormInput) {
  if (!input.siteId?.trim()) throw new Error("Site is required");
  if (!input.name?.trim()) throw new Error("Name is required");
  // projectId is always derived from the Site, never trusted from the client, so a Sub
  // Work can never be tagged to a Site that belongs to a different Project.
  const site = await verifySiteOwnership(input.siteId, companyId);

  const maxSort = await prisma.subWork.aggregate({
    where: { companyId, siteId: input.siteId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  const physicalProgress = input.physicalProgress !== undefined ? parsePhysicalProgress(input.physicalProgress) : 0;

  const budgetMaterial = parseBudgetValue(input.budgetMaterial ?? 0, "Material");
  const budgetLabour = parseBudgetValue(input.budgetLabour ?? 0, "Labour");
  const budgetMachinery = parseBudgetValue(input.budgetMachinery ?? 0, "Machinery");
  const budgetFuel = parseBudgetValue(input.budgetFuel ?? 0, "Fuel");
  const budgetSiteExpenses = parseBudgetValue(input.budgetSiteExpenses ?? 0, "Site Expenses");
  const budgetVendorBills = parseBudgetValue(input.budgetVendorBills ?? 0, "Vendor Bills");
  const budgetOther = parseBudgetValue(input.budgetOther ?? 0, "Other");

  const sw = await prisma.subWork.create({
    data: {
      companyId,
      projectId: site.projectId,
      siteId: input.siteId,
      name: input.name.trim(),
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      status: parseStatus(input.status),
      remarks: input.remarks || null,
      sortOrder,
      physicalProgress,
      progressUpdatedAt: physicalProgress > 0 ? new Date() : null,
      budgetMaterial,
      budgetLabour,
      budgetMachinery,
      budgetFuel,
      budgetSiteExpenses,
      budgetVendorBills,
      budgetOther,
    },
  });
  return toDTO(sw);
}

export async function updateSubWork(id: string, companyId: string, input: SubWorkUpdateInput) {
  const existing = await getSubWorkById(id, companyId);
  if (input.name !== undefined && !input.name.trim()) throw new Error("Name is required");

  const physicalProgress = input.physicalProgress !== undefined ? parsePhysicalProgress(input.physicalProgress) : undefined;
  const progressChanged = physicalProgress !== undefined && physicalProgress !== existing.physicalProgress;

  const sw = await prisma.subWork.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.startDate !== undefined && { startDate: input.startDate ? new Date(input.startDate) : null }),
      ...(input.endDate !== undefined && { endDate: input.endDate ? new Date(input.endDate) : null }),
      ...(input.status !== undefined && { status: parseStatus(input.status) }),
      ...(input.remarks !== undefined && { remarks: input.remarks || null }),
      ...(physicalProgress !== undefined && { physicalProgress }),
      ...(progressChanged && { progressUpdatedAt: new Date() }),
      ...(input.budgetMaterial !== undefined && { budgetMaterial: parseBudgetValue(input.budgetMaterial, "Material") }),
      ...(input.budgetLabour !== undefined && { budgetLabour: parseBudgetValue(input.budgetLabour, "Labour") }),
      ...(input.budgetMachinery !== undefined && { budgetMachinery: parseBudgetValue(input.budgetMachinery, "Machinery") }),
      ...(input.budgetFuel !== undefined && { budgetFuel: parseBudgetValue(input.budgetFuel, "Fuel") }),
      ...(input.budgetSiteExpenses !== undefined && { budgetSiteExpenses: parseBudgetValue(input.budgetSiteExpenses, "Site Expenses") }),
      ...(input.budgetVendorBills !== undefined && { budgetVendorBills: parseBudgetValue(input.budgetVendorBills, "Vendor Bills") }),
      ...(input.budgetOther !== undefined && { budgetOther: parseBudgetValue(input.budgetOther, "Other") }),
    },
  });
  return toDTO(sw);
}

export async function deleteSubWork(id: string, companyId: string) {
  await getSubWorkById(id, companyId);
  // Expense/VendorBill/MaterialIssue/LabourAttendance.subWorkId are ON DELETE SET NULL,
  // so deleting a Sub Work un-tags those records rather than deleting any financial data.
  return prisma.subWork.delete({ where: { id } });
}

export async function reorderSubWorks(companyId: string, siteId: string, order: ReorderEntry[]) {
  await verifySiteOwnership(siteId, companyId);

  const ids = order.map((o) => o.id);
  const count = await prisma.subWork.count({ where: { id: { in: ids }, companyId, siteId } });
  if (count !== ids.length) throw new Error("One or more sub works do not belong to this site");

  await prisma.$transaction(
    order.map((o) => prisma.subWork.update({ where: { id: o.id }, data: { sortOrder: o.sortOrder } }))
  );
  return listSubWorks(companyId, { siteId });
}
