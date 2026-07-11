import prisma from "../config/prisma.js";
import { Prisma, SiteType, ProjectStatus } from "@prisma/client";

export const SITE_TYPES = ["OWN_SITE", "PARTNERSHIP_SITE", "AGENCY_SITE"];
export const SITE_TYPE_LABELS: Record<string, string> = {
  OWN_SITE: "Own Site",
  PARTNERSHIP_SITE: "Partnership Site",
  AGENCY_SITE: "Agency Site",
};

export const SITE_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

export interface SiteFormInput {
  projectId: string;
  name: string;
  village?: string;
  taluka?: string;
  district?: string;
  engineer?: string;
  siteType?: string;
  status?: string;
  contractValue?: number;
  emdValue?: number;
  securityDeposit?: number;
  performanceGuarantee?: number;
  workOrderDate?: string;
  completionDate?: string;
}

export type SiteUpdateInput = Omit<SiteFormInput, "projectId">;

export interface SiteListQuery {
  projectId?: string;
  search?: string;
  siteType?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

type SiteRow = {
  id: string;
  companyId: string;
  projectId: string;
  name: string;
  village: string | null;
  taluka: string | null;
  district: string | null;
  engineer: string | null;
  siteType: SiteType;
  status: ProjectStatus;
  contractValue: Prisma.Decimal;
  emdValue: Prisma.Decimal;
  securityDeposit: Prisma.Decimal;
  performanceGuarantee: Prisma.Decimal;
  workOrderDate: Date | null;
  completionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const dateStr = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export function toSiteDTO(s: SiteRow) {
  return {
    id: s.id,
    companyId: s.companyId,
    projectId: s.projectId,
    name: s.name,
    village: s.village ?? "",
    taluka: s.taluka ?? "",
    district: s.district ?? "",
    engineer: s.engineer ?? "",
    siteType: s.siteType,
    status: s.status,
    contractValue: s.contractValue.toString(),
    emdValue: s.emdValue.toString(),
    securityDeposit: s.securityDeposit.toString(),
    performanceGuarantee: s.performanceGuarantee.toString(),
    workOrderDate: dateStr(s.workOrderDate),
    completionDate: dateStr(s.completionDate),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function parseSiteType(t: string | undefined): SiteType {
  return SITE_TYPES.includes(t ?? "") ? (t as SiteType) : "OWN_SITE";
}

function parseStatus(s: string | undefined): ProjectStatus {
  return SITE_STATUSES.includes(s ?? "") ? (s as ProjectStatus) : "PLANNING";
}

const SITE_SORTABLE_FIELDS = ["name", "createdAt", "updatedAt", "contractValue", "status"];

async function verifyProjectOwnership(projectId: string, companyId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new Error("Project not found");
  return project;
}

export async function listSites(companyId: string, query: SiteListQuery) {
  const {
    projectId,
    search = "",
    siteType,
    status,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.SiteWhereInput = {
    companyId,
    ...(projectId && { projectId }),
    ...(siteType && { siteType: siteType as SiteType }),
    ...(status && { status: status as ProjectStatus }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { village: { contains: search, mode: "insensitive" } },
        { taluka: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
        { engineer: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const orderField = SITE_SORTABLE_FIELDS.includes(sortBy) ? sortBy : "createdAt";
  const take = Math.min(100, limit);

  const [total, sites] = await Promise.all([
    prisma.site.count({ where }),
    prisma.site.findMany({
      where,
      orderBy: { [orderField]: sortOrder },
      skip: (page - 1) * take,
      take,
    }),
  ]);

  return { total, page, limit: take, data: sites.map(toSiteDTO) };
}

export async function getSiteById(id: string, companyId: string) {
  const site = await prisma.site.findFirst({ where: { id, companyId } });
  if (!site) throw new Error("Site not found");
  return toSiteDTO(site);
}

export async function createSite(companyId: string, input: SiteFormInput) {
  if (!input.projectId?.trim()) throw new Error("Project is required");
  if (!input.name?.trim()) throw new Error("Site name is required");
  await verifyProjectOwnership(input.projectId, companyId);

  const site = await prisma.site.create({
    data: {
      companyId,
      projectId: input.projectId,
      name: input.name.trim(),
      village: input.village || null,
      taluka: input.taluka || null,
      district: input.district || null,
      engineer: input.engineer || null,
      siteType: parseSiteType(input.siteType),
      status: parseStatus(input.status),
      contractValue: input.contractValue ?? 0,
      emdValue: input.emdValue ?? 0,
      securityDeposit: input.securityDeposit ?? 0,
      performanceGuarantee: input.performanceGuarantee ?? 0,
      workOrderDate: input.workOrderDate ? new Date(input.workOrderDate) : null,
      completionDate: input.completionDate ? new Date(input.completionDate) : null,
    },
  });
  return toSiteDTO(site);
}

export async function updateSite(id: string, companyId: string, input: SiteUpdateInput) {
  await getSiteById(id, companyId);
  if (input.name !== undefined && !input.name.trim()) throw new Error("Site name is required");

  const site = await prisma.site.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.village !== undefined && { village: input.village || null }),
      ...(input.taluka !== undefined && { taluka: input.taluka || null }),
      ...(input.district !== undefined && { district: input.district || null }),
      ...(input.engineer !== undefined && { engineer: input.engineer || null }),
      ...(input.siteType !== undefined && { siteType: parseSiteType(input.siteType) }),
      ...(input.status !== undefined && { status: parseStatus(input.status) }),
      ...(input.contractValue !== undefined && { contractValue: input.contractValue }),
      ...(input.emdValue !== undefined && { emdValue: input.emdValue }),
      ...(input.securityDeposit !== undefined && { securityDeposit: input.securityDeposit }),
      ...(input.performanceGuarantee !== undefined && { performanceGuarantee: input.performanceGuarantee }),
      ...(input.workOrderDate !== undefined && { workOrderDate: input.workOrderDate ? new Date(input.workOrderDate) : null }),
      ...(input.completionDate !== undefined && { completionDate: input.completionDate ? new Date(input.completionDate) : null }),
    },
  });
  return toSiteDTO(site);
}

export async function deleteSite(id: string, companyId: string) {
  await getSiteById(id, companyId);
  // SubWork/DPR/MB/RunningBill/Expense/LabourAttendance.siteId are required FKs with the
  // default RESTRICT delete behavior, so a Site with any operational data will fail to
  // delete at the DB level rather than silently orphaning records.
  return prisma.site.delete({ where: { id } });
}
