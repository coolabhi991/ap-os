import prisma from "../config/prisma.js";
import { Prisma, SiteVisitStatus } from "@prisma/client";

export const SITE_VISIT_STATUSES = ["PLANNED", "COMPLETED", "CANCELLED"];
export const SITE_VISIT_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export interface SiteVisitFormInput {
  siteId: string;
  visitDate?: string;
  visitedBy?: string;
  purpose?: string;
  remarks?: string;
  photos?: string[];
  status?: string;
}

export type SiteVisitUpdateInput = Omit<SiteVisitFormInput, "siteId">;

export interface SiteVisitListQuery {
  siteId: string;
  status?: string;
  page?: number;
  limit?: number;
}

type SiteVisitRow = {
  id: string;
  companyId: string;
  siteId: string;
  visitDate: Date;
  visitedBy: string | null;
  purpose: string | null;
  remarks: string | null;
  photos: Prisma.JsonValue;
  status: SiteVisitStatus;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { name: string } | null;
};

function toSiteVisitDTO(v: SiteVisitRow) {
  return {
    id: v.id,
    companyId: v.companyId,
    siteId: v.siteId,
    visitDate: v.visitDate.toISOString().slice(0, 10),
    visitedBy: v.visitedBy ?? "",
    purpose: v.purpose ?? "",
    remarks: v.remarks ?? "",
    photos: Array.isArray(v.photos) ? (v.photos as string[]) : [],
    status: v.status,
    createdById: v.createdById,
    createdByName: v.createdBy?.name ?? "",
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

function parseStatus(s: string | undefined): SiteVisitStatus {
  return SITE_VISIT_STATUSES.includes(s ?? "") ? (s as SiteVisitStatus) : "PLANNED";
}

async function verifySiteOwnership(siteId: string, companyId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, companyId } });
  if (!site) throw new Error("Site not found");
  return site;
}

export async function listSiteVisits(companyId: string, query: SiteVisitListQuery) {
  await verifySiteOwnership(query.siteId, companyId);
  const { siteId, status, page = 1, limit = 50 } = query;
  const take = Math.min(100, limit);

  const where: Prisma.SiteVisitWhereInput = { companyId, siteId, ...(status && { status: status as SiteVisitStatus }) };

  const [total, visits, pending, completed] = await Promise.all([
    prisma.siteVisit.count({ where: { companyId, siteId, status: { not: "CANCELLED" } } }),
    prisma.siteVisit.findMany({
      where,
      orderBy: { visitDate: "desc" },
      skip: (page - 1) * take,
      take,
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.siteVisit.count({ where: { companyId, siteId, status: "PLANNED" } }),
    prisma.siteVisit.count({ where: { companyId, siteId, status: "COMPLETED" } }),
  ]);

  return {
    total,
    page,
    limit: take,
    // Total Planned Visits = every visit ever scheduled (Completed + still-Pending);
    // Cancelled visits are excluded from the "plan" entirely.
    summary: { totalPlanned: pending + completed, completed, pending },
    data: visits.map(toSiteVisitDTO),
  };
}

export async function getSiteVisitById(id: string, companyId: string) {
  const visit = await prisma.siteVisit.findFirst({ where: { id, companyId }, include: { createdBy: { select: { name: true } } } });
  if (!visit) throw new Error("Site visit not found");
  return toSiteVisitDTO(visit);
}

export async function createSiteVisit(companyId: string, createdById: string, input: SiteVisitFormInput) {
  if (!input.siteId?.trim()) throw new Error("Site is required");
  await verifySiteOwnership(input.siteId, companyId);

  const visit = await prisma.siteVisit.create({
    data: {
      companyId,
      siteId: input.siteId,
      visitDate: input.visitDate ? new Date(input.visitDate) : new Date(),
      visitedBy: input.visitedBy || null,
      purpose: input.purpose || null,
      remarks: input.remarks || null,
      photos: input.photos && input.photos.length ? input.photos : Prisma.JsonNull,
      status: parseStatus(input.status),
      createdById,
    },
    include: { createdBy: { select: { name: true } } },
  });
  return toSiteVisitDTO(visit);
}

export async function updateSiteVisit(id: string, companyId: string, input: SiteVisitUpdateInput) {
  await getSiteVisitById(id, companyId);

  const visit = await prisma.siteVisit.update({
    where: { id },
    data: {
      ...(input.visitDate !== undefined && { visitDate: new Date(input.visitDate) }),
      ...(input.visitedBy !== undefined && { visitedBy: input.visitedBy || null }),
      ...(input.purpose !== undefined && { purpose: input.purpose || null }),
      ...(input.remarks !== undefined && { remarks: input.remarks || null }),
      ...(input.photos !== undefined && { photos: input.photos.length ? input.photos : Prisma.JsonNull }),
      ...(input.status !== undefined && { status: parseStatus(input.status) }),
    },
    include: { createdBy: { select: { name: true } } },
  });
  return toSiteVisitDTO(visit);
}

export async function deleteSiteVisit(id: string, companyId: string) {
  await getSiteVisitById(id, companyId);
  return prisma.siteVisit.delete({ where: { id } });
}
