import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

import Layout from "../../components/layout/Layout";
import {
  getLabourGroups,
  createLabourGroup,
  updateLabourGroup,
  deleteLabourGroup,
} from "../../services/labour-groups";
import type { LabourGroup, LabourGroupFormData } from "../../services/labour-groups";
import { getProjects } from "../../services/projects";

const emptyForm: LabourGroupFormData = { name: "", projectId: "", description: "", isActive: true };

export default function LabourGroups() {
  const [groups, setGroups] = useState<LabourGroup[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LabourGroupFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setGroups(await getLabourGroups(true));
    } catch {
      setError("Failed to load labour groups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const startEdit = (group: LabourGroup) => {
    setEditingId(group.id);
    setForm({ name: group.name, projectId: group.projectId, description: group.description, isActive: group.isActive });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Group name is required.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      if (editingId) {
        await updateLabourGroup(editingId, form);
      } else {
        await createLabourGroup(form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save group.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this labour group?")) return;
    try {
      const result = await deleteLabourGroup(id);
      if (!result.deleted) alert(result.message);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete group.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Labour Groups</h1>
            <p className="mt-2 text-slate-500">Organize workers into gangs/teams for faster bulk attendance marking.</p>
          </div>
          <button onClick={startAdd} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
            <Plus size={18} /> Add Group
          </button>
        </div>

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Project</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-slate-500">No labour groups yet.</td></tr>
                ) : (
                  groups.map((g) => (
                    <tr key={g.id} className={`border-t hover:bg-slate-50 ${!g.isActive ? "opacity-60" : ""}`}>
                      <td className="px-6 py-4 font-medium">{g.name}</td>
                      <td className="px-6 py-4 text-slate-600">{g.project?.name ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${g.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                          {g.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-4">
                          <button onClick={() => startEdit(g)}><Pencil size={18} className="text-green-600" /></button>
                          <button onClick={() => handleDelete(g.id)}><Trash2 size={18} className="text-red-600" /></button>
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
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-medium">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="mb-2 block font-medium">Project</label>
                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full rounded-lg border p-3">
                  <option value="">Not project-specific</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block font-medium">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border p-3" />
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
                {saving ? "Saving..." : "Save Group"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
