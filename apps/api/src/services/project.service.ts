import prisma from "../config/prisma.js";
import { ProjectStatus, Prisma } from "@prisma/client";
import { deriveInitials } from "../utils/numbering.js";

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
