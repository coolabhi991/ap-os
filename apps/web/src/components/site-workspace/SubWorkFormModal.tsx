import { useState } from "react";
import { X } from "lucide-react";
import type { SubWork, SubWorkFormData } from "../../services/sub-works";
import { SUBWORK_STATUS_OPTIONS, SUBWORK_STATUS_LABELS } from "../../services/sub-works";

interface Props {
  siteId: string;
  initialData?: SubWork;
  onSubmit: (data: SubWorkFormData) => void;
  onClose: () => void;
  saving: boolean;
}

const BUDGET_FIELDS: { key: keyof SubWorkFormData; label: string }[] = [
  { key: "budgetMaterial", label: "Material" },
  { key: "budgetLabour", label: "Labour" },
  { key: "budgetMachinery", label: "Machinery" },
  { key: "budgetFuel", label: "Fuel" },
  { key: "budgetSiteExpenses", label: "Site Expenses" },
  { key: "budgetVendorBills", label: "Vendor Bills" },
  { key: "budgetOther", label: "Other" },
];

export default function SubWorkFormModal({ siteId, initialData, onSubmit, onClose, saving }: Props) {
  const [form, setForm] = useState<SubWorkFormData>({
    siteId,
    name: initialData?.name ?? "",
    startDate: initialData?.startDate ?? "",
    endDate: initialData?.endDate ?? "",
    status: initialData?.status ?? "PLANNED",
    remarks: initialData?.remarks ?? "",
    physicalProgress: initialData?.physicalProgress ?? 0,
    budgetMaterial: initialData ? Number(initialData.budgetMaterial) : 0,
    budgetLabour: initialData ? Number(initialData.budgetLabour) : 0,
    budgetMachinery: initialData ? Number(initialData.budgetMachinery) : 0,
    budgetFuel: initialData ? Number(initialData.budgetFuel) : 0,
    budgetSiteExpenses: initialData ? Number(initialData.budgetSiteExpenses) : 0,
    budgetVendorBills: initialData ? Number(initialData.budgetVendorBills) : 0,
    budgetOther: initialData ? Number(initialData.budgetOther) : 0,
  });

  const set = <K extends keyof SubWorkFormData>(key: K, value: SubWorkFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Sub Work name is required");
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{initialData ? "Edit Sub Work" : "Add Sub Work"}</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-lg border p-2.5">
                {SUBWORK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{SUBWORK_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Physical Progress %</label>
              <input type="number" min={0} max={100} value={form.physicalProgress} onChange={(e) => set("physicalProgress", Number(e.target.value))} className="w-full rounded-lg border p-2.5" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Remarks</label>
              <textarea rows={2} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Planned Budget by Cost Head</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {BUDGET_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form[f.key] as number}
                    onChange={(e) => set(f.key, Number(e.target.value) as SubWorkFormData[typeof f.key])}
                    className="w-full rounded-lg border p-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
