import prisma from "../config/prisma.js";
import { AllocationType } from "@prisma/client";
import { ALLOCATION_TYPES } from "./transaction-allocation.service.js";

export interface ExpenseCategoryFormInput {
  name: string;
  allocationType?: string;
  isActive?: boolean;
}

function parseAllocationType(t: string | undefined): AllocationType {
  if (!t) return "SITE_EXPENSE" as AllocationType;
  if (!ALLOCATION_TYPES.includes(t)) throw new Error(`Invalid Transaction Type: ${t}`);
  return t as AllocationType;
}

function toDTO(c: { id: string; companyId: string; name: string; allocationType: AllocationType; isActive: boolean; createdAt: Date; updatedAt: Date }) {
  return {
    id: c.id,
    companyId: c.companyId,
    name: c.name,
    allocationType: c.allocationType,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/** allocationType filters to just that Transaction Type's categories — used by Transaction Allocation's "load categories based on the selected Transaction Type" and by Settings > Categories' type filter. */
export async function listExpenseCategories(companyId: string, includeInactive = true, allocationType?: string) {
  const categories = await prisma.expenseCategory.findMany({
    where: {
      companyId,
      ...(includeInactive ? {} : { isActive: true }),
      ...(allocationType && ALLOCATION_TYPES.includes(allocationType) && { allocationType: allocationType as AllocationType }),
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  return categories.map(toDTO);
}

export async function createExpenseCategory(companyId: string, input: ExpenseCategoryFormInput) {
  if (!input.name?.trim()) throw new Error("Category name is required");
  const allocationType = parseAllocationType(input.allocationType);

  const existing = await prisma.expenseCategory.findFirst({ where: { companyId, allocationType, name: input.name.trim() } });
  if (existing) throw new Error(`Category "${input.name.trim()}" already exists for this Transaction Type`);

  const category = await prisma.expenseCategory.create({
    data: {
      companyId,
      name: input.name.trim(),
      allocationType,
      isActive: input.isActive ?? true,
    },
  });

  return toDTO(category);
}

export async function updateExpenseCategory(id: string, companyId: string, input: ExpenseCategoryFormInput) {
  const existing = await prisma.expenseCategory.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Expense category not found");

  if (!input.name?.trim()) throw new Error("Category name is required");
  const allocationType = input.allocationType !== undefined ? parseAllocationType(input.allocationType) : existing.allocationType;

  const duplicate = await prisma.expenseCategory.findFirst({
    where: { companyId, allocationType, name: input.name.trim(), id: { not: id } },
  });
  if (duplicate) throw new Error(`Category "${input.name.trim()}" already exists for this Transaction Type`);

  const category = await prisma.expenseCategory.update({
    where: { id },
    data: {
      name: input.name.trim(),
      allocationType,
      isActive: input.isActive ?? existing.isActive,
    },
  });

  return toDTO(category);
}

/** Deletes a category, unless it has expenses or allocations recorded against it — deactivated instead. */
export async function deleteExpenseCategory(id: string, companyId: string) {
  const existing = await prisma.expenseCategory.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Expense category not found");

  const [expenseCount, allocationCount] = await Promise.all([
    prisma.expense.count({ where: { categoryId: id } }),
    prisma.transactionAllocation.count({ where: { categoryId: id } }),
  ]);

  if (expenseCount > 0 || allocationCount > 0) {
    const deactivated = await prisma.expenseCategory.update({ where: { id }, data: { isActive: false } });
    return { deleted: false, data: toDTO(deactivated) };
  }

  await prisma.expenseCategory.delete({ where: { id } });
  return { deleted: true, data: null };
}
