import api from "./api";

export interface ExpenseCategory {
  id: string;
  companyId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryFormData {
  name: string;
  isActive: boolean;
}

export async function getExpenseCategories(includeInactive = true): Promise<ExpenseCategory[]> {
  const response = await api.get<{ success: boolean; data: ExpenseCategory[] }>("/expense-categories", {
    params: { includeInactive },
  });
  return response.data.data;
}

export async function createExpenseCategory(data: ExpenseCategoryFormData): Promise<ExpenseCategory> {
  const response = await api.post<{ success: boolean; data: ExpenseCategory }>("/expense-categories", data);
  return response.data.data;
}

export async function updateExpenseCategory(id: string, data: ExpenseCategoryFormData): Promise<ExpenseCategory> {
  const response = await api.put<{ success: boolean; data: ExpenseCategory }>(`/expense-categories/${id}`, data);
  return response.data.data;
}

export async function deleteExpenseCategory(id: string): Promise<{ deleted: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/expense-categories/${id}`);
  return { deleted: response.data.message === "Expense category deleted", message: response.data.message };
}
