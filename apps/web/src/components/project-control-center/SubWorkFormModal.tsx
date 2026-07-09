import { useState } from "react";
import { X } from "lucide-react";
import { createSubWork, updateSubWork, SUBWORK_STATUS_OPTIONS, SUBWORK_STATUS_LABELS } from "../../services/sub-works";
import type { SubWork } from "../../services/sub-works";

interface Props {
  projectId: string;
  initialData?: SubWork;
  onClose: () => void;
  onSaved: () => void;
}

export default function SubWorkFormModal({ projectId, initialData, onClose, onSaved }: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [budgetAmount, setBudgetAmount] = useState(initialData?.budgetAmount ?? "0");
  const [startDate, setStartDate] = useState(initialData?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialData?.endDate ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "PLANNED");
  const [remarks, setRemarks] = useState(initialData?.remarks ?? "");
  const [physicalProgress, setPhysicalProgress] = useState(String(initialData?.physicalProgress ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required.");
    const progress = Number(physicalProgress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return setError("Physical progress must be between 0 and 100.");
    }
    setSaving(true);
    setError(null);
    try {
      if (initialData) {
        await updateSubWork(initialData.id, { name, budgetAmount: Number(budgetAmount), startDate, endDate, status, remarks, physicalProgress: progress });
      } else {
        await createSubWork({ projectId, name, budgetAmount: Number(budgetAmount), startDate, endDate, status, remarks, physicalProgress: progress });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sub work.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initialData ? "Edit Sub Work" : "Add Sub Work"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border p-2.5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Budget Amount</label>
              <input type="number" min={0} step="0.01" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border p-2.5">
                {SUBWORK_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{SUBWORK_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Physical Progress % <span className="font-normal text-slate-400">(entered by the engineer)</span></label>
            <input type="number" min={0} max={100} step="1" value={physicalProgress} onChange={(e) => setPhysicalProgress(e.target.value)} className="w-full rounded-lg border p-2.5" />
            {initialData?.progressUpdatedAt && (
              <p className="mt-1 text-xs text-slate-400">Last updated {new Date(initialData.progressUpdatedAt).toLocaleString()}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Remarks</label>
            <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-lg border p-2.5" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
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
