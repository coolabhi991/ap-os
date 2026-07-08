import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PRFormData, PRItem } from "../../services/purchase-requisitions";
import { PR_STATUS_LABELS } from "../../services/purchase-requisitions";

interface Props {
  initialData?: Partial<PRFormData>;
  onSubmit: (data: PRFormData) => void;
  saving?: boolean;
  projects: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
}

const emptyItem = (): PRItem => ({
  description: "",
  quantity: 1,
  unit: "Nos",
  estimatedRate: 0,
  amount: 0,
});

export default function PurchaseRequisitionForm({
  initialData,
  onSubmit,
  saving = false,
  projects,
  vendors,
}: Props) {
  const [form, setForm] = useState<PRFormData>({
    requisitionNumber: initialData?.requisitionNumber ?? "",
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    projectId: initialData?.projectId ?? "",
    vendorId: initialData?.vendorId ?? "",
    requiredDate: initialData?.requiredDate ?? "",
    status: initialData?.status ?? "DRAFT",
    items: initialData?.items?.length ? initialData.items : [emptyItem()],
    notes: initialData?.notes ?? "",
  });

  const set = (key: keyof PRFormData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateItem = (index: number, key: keyof PRItem, raw: string) => {
    const items = [...form.items];
    const item = { ...items[index] };

    if (key === "description" || key === "unit") {
      (item as Record<string, unknown>)[key] = raw;
    } else {
      const num = parseFloat(raw) || 0;
      (item as Record<string, unknown>)[key] = num;
      if (key === "quantity" || key === "estimatedRate") {
        item.amount = +(item.quantity * item.estimatedRate).toFixed(2);
      }
    }

    items[index] = item;
    set("items", items);
  };

  const addItem = () => set("items", [...form.items, emptyItem()]);

  const removeItem = (i: number) =>
    set("items", form.items.filter((_, idx) => idx !== i));

  const totalAmount = form.items.reduce((s, i) => s + (i.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">

      {/* Header fields */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Requisition Details</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">PR Number</label>
            <input
              name="requisitionNumber"
              value={form.requisitionNumber}
              onChange={(e) => set("requisitionNumber", e.target.value)}
              placeholder="Auto-generated if blank"
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium">Project</label>
            <select
              value={form.projectId}
              onChange={(e) => set("projectId", e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Preferred Vendor</label>
            <select
              value={form.vendorId}
              onChange={(e) => set("vendorId", e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select Vendor (optional)</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Required Date</label>
            <input
              type="date"
              value={form.requiredDate}
              onChange={(e) => set("requiredDate", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              {Object.entries(PR_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-700">Items</h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Description</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 w-20">Qty</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 w-24">Unit</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 w-32">Rate (₹)</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 w-32">Amount (₹)</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {form.items.map((item, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      placeholder="Item description"
                      className="w-full rounded border p-2"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", e.target.value)}
                      className="w-full rounded border p-2 text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={item.unit}
                      onChange={(e) => updateItem(i, "unit", e.target.value)}
                      className="w-full rounded border p-2"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={item.estimatedRate}
                      onChange={(e) => updateItem(i, "estimatedRate", e.target.value)}
                      className="w-full rounded border p-2 text-right"
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {item.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      disabled={form.items.length === 1}
                      className="text-red-500 disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-700">Total Amount</td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-2 block font-medium">Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Requisition"}
        </button>
      </div>
    </form>
  );
}
