import { useEffect, useMemo, useState } from "react";
import type { MaterialIssueFormData, MaterialIssue } from "../../services/material-issues";
import type { InventoryItem } from "../../services/inventory";
import { getSubWorks } from "../../services/sub-works";
import type { SubWork } from "../../services/sub-works";
import { todayISO } from "../../lib/utils";

interface Option {
  id: string;
  name: string;
}

interface Props {
  mode: "create" | "edit";
  existingIssue?: MaterialIssue;
  initialData?: Partial<MaterialIssueFormData>;
  onSubmit: (data: MaterialIssueFormData) => void;
  saving?: boolean;
  projects: Option[];
  materials: InventoryItem[];
}

export default function MaterialIssueForm({
  mode,
  existingIssue,
  initialData,
  onSubmit,
  saving = false,
  projects,
  materials,
}: Props) {
  const [form, setForm] = useState<MaterialIssueFormData>({
    projectId: initialData?.projectId ?? "",
    inventoryId: initialData?.inventoryId ?? "",
    subWorkId: initialData?.subWorkId ?? "",
    quantity: initialData?.quantity ?? 0,
    issuedDate: initialData?.issuedDate ?? todayISO(),
    purpose: initialData?.purpose ?? "",
    issuedTo: initialData?.issuedTo ?? "",
    approvedBy: initialData?.approvedBy ?? "",
    remarks: initialData?.remarks ?? "",
    attachmentFileName: initialData?.attachmentFileName ?? "",
    attachmentFileUrl: initialData?.attachmentFileUrl ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof MaterialIssueFormData>(key: K, value: MaterialIssueFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const selectedMaterial = useMemo(() => materials.find((m) => m.id === form.inventoryId) ?? null, [materials, form.inventoryId]);

  const [subWorks, setSubWorks] = useState<SubWork[]>([]);
  useEffect(() => {
    if (!form.projectId) {
      setSubWorks([]);
      return;
    }
    getSubWorks(form.projectId)
      .then(setSubWorks)
      .catch(() => setSubWorks([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.projectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      if (!form.projectId) return setError("Select a project.");
      if (!form.inventoryId) return setError("Select a material.");
      if (!form.quantity || form.quantity <= 0) return setError("Enter an issue quantity greater than zero.");
      if (selectedMaterial && form.quantity > Number(selectedMaterial.availableStock)) {
        return setError(`Only ${selectedMaterial.availableStock} ${selectedMaterial.unit} available.`);
      }
    }
    setError(null);
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Issue Details</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {mode === "create" ? (
            <>
              <div>
                <label className="mb-2 block font-medium">Project *</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value, subWorkId: "" }))}
                  required
                  className="w-full rounded-lg border p-3"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-medium">Sub Work <span className="font-normal text-slate-400">(optional)</span></label>
                <select value={form.subWorkId} onChange={(e) => set("subWorkId", e.target.value)} disabled={!form.projectId} className="w-full rounded-lg border p-3 disabled:bg-slate-50">
                  <option value="">No Sub Work</option>
                  {subWorks.map((sw) => <option key={sw.id} value={sw.id}>{sw.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-medium">Material *</label>
                <select value={form.inventoryId} onChange={(e) => set("inventoryId", e.target.value)} required className="w-full rounded-lg border p-3">
                  <option value="">Select Material</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.itemName} — {m.availableStock} {m.unit} available ({m.warehouse || "no warehouse"})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMaterial && (
                <div className="rounded-lg bg-slate-50 p-4 text-sm md:col-span-2">
                  <p className="text-slate-500">Current Stock: <strong className="text-slate-900">{selectedMaterial.currentStock} {selectedMaterial.unit}</strong></p>
                  <p className="mt-1 text-slate-500">Reserved: <strong className="text-slate-900">{selectedMaterial.reservedStock} {selectedMaterial.unit}</strong></p>
                  <p className="mt-1 text-slate-500">Available Stock: <strong className="text-emerald-700">{selectedMaterial.availableStock} {selectedMaterial.unit}</strong></p>
                </div>
              )}

              <div>
                <label className="mb-2 block font-medium">Issue Quantity *</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  max={selectedMaterial ? Number(selectedMaterial.availableStock) : undefined}
                  value={form.quantity}
                  onChange={(e) => set("quantity", parseFloat(e.target.value) || 0)}
                  required
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Issue Date</label>
                <input type="date" value={form.issuedDate} onChange={(e) => set("issuedDate", e.target.value)} className="w-full rounded-lg border p-3" />
              </div>
            </>
          ) : (
            <div className="rounded-lg bg-slate-50 p-4 text-sm md:col-span-2">
              <p className="text-slate-500">Project: <strong className="text-slate-900">{existingIssue?.project?.name}</strong></p>
              <p className="mt-1 text-slate-500">Material: <strong className="text-slate-900">{existingIssue?.itemName}</strong></p>
              <p className="mt-1 text-slate-500">Quantity: <strong className="text-slate-900">{existingIssue?.quantity} {existingIssue?.unit}</strong></p>
              <p className="mt-1 text-slate-500">Issue Date: <strong className="text-slate-900">{existingIssue?.issuedDate}</strong></p>
              <p className="mt-3 text-xs text-slate-400">
                Project, material, quantity, and date are locked after creation since they already drove the stock
                deduction and ledger entry — correct a mistake with a manual stock adjustment instead of editing here.
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block font-medium">Purpose</label>
            <input type="text" value={form.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="e.g. Site consumption" className="w-full rounded-lg border p-3" />
          </div>

          <div>
            <label className="mb-2 block font-medium">Issued To</label>
            <input type="text" value={form.issuedTo} onChange={(e) => set("issuedTo", e.target.value)} className="w-full rounded-lg border p-3" />
          </div>

          <div>
            <label className="mb-2 block font-medium">Approved By</label>
            <input type="text" value={form.approvedBy} onChange={(e) => set("approvedBy", e.target.value)} className="w-full rounded-lg border p-3" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Attachment &amp; Remarks</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Attachment File Name</label>
            <input
              type="text"
              value={form.attachmentFileName}
              onChange={(e) => set("attachmentFileName", e.target.value)}
              placeholder="e.g. gate-pass.jpg"
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium">Attachment File URL</label>
            <input
              type="text"
              value={form.attachmentFileUrl}
              onChange={(e) => set("attachmentFileUrl", e.target.value)}
              placeholder="Uploaded file URL (once storage is wired up)"
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Remarks</label>
            <textarea rows={3} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} className="w-full rounded-lg border p-3" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save Material Issue"}
        </button>
      </div>
    </form>
  );
}
