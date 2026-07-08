import prisma from "../config/prisma.js";
import { Prisma, LabourCategory } from "@prisma/client";

const LABOUR_CATEGORIES: LabourCategory[] = ["SKILLED", "SEMI_SKILLED", "UNSKILLED"];

function parseCategory(c: string | undefined): LabourCategory {
  const upper = (c ?? "").trim().toUpperCase() as LabourCategory;
  return LABOUR_CATEGORIES.includes(upper) ? upper : "UNSKILLED";
}

export interface LabourFormInput {
  name: string;
  projectId?: string;
  contractorId?: string;
  groupId?: string;
  phone?: string;
  designation?: string;
  category?: string;
  status?: string;
  remarks?: string;
  dailyWage?: number;
  overtimeRate?: number;
}

export interface LabourListQuery {
  search?: string;
  projectId?: string;
  contractorId?: string;
  groupId?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const include = {
  project: { select: { id: true, name: true } },
  contractor: { select: { id: true, name: true } },
  group: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
};

type LabourRow = Prisma.LabourGetPayload<{ include: typeof include }>;
type WageRateRow = Prisma.LabourWageRateGetPayload<Record<string, never>>;

function toDTO(l: LabourRow, currentWageRate?: WageRateRow | null) {
  return {
    id: l.id,
    companyId: l.companyId,
    projectId: l.projectId ?? "",
    project: l.project,
    contractorId: l.contractorId ?? "",
    contractor: l.contractor,
    groupId: l.groupId ?? "",
    group: l.group,
    name: l.name,
    phone: l.phone ?? "",
    designation: l.designation ?? "",
    category: l.category,
    status: l.status,
    remarks: l.remarks ?? "",
    createdById: l.createdById,
    createdBy: l.createdBy,
    isDeleted: l.isDeleted,
    currentWageRate: currentWageRate
      ? {
          dailyWage: currentWageRate.dailyWage.toString(),
          overtimeRate: currentWageRate.overtimeRate.toString(),
          effectiveFrom: currentWageRate.effectiveFrom.toISOString().slice(0, 10),
        }
      : null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

/** Batches "latest wage rate as of now" lookups for a set of labour ids to avoid N+1 queries. */
async function getCurrentWageRates(companyId: string, labourIds: string[]) {
  if (labourIds.length === 0) return new Map<string, WageRateRow>();
  const rates = await prisma.labourWageRate.findMany({
    where: { companyId, labourId: { in: labourIds } },
    orderBy: { effectiveFrom: "desc" },
  });
  const latestByLabour = new Map<string, WageRateRow>();
  for (const r of rates) {
    if (!latestByLabour.has(r.labourId)) latestByLabour.set(r.labourId, r);
  }
  return latestByLabour;
}

export async function listLabour(companyId: string, query: LabourListQuery) {
  const {
    search = "",
    projectId,
    contractorId,
    groupId,
    category,
    status,
    page = 1,
    limit = 20,
    sortBy = "name",
    sortOrder = "asc",
  } = query;

  const where: Prisma.LabourWhereInput = {
    companyId,
    isDeleted: false,
    ...(projectId && { projectId }),
    ...(contractorId && { contractorId }),
    ...(groupId && { groupId }),
    ...(category && LABOUR_CATEGORIES.includes(category.toUpperCase() as LabourCategory) && { category: category.toUpperCase() as LabourCategory }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
        { contractor: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const allowed = ["name", "category", "status", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "name";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, labours] = await Promise.all([
    prisma.labour.count({ where }),
    prisma.labour.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  const rateByLabour = await getCurrentWageRates(companyId, labours.map((l) => l.id));

  return { total, page, limit: take, data: labours.map((l) => toDTO(l, rateByLabour.get(l.id))) };
}

export async function getLabourById(id: string, companyId: string) {
  const labour = await prisma.labour.findFirst({ where: { id, companyId, isDeleted: false }, include });
  if (!labour) throw new Error("Labour not found");

  const rateByLabour = await getCurrentWageRates(companyId, [id]);
  return toDTO(labour, rateByLabour.get(id));
}

export async function createLabour(companyId: string, createdById: string, input: LabourFormInput) {
  if (!input.name?.trim()) throw new Error("Name is required");

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

  if (input.contractorId) {
    const vendor = await prisma.vendor.findFirst({ where: { id: input.contractorId, companyId } });
    if (!vendor) throw new Error("Contractor not found");
  }

  if (input.groupId) {
    const group = await prisma.labourGroup.findFirst({ where: { id: input.groupId, companyId } });
    if (!group) throw new Error("Labour group not found");
  }

  const labour = await prisma.$transaction(async (tx) => {
    const created = await tx.labour.create({
      data: {
        companyId,
        projectId: input.projectId || null,
        contractorId: input.contractorId || null,
        groupId: input.groupId || null,
        name: input.name.trim(),
        phone: input.phone || null,
        designation: input.designation || null,
        category: parseCategory(input.category),
        status: input.status || "Active",
        remarks: input.remarks || null,
        createdById,
      },
      include,
    });

    if (input.dailyWage && input.dailyWage > 0) {
      await tx.labourWageRate.create({
        data: {
          companyId,
          labourId: created.id,
          dailyWage: input.dailyWage,
          overtimeRate: input.overtimeRate ?? 0,
        },
      });
    }

    return created;
  });

  const rateByLabour = await getCurrentWageRates(companyId, [labour.id]);
  return toDTO(labour, rateByLabour.get(labour.id));
}

export async function updateLabour(id: string, companyId: string, input: LabourFormInput) {
  const existing = await prisma.labour.findFirst({ where: { id, companyId, isDeleted: false } });
  if (!existing) throw new Error("Labour not found");

  if (!input.name?.trim()) throw new Error("Name is required");

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

  if (input.contractorId) {
    const vendor = await prisma.vendor.findFirst({ where: { id: input.contractorId, companyId } });
    if (!vendor) throw new Error("Contractor not found");
  }

  if (input.groupId) {
    const group = await prisma.labourGroup.findFirst({ where: { id: input.groupId, companyId } });
    if (!group) throw new Error("Labour group not found");
  }

  const labour = await prisma.labour.update({
    where: { id },
    data: {
      projectId: input.projectId || null,
      contractorId: input.contractorId || null,
      groupId: input.groupId || null,
      name: input.name.trim(),
      phone: input.phone || null,
      designation: input.designation || null,
      category: parseCategory(input.category),
      status: input.status || existing.status,
      remarks: input.remarks || null,
    },
    include,
  });

  const rateByLabour = await getCurrentWageRates(companyId, [id]);
  return toDTO(labour, rateByLabour.get(id));
}

/** Soft delete only, consistent with the audit-trail rule applied across every Phase B module. */
export async function deleteLabour(id: string, companyId: string) {
  const existing = await prisma.labour.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Labour not found");
  if (existing.isDeleted) throw new Error("Labour already deleted");

  await prisma.labour.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
}

export async function exportLabourToCSV(companyId: string, query: LabourListQuery) {
  const { data } = await listLabour(companyId, { ...query, page: 1, limit: 5000 });

  const headers = ["Name", "Phone", "Designation", "Category", "Project", "Contractor", "Group", "Status", "Daily Wage", "Overtime Rate"];

  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = data.map((l) =>
    [
      l.name,
      l.phone,
      l.designation,
      l.category,
      l.project?.name ?? "",
      l.contractor?.name ?? "",
      l.group?.name ?? "",
      l.status,
      l.currentWageRate?.dailyWage ?? "",
      l.currentWageRate?.overtimeRate ?? "",
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
