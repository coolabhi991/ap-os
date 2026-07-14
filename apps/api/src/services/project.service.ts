import prisma from "../config/prisma.js";
import { ProjectStatus, Prisma } from "@prisma/client";
import { deriveInitials } from "../utils/numbering.js";
import { getLatestExtensionTillDateBySite } from "./work-order-extension.service.js";

export interface ProjectListQuery {
  search?: string;
  status?: string;
  clientId?: string;
  projectTypeId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  location?: string;
  manager?: string;
  contractValue?: number;
  progress?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  clientName?: string;
  projectTypeName?: string;
}

/** Find or create a Client by name within a company. */
async function resolveClient(
  clientName: string | undefined,
  companyId: string
): Promise<string | null> {
  if (!clientName?.trim()) return null;

  const existing = await prisma.client.findFirst({
    where: { companyId, name: { equals: clientName.trim() } },
  });

  if (existing) return existing.id;

  const created = await prisma.client.create({
    data: { companyId, name: clientName.trim() },
  });

  return created.id;
}

/** Find or create a ProjectType by name within a company. */
async function resolveProjectType(
  typeName: string | undefined,
  companyId: string
): Promise<string | null> {
  if (!typeName?.trim()) return null;

  const existing = await prisma.projectType.findFirst({
    where: { companyId, name: { equals: typeName.trim() } },
  });

  if (existing) return existing.id;

  const created = await prisma.projectType.create({
    data: { companyId, name: typeName.trim() },
  });

  return created.id;
}

/**
 * System-generated, permanent, read-only Project code (Document Numbering Standard) — name
 * initials, e.g. "Jal Jeevan Mission" -> "JJM", with a numeric suffix appended on collision.
 */
async function generateProjectCode(name: string, companyId: string): Promise<string> {
  const base = deriveInitials(name);
  let candidate = base;
  let suffix = 1;
  while (await prisma.project.findFirst({ where: { companyId, code: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

/** Map a raw status string to the Prisma enum. */
function parseStatus(status: string | undefined): ProjectStatus {
  const map: Record<string, ProjectStatus> = {
    PLANNING: "PLANNING",
    ACTIVE: "ACTIVE",
    ON_HOLD: "ON_HOLD",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  };

  return map[status?.toUpperCase() ?? ""] ?? "PLANNING";
}

export async function listProjects(companyId: string, query: ProjectListQuery) {
  const {
    search = "",
    status,
    clientId,
    projectTypeId,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.ProjectWhereInput = {
    companyId,
    ...(status && { status: parseStatus(status) }),
    ...(clientId && { clientId }),
    ...(projectTypeId && { projectTypeId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { manager: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowedSortFields = [
    "name",
    "code",
    "status",
    "contractValue",
    "progress",
    "startDate",
    "endDate",
    "createdAt",
  ];
  const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: { client: { select: { id: true, name: true } }, projectType: { select: { id: true, name: true } } },
      orderBy: { [orderByField]: sortOrder },
      skip,
      take,
    }),
  ]);

  return { total, page, limit: take, data: projects };
}

export async function getProjectById(id: string, companyId: string) {
  const project = await prisma.project.findFirst({
    where: { id, companyId },
    include: {
      client: { select: { id: true, name: true } },
      projectType: { select: { id: true, name: true } },
    },
  });

  if (!project) throw new Error("Project not found");

  return project;
}

export async function createProject(
  companyId: string,
  input: ProjectCreateInput
) {
  const [clientId, projectTypeId, code] = await Promise.all([
    resolveClient(input.clientName, companyId),
    resolveProjectType(input.projectTypeName, companyId),
    generateProjectCode(input.name, companyId),
  ]);

  return prisma.project.create({
    data: {
      companyId,
      name: input.name,
      code,
      description: input.description ?? null,
      location: input.location ?? null,
      manager: input.manager ?? null,
      contractValue: input.contractValue ?? 0,
      progress: input.progress ?? 0,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      status: parseStatus(input.status),
      clientId,
      projectTypeId,
    },
    include: {
      client: { select: { id: true, name: true } },
      projectType: { select: { id: true, name: true } },
    },
  });
}

export async function updateProject(
  id: string,
  companyId: string,
  input: ProjectCreateInput
) {
  // Verify ownership
  await getProjectById(id, companyId);

  const [clientId, projectTypeId] = await Promise.all([
    resolveClient(input.clientName, companyId),
    resolveProjectType(input.projectTypeName, companyId),
  ]);

  return prisma.project.update({
    where: { id },
    data: {
      name: input.name,
      // code is system-generated and permanent — never re-derived or overwritten on update.
      description: input.description ?? null,
      location: input.location ?? null,
      manager: input.manager ?? null,
      contractValue: input.contractValue ?? 0,
      progress: input.progress ?? 0,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      status: parseStatus(input.status),
      clientId,
      projectTypeId,
    },
    include: {
      client: { select: { id: true, name: true } },
      projectType: { select: { id: true, name: true } },
    },
  });
}

export async function deleteProject(id: string, companyId: string) {
  // Verify ownership before deleting
  await getProjectById(id, companyId);

  return prisma.project.delete({ where: { id } });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Project Executive Dashboard — every Project's roll-up (Total Sites, Total Project Cost, Total
 * Client Payments Received, Total Outstanding) plus the full Site table beneath it, computed
 * entirely on demand from Site Work Orders / RA Bills / Client Payments (never stored/duplicated,
 * per the "Enter Once, Use Everywhere" principle):
 *
 * - Total Project Cost = sum of Site.contractValue (Tender Cost) across the Project's Sites —
 *   never Project.contractValue, which stays a separate, independently-editable legacy field
 *   used elsewhere in the app; this dashboard never reads or writes it.
 * - A Site's "Total Certified" (source for Financial Progress) is the LATEST non-DRAFT
 *   RunningBill's totalCertifiedAmount — that field is already a running cumulative-to-date
 *   figure per bill (see running-bill.service.ts), so summing it across bills would double-count.
 *   This mirrors the exact pattern already used by getProjectBillingSummaryReport in
 *   running-bill.service.ts (bills queried oldest-first, latest overwrites).
 * - Client Payments Received / Outstanding Amount ARE summed across a Site's bills — each bill's
 *   amountReceived/outstandingAmount is that bill's own independent figure (not cumulative), so
 *   summing them is the correct total money received/still owed across every bill raised.
 * - Physical Progress = average of the Site's SubWork.physicalProgress values (same formula as
 *   site-control-center.service.ts's computeSitePhysicalProgress, computed here as one bulk
 *   groupBy across every Site instead of N per-Site queries).
 * - Financial Progress = Total Certified / Tender Cost * 100 — how much of the contract value has
 *   been billed to date.
 */
export async function getProjectExecutiveDashboard(companyId: string) {
  const [projects, sites] = await Promise.all([
    prisma.project.findMany({
      where: { companyId },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.site.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
  ]);

  const siteIds = sites.map((s) => s.id);

  const [bills, subWorkAgg, extensionTillDateBySite] = await Promise.all([
    prisma.runningBill.findMany({
      where: { companyId, status: { not: "DRAFT" }, siteId: { in: siteIds } },
      select: { siteId: true, totalCertifiedAmount: true, amountReceived: true, outstandingAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subWork.groupBy({ by: ["siteId"], where: { companyId, siteId: { in: siteIds } }, _avg: { physicalProgress: true } }),
    getLatestExtensionTillDateBySite(companyId, siteIds),
  ]);

  const financialsBySite = new Map<string, { certified: number; received: number; outstanding: number }>();
  for (const b of bills) {
    if (!b.siteId) continue;
    const bucket = financialsBySite.get(b.siteId) ?? { certified: 0, received: 0, outstanding: 0 };
    // totalCertifiedAmount is already the running cumulative-to-date figure on each bill — bills
    // are queried oldest-first, so the latest bill always overwrites with the up-to-date total.
    bucket.certified = Number(b.totalCertifiedAmount);
    bucket.received += Number(b.amountReceived);
    bucket.outstanding += Number(b.outstandingAmount);
    financialsBySite.set(b.siteId, bucket);
  }

  const physicalProgressBySite = new Map(subWorkAgg.map((s) => [s.siteId, Math.round(s._avg.physicalProgress ?? 0)]));

  const siteRows = sites.map((s) => {
    const financial = financialsBySite.get(s.id) ?? { certified: 0, received: 0, outstanding: 0 };
    const tenderCost = Number(s.contractValue);
    const financialProgress = tenderCost > 0 ? round2((financial.certified / tenderCost) * 100) : 0;
    return {
      id: s.id,
      projectId: s.projectId,
      name: s.name,
      taluka: s.taluka ?? "",
      siteType: s.siteType,
      tenderCost: s.contractValue.toString(),
      workOrderDate: s.workOrderDate ? s.workOrderDate.toISOString().slice(0, 10) : "",
      completionDate: s.completionDate ? s.completionDate.toISOString().slice(0, 10) : "",
      extensionTillDate: extensionTillDateBySite.get(s.id) ?? "",
      clientPaymentsReceived: financial.received.toFixed(2),
      outstandingAmount: financial.outstanding.toFixed(2),
      physicalProgress: physicalProgressBySite.get(s.id) ?? 0,
      financialProgress,
      status: s.status,
    };
  });

  const sitesByProject = new Map<string, typeof siteRows>();
  for (const row of siteRows) {
    const arr = sitesByProject.get(row.projectId) ?? [];
    arr.push(row);
    sitesByProject.set(row.projectId, arr);
  }

  return projects.map((p) => {
    const projSites = sitesByProject.get(p.id) ?? [];
    const totalProjectCost = projSites.reduce((s, r) => s + Number(r.tenderCost), 0);
    const totalClientPaymentsReceived = projSites.reduce((s, r) => s + Number(r.clientPaymentsReceived), 0);
    const totalOutstanding = projSites.reduce((s, r) => s + Number(r.outstandingAmount), 0);
    return {
      id: p.id,
      name: p.name,
      code: p.code ?? "",
      client: p.client,
      status: p.status,
      totalSites: projSites.length,
      totalProjectCost: totalProjectCost.toFixed(2),
      totalClientPaymentsReceived: totalClientPaymentsReceived.toFixed(2),
      totalOutstanding: totalOutstanding.toFixed(2),
      sites: projSites,
    };
  });
}
