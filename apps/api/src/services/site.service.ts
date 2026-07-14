import prisma from "../config/prisma.js";
import { Prisma, SiteType, ProjectStatus } from "@prisma/client";
import { getFinancialYear, getTalukaCode, padSeq } from "../utils/numbering.js";

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
  actualCompletionDate?: string;
  // Work Order Details tab fields (Workflow Refinement milestone, Item 1).
  workOrderNumber?: string;
  agreementNumber?: string;
  agreementDate?: string;
  tenderNumber?: string;
  tenderAboveBelowPercent?: number;
  department?: string;
  division?: string;
  subDivision?: string;
  clientEngineer?: string;
  defectLiabilityPeriod?: string;
  gstPercent?: number;
}

export type SiteUpdateInput = Omit<SiteFormInput, "projectId"> & {
  // Required only when tenderAboveBelowPercent is actually being changed to a different value —
  // Tender Above/Below (%) can only be edited from Work Order Details, and every change is
  // permanently logged (Form 58 redesign: Freeze Tender Values).
  tenderChangeReason?: string;
};

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
  actualCompletionDate: Date | null;
  workOrderNumber: string | null;
  agreementNumber: string | null;
  agreementDate: Date | null;
  tenderNumber: string | null;
  tenderAboveBelowPercent: Prisma.Decimal | null;
  department: string | null;
  division: string | null;
  subDivision: string | null;
  clientEngineer: string | null;
  defectLiabilityPeriod: string | null;
  gstPercent: Prisma.Decimal | null;
  siteCode: string | null;
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
    actualCompletionDate: dateStr(s.actualCompletionDate),
    workOrderNumber: s.workOrderNumber ?? "",
    agreementNumber: s.agreementNumber ?? "",
    agreementDate: dateStr(s.agreementDate),
    tenderNumber: s.tenderNumber ?? "",
    tenderAboveBelowPercent: s.tenderAboveBelowPercent ? s.tenderAboveBelowPercent.toString() : "",
    department: s.department ?? "",
    division: s.division ?? "",
    subDivision: s.subDivision ?? "",
    clientEngineer: s.clientEngineer ?? "",
    defectLiabilityPeriod: s.defectLiabilityPeriod ?? "",
    gstPercent: s.gstPercent ? s.gstPercent.toString() : "",
    // System-generated, permanent, read-only (Document Numbering Standard).
    siteCode: s.siteCode ?? "",
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// Optional Decimal fields arrive from the client as number | "" | undefined — "" must become
// null before hitting Prisma, which rejects an empty string for a Decimal column.
function normalizeOptionalDecimal(v: number | "" | undefined): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === "") return null;
  return v;
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

/**
 * System-generated, permanent, read-only Site code (Document Numbering Standard) —
 * APC/<ProjectCode>/<FY>/<TalukaCode>/<SiteSeq>. Financial Year comes from the Document Date
 * (Work Order Date if provided, else today). Sequence is per Project + Financial Year + Taluka.
 */
async function generateSiteCode(
  companyId: string,
  projectCode: string | null,
  taluka: string | undefined,
  documentDate: Date
): Promise<string> {
  const fy = getFinancialYear(documentDate);
  const talukaCode = getTalukaCode(taluka?.trim() || "General");
  const projectPart = projectCode || "GEN";
  const prefix = `APC/${projectPart}/${fy}/${talukaCode}/`;
  const count = await prisma.site.count({ where: { companyId, siteCode: { startsWith: prefix } } });
  return `${prefix}${padSeq(count + 1)}`;
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
        { siteCode: { contains: search, mode: "insensitive" } },
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
  const project = await verifyProjectOwnership(input.projectId, companyId);

  const documentDate = input.workOrderDate ? new Date(input.workOrderDate) : new Date();
  const siteCode = await generateSiteCode(companyId, project.code, input.taluka, documentDate);

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
      actualCompletionDate: input.status === "COMPLETED" && input.actualCompletionDate ? new Date(input.actualCompletionDate) : null,
      workOrderNumber: input.workOrderNumber || null,
      agreementNumber: input.agreementNumber || null,
      agreementDate: input.agreementDate ? new Date(input.agreementDate) : null,
      tenderNumber: input.tenderNumber || null,
      tenderAboveBelowPercent: normalizeOptionalDecimal(input.tenderAboveBelowPercent) ?? null,
      department: input.department || null,
      division: input.division || null,
      subDivision: input.subDivision || null,
      clientEngineer: input.clientEngineer || null,
      defectLiabilityPeriod: input.defectLiabilityPeriod || null,
      gstPercent: normalizeOptionalDecimal(input.gstPercent) ?? null,
      siteCode,
    },
  });
  return toSiteDTO(site);
}

export async function updateSite(id: string, companyId: string, input: SiteUpdateInput, changedById?: string) {
  const existing = await prisma.site.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Site not found");
  if (input.name !== undefined && !input.name.trim()) throw new Error("Site name is required");

  const effectiveStatus = input.status !== undefined ? parseStatus(input.status) : existing.status;

  // Freeze Tender Values (Form 58 redesign) — this is the only place tenderAboveBelowPercent can
  // ever be edited, and every actual change (not merely re-submitting the same value) requires a
  // reason and is permanently logged. RA Bills already created keep whatever percent they froze
  // in at creation time; only bills created after this change pick up the new value.
  const newTenderPercent = input.tenderAboveBelowPercent !== undefined ? normalizeOptionalDecimal(input.tenderAboveBelowPercent) : undefined;
  const tenderPercentChanged =
    newTenderPercent !== undefined && Number(newTenderPercent ?? 0) !== Number(existing.tenderAboveBelowPercent ?? 0);
  if (tenderPercentChanged) {
    if (!input.tenderChangeReason?.trim()) throw new Error("A reason is required when changing Tender Above/Below (%)");
    if (!changedById) throw new Error("Changed By is required when changing Tender Above/Below (%)");
  }

  const site = await prisma.$transaction(async (tx) => {
    if (tenderPercentChanged && changedById) {
      await tx.siteTenderPercentChangeLog.create({
        data: {
          companyId,
          siteId: id,
          previousPercent: existing.tenderAboveBelowPercent,
          newPercent: newTenderPercent,
          reason: input.tenderChangeReason!.trim(),
          changedById,
        },
      });
    }
    return tx.site.update({
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
      // Actual Completion Date only ever applies while the Site is Completed — clears itself
      // automatically if the status is ever moved off Completed again.
      ...(effectiveStatus !== "COMPLETED"
        ? { actualCompletionDate: null }
        : input.actualCompletionDate !== undefined && { actualCompletionDate: input.actualCompletionDate ? new Date(input.actualCompletionDate) : null }),
      // Work Order Details tab fields — freely editable after creation; only siteCode itself
      // (the system-generated document number) is permanent and read-only.
      ...(input.workOrderNumber !== undefined && { workOrderNumber: input.workOrderNumber || null }),
      ...(input.agreementNumber !== undefined && { agreementNumber: input.agreementNumber || null }),
      ...(input.agreementDate !== undefined && { agreementDate: input.agreementDate ? new Date(input.agreementDate) : null }),
      ...(input.tenderNumber !== undefined && { tenderNumber: input.tenderNumber || null }),
      ...(input.tenderAboveBelowPercent !== undefined && { tenderAboveBelowPercent: normalizeOptionalDecimal(input.tenderAboveBelowPercent) }),
      ...(input.department !== undefined && { department: input.department || null }),
      ...(input.division !== undefined && { division: input.division || null }),
      ...(input.subDivision !== undefined && { subDivision: input.subDivision || null }),
      ...(input.clientEngineer !== undefined && { clientEngineer: input.clientEngineer || null }),
      ...(input.defectLiabilityPeriod !== undefined && { defectLiabilityPeriod: input.defectLiabilityPeriod || null }),
      ...(input.gstPercent !== undefined && { gstPercent: normalizeOptionalDecimal(input.gstPercent) }),
    },
    });
  });
  return toSiteDTO(site);
}

/** Tender Above/Below (%) change history for a Site's Work Order — the permanent audit trail Freeze Tender Values requires. */
export async function getTenderPercentChangeLog(siteId: string, companyId: string) {
  await getSiteById(siteId, companyId);
  const rows = await prisma.siteTenderPercentChangeLog.findMany({
    where: { siteId, companyId },
    orderBy: { changedAt: "desc" },
    include: { changedBy: { select: { id: true, name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    previousPercent: r.previousPercent ? r.previousPercent.toString() : "",
    newPercent: r.newPercent ? r.newPercent.toString() : "",
    reason: r.reason,
    changedById: r.changedById,
    changedByName: r.changedBy?.name ?? "",
    changedAt: r.changedAt.toISOString(),
  }));
}

export async function deleteSite(id: string, companyId: string) {
  await getSiteById(id, companyId);
  // SubWork/DPR/MB/RunningBill/Expense/LabourAttendance.siteId are required FKs with the
  // default RESTRICT delete behavior, so a Site with any operational data will fail to
  // delete at the DB level rather than silently orphaning records.
  return prisma.site.delete({ where: { id } });
}
