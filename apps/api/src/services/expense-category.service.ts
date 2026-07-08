import prisma from "../config/prisma.js";

export interface ExpenseCategoryFormInput {
  name: string;
  isActive?: boolean;
}

function toDTO(c: { id: string; companyId: string; name: string; isActive: boolean; createdAt: Date; updatedAt: Date }) {
  return {
    id: c.id,
    companyId: c.companyId,
    name: c.name,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function listExpenseCategories(companyId: string, includeInactive = true) {
  const categories = await prisma.expenseCategory.findMany({
    where: { companyId, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  return categories.map(toDTO);
}

export async function createExpenseCategory(companyId: string, input: ExpenseCategoryFormInput) {
  if (!input.name?.trim()) throw new Error("Category name is required");

  const existing = await prisma.expenseCategory.findFirst({ where: { companyId, name: input.name.trim() } });
  if (existing) throw new Error(`Category "${input.name.trim()}" already exists`);

  const category = await prisma.expenseCategory.create({
    data: {
      companyId,
      name: input.name.trim(),
      isActive: input.isActive ?? true,
    },
  });

  return toDTO(category);
}

export async function updateExpenseCategory(id: string, companyId: string, input: ExpenseCategoryFormInput) {
  const existing = await prisma.expenseCategory.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Expense category not found");

  if (!input.name?.trim()) throw new Error("Category name is required");

  const duplicate = await prisma.expenseCategory.findFirst({
    where: { companyId, name: input.name.trim(), id: { not: id } },
  });
  if (duplicate) throw new Error(`Category "${input.name.trim()}" already exists`);

  const category = await prisma.expenseCategory.update({
    where: { id },
    data: {
      name: input.name.trim(),
      isActive: input.isActive ?? existing.isActive,
    },
  });

  return toDTO(category);
}

/** Deletes a category, unless it has expenses recorded against it — deactivated instead. */
export async function deleteExpenseCategory(id: string, companyId: string) {
  const existing = await prisma.expenseCategory.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Expense category not found");

  const expenseCount = await prisma.expense.count({ where: { categoryId: id } });

  if (expenseCount > 0) {
    const deactivated = await prisma.expenseCategory.update({ where: { id }, data: { isActive: false } });
    return { deleted: false, data: toDTO(deactivated) };
  }

  await prisma.expenseCategory.delete({ where: { id } });
  return { deleted: true, data: null };
}
