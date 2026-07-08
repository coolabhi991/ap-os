import { useState } from "react";
import type { LabourFormData } from "../../services/labour";
import { LABOUR_CATEGORY_LABELS } from "../../services/labour";

interface Option {
  id: string;
  name: string;
}

interface Props {
  mode: "create" | "edit";
  initialData?: Partial<LabourFormData>;
  onSubmit: (data: LabourFormData) => void;
  saving?: boolean;
  projects: Option[];
  contractors: Option[];
  groups: Option[];
}

export default function LabourForm({ mode, initialData, onSubmit, saving = false, projects, contractors, groups }: Props) {
  const [form, setForm] = useState<LabourFormData>({
    name: initialData?.name ?? "",
    projectId: initialData?.projectId ?? "",
    contractorId: initialData?.contractorId ?? "",
    groupId: initialData?.groupId ?? "",
    phone: initialData?.phone ?? "",
    designation: initialData?.designation ?? "",
    category: initialData?.category ?? "UNSKILLED",
    status: initialData?.status ?? "Active",
    remarks: initialData?.remarks ?? "",
    dailyWage: initialData?.dailyWage ?? 0,
    overtimeRate: initialData?.overtimeRate ?? 0,
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof LabourFormData>(key: K, value: LabourFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required.");
    setError(null);
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Worker Details</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Phone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Designation</label>
            <input value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Mason, Helper" className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Category</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full rounded-lg border p-3">
              {Object.entries(LABOUR_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Project</label>
            <select value={form.projectId} onChange={(e) => set("projectId", e.target.value)} className="w-full rounded-lg border p-3">
              <option value="">Not assigned</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Contractor</label>
            <select value={form.contractorId} onChange={(e) => set("contractorId", e.target.value)} className="w-full rounded-lg border p-3">
              <option value="">Direct hire (no contractor)</option>
              {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Group</label>
            <select value={form.groupId} onChange={(e) => set("groupId", e.target.value)} className="w-full rounded-lg border p-3">
              <option value="">No group</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-lg border p-3">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {mode === "create" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Initial Wage Rate <span className="font-normal text-slate-400">(optional — can be added later)</span></h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">Daily Wage</label>
              <input type="number" min={0} step="0.01" value={form.dailyWage} onChange={(e) => set("dailyWage", parseFloat(e.target.value) || 0)} className="w-full rounded-lg border p-3" />
            </div>
            <div>
              <label className="mb-2 block font-medium">Overtime Rate (per hour)</label>
              <input type="number" min={0} step="0.01" value={form.overtimeRate} onChange={(e) => set("overtimeRate", parseFloat(e.target.value) || 0)} className="w-full rounded-lg border p-3" />
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-400">A wage rate is required before attendance can be marked for this worker.</p>
        </div>
      )}

      <div>
        <label className="mb-2 block font-medium">Remarks</label>
        <textarea rows={3} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} className="w-full rounded-lg border p-3" />
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save Worker"}
        </button>
      </div>
    </form>
  );
}
