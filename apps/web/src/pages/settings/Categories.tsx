import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";

import Layout from "../../components/layout/Layout";
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "../../services/expense-categories";
import type { ExpenseCategory, ExpenseCategoryFormData } from "../../services/expense-categories";
import { ALLOCATION_TYPES, ALLOCATION_TYPE_LABELS } from "../../services/transaction-allocations";
import EmptyTableRow from "../../components/ui/EmptyTableRow";

const emptyForm: ExpenseCategoryFormData = { name: "", allocationType: "SITE_EXPENSE", isActive: true };

/**
 * Settings > Categories — the general Category master (Business Review Note). Each Category
 * belongs to exactly one Transaction Type (the existing, fixed AllocationType list — never
 * modified here). This reuses the same ExpenseCategory table/API as the Site Expense-specific
 * page at /expenses/categories; that page keeps working unchanged, scoped to SITE_EXPENSE only.
 * This page is the general, cross-type view: add/edit/activate-deactivate a Category for any
 * Transaction Type, and load Categories dynamically here too (never hardcoded).
 */
export default function Categories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseCategoryFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setCategories(await getExpenseCategories(true, typeFilter || undefined));
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const startAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, allocationType: typeFilter || "SITE_EXPENSE" });
    setFormError(null);
    setShowForm(true);
  };

  const startEdit = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setForm({ name: category.name, allocationType: category.allocationType, isActive: category.isActive });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Category name is required.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      if (editingId) {
        await updateExpenseCategory(editingId, form);
      } else {
        await createExpenseCategory(form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category: ExpenseCategory) => {
    try {
      await updateExpenseCategory(category.id, { name: category.name, allocationType: category.allocationType, isActive: !category.isActive });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update category status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this category?")) return;
    try {
      const result = await deleteExpenseCategory(id);
      if (!result.deleted) {
        alert(result.message);
      }
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
            <p className="mt-2 text-slate-500">Every Category belongs to one Transaction Type — used across Transaction Allocation.</p>
          </div>
          <button onClick={startAdd} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
            <Plus size={18} /> Add Category
          </button>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border p-2.5 text-sm">
            <option value="">All Transaction Types</option>
            {ALLOCATION_TYPES.map((t) => <option key={t} value={t}>{ALLOCATION_TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Transaction Type</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <EmptyTableRow colSpan={4}>No categories yet.</EmptyTableRow>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className={`border-t hover:bg-slate-50 ${!c.isActive ? "opacity-60" : ""}`}>
                      <td className="px-6 py-4 font-medium">{c.name}</td>
                      <td className="px-6 py-4 text-slate-600">{ALLOCATION_TYPE_LABELS[c.allocationType] ?? c.allocationType}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-4">
                          <button onClick={() => handleToggleActive(c)} title={c.isActive ? "Deactivate" : "Activate"}>
                            <Power size={18} className={c.isActive ? "text-amber-600" : "text-emerald-600"} />
                          </button>
                          <button onClick={() => startEdit(c)} title="Edit"><Pencil size={18} className="text-green-600" /></button>
                          <button onClick={() => handleDelete(c.id)} aria-label="Delete" title="Delete"><Trash2 size={18} className="text-red-600" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
            {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block font-medium">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="mb-2 block font-medium">Transaction Type *</label>
                <select value={form.allocationType} onChange={(e) => setForm({ ...form, allocationType: e.target.value })} className="w-full rounded-lg border p-3">
                  {ALLOCATION_TYPES.map((t) => <option key={t} value={t}>{ALLOCATION_TYPE_LABELS[t] ?? t}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
