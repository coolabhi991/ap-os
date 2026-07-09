import prisma from "../config/prisma.js";
import { SubWorkStatus } from "@prisma/client";

export interface SubWorkFormInput {
  projectId: string;
  name: string;
  budgetAmount?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  remarks?: string;
  physicalProgress?: number;
}

export interface SubWorkUpdateInput {
  name?: string;
  budgetAmount?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  remarks?: string;
  physicalProgress?: number;
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

type SubWorkRow = {
  id: string;
  companyId: string;
  projectId: string;
  name: string;
  budgetAmount: { toString(): string };
  startDate: Date | null;
  endDate: Date | null;
  status: SubWorkStatus;
  remarks: string | null;
  sortOrder: number;
  physicalProgress: number;
  progressUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toDTO(sw: SubWorkRow) {
  return {
    id: sw.id,
    companyId: sw.companyId,
    projectId: sw.projectId,
    name: sw.name,
    budgetAmount: sw.budgetAmount.toString(),
    startDate: sw.startDate?.toISOString().slice(0, 10) ?? "",
    endDate: sw.endDate?.toISOString().slice(0, 10) ?? "",
    status: sw.status,
    remarks: sw.remarks ?? "",
    sortOrder: sw.sortOrder,
    physicalProgress: sw.physicalProgress,
    progressUpdatedAt: sw.progressUpdatedAt?.toISOString() ?? "",
    createdAt: sw.createdAt.toISOString(),
    updatedAt: sw.updatedAt.toISOString(),
  };
}

async function verifyProjectOwnership(projectId: string, companyId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new Error("Project not found");
  return project;
}

export async function listSubWorks(companyId: string, projectId: string) {
  await verifyProjectOwnership(projectId, companyId);
  const subWorks = await prisma.subWork.findMany({
    where: { companyId, projectId },
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
  if (!input.projectId?.trim()) throw new Error("Project is required");
  if (!input.name?.trim()) throw new Error("Name is required");
  await verifyProjectOwnership(input.projectId, companyId);

  const maxSort = await prisma.subWork.aggregate({
    where: { companyId, projectId: input.projectId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  const physicalProgress = input.physicalProgress !== undefined ? parsePhysicalProgress(input.physicalProgress) : 0;

  const sw = await prisma.subWork.create({
    data: {
      companyId,
      projectId: input.projectId,
      name: input.name.trim(),
      budgetAmount: input.budgetAmount ?? 0,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      status: parseStatus(input.status),
      remarks: input.remarks || null,
      sortOrder,
      physicalProgress,
      progressUpdatedAt: physicalProgress > 0 ? new Date() : null,
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
      ...(input.budgetAmount !== undefined && { budgetAmount: input.budgetAmount }),
      ...(input.startDate !== undefined && { startDate: input.startDate ? new Date(input.startDate) : null }),
      ...(input.endDate !== undefined && { endDate: input.endDate ? new Date(input.endDate) : null }),
      ...(input.status !== undefined && { status: parseStatus(input.status) }),
      ...(input.remarks !== undefined && { remarks: input.remarks || null }),
      ...(physicalProgress !== undefined && { physicalProgress }),
      ...(progressChanged && { progressUpdatedAt: new Date() }),
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

export async function reorderSubWorks(companyId: string, projectId: string, order: ReorderEntry[]) {
  await verifyProjectOwnership(projectId, companyId);

  const ids = order.map((o) => o.id);
  const count = await prisma.subWork.count({ where: { id: { in: ids }, companyId, projectId } });
  if (count !== ids.length) throw new Error("One or more sub works do not belong to this project");

  await prisma.$transaction(
    order.map((o) => prisma.subWork.update({ where: { id: o.id }, data: { sortOrder: o.sortOrder } }))
  );
  return listSubWorks(companyId, projectId);
}
