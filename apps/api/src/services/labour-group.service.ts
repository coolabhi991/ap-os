import prisma from "../config/prisma.js";

export interface LabourGroupFormInput {
  name: string;
  projectId?: string;
  description?: string;
  isActive?: boolean;
}

function toDTO(g: {
  id: string;
  companyId: string;
  projectId: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  project?: { id: string; name: string } | null;
}) {
  return {
    id: g.id,
    companyId: g.companyId,
    projectId: g.projectId ?? "",
    project: g.project ?? null,
    name: g.name,
    description: g.description ?? "",
    isActive: g.isActive,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

const include = { project: { select: { id: true, name: true } } };

export async function listLabourGroups(companyId: string, includeInactive = true) {
  const groups = await prisma.labourGroup.findMany({
    where: { companyId, ...(includeInactive ? {} : { isActive: true }) },
    include,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  return groups.map(toDTO);
}

function validate(input: LabourGroupFormInput) {
  if (!input.name?.trim()) throw new Error("Group name is required");
}

export async function createLabourGroup(companyId: string, input: LabourGroupFormInput) {
  validate(input);

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

  const group = await prisma.labourGroup.create({
    data: {
      companyId,
      projectId: input.projectId || null,
      name: input.name.trim(),
      description: input.description || null,
      isActive: input.isActive ?? true,
    },
    include,
  });

  return toDTO(group);
}

export async function updateLabourGroup(id: string, companyId: string, input: LabourGroupFormInput) {
  const existing = await prisma.labourGroup.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Labour group not found");
  validate(input);

  if (input.projectId) {
    const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
    if (!project) throw new Error("Project not found");
  }

  const group = await prisma.labourGroup.update({
    where: { id },
    data: {
      projectId: input.projectId || null,
      name: input.name.trim(),
      description: input.description || null,
      isActive: input.isActive ?? existing.isActive,
    },
    include,
  });

  return toDTO(group);
}

/** Deletes a group, unless it has workers assigned — deactivated instead. */
export async function deleteLabourGroup(id: string, companyId: string) {
  const existing = await prisma.labourGroup.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Labour group not found");

  const memberCount = await prisma.labour.count({ where: { groupId: id } });

  if (memberCount > 0) {
    const deactivated = await prisma.labourGroup.update({ where: { id }, data: { isActive: false }, include });
    return { deleted: false, data: toDTO(deactivated) };
  }

  await prisma.labourGroup.delete({ where: { id } });
  return { deleted: true, data: null };
}
