import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { POFormData, POItem, ApprovedPR } from "../../services/purchase-orders";
import { PO_STATUS_LABELS } from "../../services/purchase-orders";
import type { PRItem } from "../../services/purchase-requisitions";
import { todayISO } from "../../lib/utils";

interface Props {
  initialData?: Partial<POFormData>;
  onSubmit: (data: POFormData) => void;
  saving?: boolean;
  approvedPRs: ApprovedPR[];
  projects: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
}

const emptyItem = (): POItem => ({
  itemCode: "",
  itemName: "",
  description: "",
  unit: "Nos",
  quantity: 1,
  rate: 0,
  gstPercent: 18,
  discountPercent: 0,
  subtotal: 0,
  discountAmount: 0,
  gstAmount: 0,
  amount: 0,
});

function calcItem(item: POItem): POItem {
  const subtotal = +(item.quantity * item.rate).toFixed(2);
  const discountAmount = +(subtotal * item.discountPercent / 100).toFixed(2);
  const afterDiscount = subtotal - discountAmount;
  const gstAmount = +(afterDiscount * item.gstPercent / 100).toFixed(2);
  const amount = +(afterDiscount + gstAmount).toFixed(2);
  return { ...item, subtotal, discountAmount, gstAmount, amount };
}

export default function PurchaseOrderForm({
  initialData,
  onSubmit,
  saving = false,
  approvedPRs,
  projects,
  vendors,
}: Props) {
  const [form, setForm] = useState<POFormData>({
    poNumber: initialData?.poNumber ?? "",
    requisitionId: initialData?.requisitionId ?? "",
    projectId: initialData?.projectId ?? "",
    vendorId: initialData?.vendorId ?? "",
    orderDate: initialData?.orderDate ?? todayISO(),
    expectedDate: initialData?.expectedDate ?? "",
    deliveryAddress: initialData?.deliveryAddress ?? "",
    paymentTerms: initialData?.paymentTerms ?? "",
    items: initialData?.items?.length ? initialData.items : [emptyItem()],
    notes: initialData?.notes ?? "",
    status: initialData?.status ?? "DRAFT",
  });

  const set = <K extends keyof POFormData>(key: K, value: POFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /** When a PR is selected, auto-fill project, vendor, and map items. */
  const handlePRSelect = (prId: string) => {
    set("requisitionId", prId);
    if (!prId) return;

    const pr = approvedPRs.find((p) => p.id === prId);
    if (!pr) return;

    if (pr.projectId) set("projectId", pr.projectId);
    if (pr.vendorId) set("vendorId", pr.vendorId);

    // Map PR items → PO items
    const prItems = (pr.items as PRItem[] | null) ?? [];
    if (prItems.length > 0) {
      const poItems = prItems.map((pi) =>
        calcItem({
          ...emptyItem(),
          itemName: pi.description,
          description: pi.description,
          unit: pi.unit,
          quantity: pi.quantity,
          rate: pi.estimatedRate,
        })
      );
      set("items", poItems);
    }
  };

  const updateItem = (index: number, key: keyof POItem, raw: string) => {
    const items = [...form.items];
    const item = { ...items[index], [key]: key === "itemCode" || key === "itemName" || key === "description" || key === "unit" ? raw : parseFloat(raw) || 0 };
    items[index] = calcItem(item);
    set("items", items);
  };

  const addItem = () => set("items", [...form.items, emptyItem()]);
  const removeItem = (i: number) => set("items", form.items.filter((_, idx) => idx !== i));

  const totals = {
    subtotal: form.items.reduce((s, i) => s + i.subtotal, 0),
    discount: form.items.reduce((s, i) => s + i.discountAmount, 0),
    gst: form.items.reduce((s, i) => s + i.gstAmount, 0),
    total: form.items.reduce((s, i) => s + i.amount, 0),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">

      {/* Header */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Purchase Order Details</h2>
        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <label className="mb-2 block font-medium">PO Number</label>
            <input
              value={form.poNumber}
              onChange={(e) => set("poNumber", e.target.value)}
              placeholder="Auto-generated if blank"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Purchase Requisition *</label>
            <select
              value={form.requisitionId}
              onChange={(e) => handlePRSelect(e.target.value)}
              required
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select Approved PR</option>
              {approvedPRs.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.requisitionNumber} — {pr.title}
                </option>
              ))}
            </select>
            {approvedPRs.length === 0 && (
              <p className="mt-1 text-sm text-amber-600">No approved PRs available. Approve a PR first.</p>
            )}
          </div>

          <div>
            <label className="mb-2 block font-medium">Project</label>
            <select
              value={form.projectId}
              onChange={(e) => set("projectId", e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select Project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Vendor</label>
            <select
              value={form.vendorId}
              onChange={(e) => set("vendorId", e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select Vendor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Order Date</label>
            <input
              type="date"
              value={form.orderDate}
              onChange={(e) => set("orderDate", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Expected Delivery Date</label>
            <input
              type="date"
              value={form.expectedDate}
              onChange={(e) => set("expectedDate", e.target.value)}
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
              {Object.entries(PO_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Payment Terms</label>
            <input
              value={form.paymentTerms}
              onChange={(e) => set("paymentTerms", e.target.value)}
              placeholder="e.g. Net 30"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Delivery Address</label>
            <textarea
              rows={2}
              value={form.deliveryAddress}
              onChange={(e) => set("deliveryAddress", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </div>

      {/* Items */}
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
                {["Code", "Item Name", "Description", "Unit", "Qty", "Rate (₹)", "GST%", "Disc%", "Amount (₹)", ""].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-medium text-slate-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {form.items.map((item, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">
                    <input value={item.itemCode} onChange={(e) => updateItem(i, "itemCode", e.target.value)} placeholder="Code" className="w-20 rounded border p-2" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={item.itemName} onChange={(e) => updateItem(i, "itemName", e.target.value)} placeholder="Item name" className="w-36 rounded border p-2" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Description" className="w-36 rounded border p-2" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={item.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} className="w-16 rounded border p-2" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} className="w-16 rounded border p-2 text-right" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={item.rate} onChange={(e) => updateItem(i, "rate", e.target.value)} className="w-24 rounded border p-2 text-right" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} max={100} value={item.gstPercent} onChange={(e) => updateItem(i, "gstPercent", e.target.value)} className="w-14 rounded border p-2 text-right" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} max={100} value={item.discountPercent} onChange={(e) => updateItem(i, "discountPercent", e.target.value)} className="w-14 rounded border p-2 text-right" />
                  </td>
                  <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => removeItem(i)} disabled={form.items.length === 1} className="text-red-500 disabled:opacity-30">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-sm">
              <tr>
                <td colSpan={8} className="px-4 py-2 text-right text-slate-600">Subtotal</td>
                <td className="px-3 py-2 text-right font-medium">₹{totals.subtotal.toLocaleString("en-IN")}</td>
                <td />
              </tr>
              <tr>
                <td colSpan={8} className="px-4 py-2 text-right text-slate-600">Discount</td>
                <td className="px-3 py-2 text-right font-medium text-red-600">- ₹{totals.discount.toLocaleString("en-IN")}</td>
                <td />
              </tr>
              <tr>
                <td colSpan={8} className="px-4 py-2 text-right text-slate-600">GST</td>
                <td className="px-3 py-2 text-right font-medium">+ ₹{totals.gst.toLocaleString("en-IN")}</td>
                <td />
              </tr>
              <tr className="border-t border-slate-300">
                <td colSpan={8} className="px-4 py-3 text-right font-bold text-slate-700">Grand Total</td>
                <td className="px-3 py-3 text-right text-base font-bold text-slate-900">₹{totals.total.toLocaleString("en-IN")}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-2 block font-medium">Notes / Terms</label>
        <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} className="w-full rounded-lg border p-3" />
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save Purchase Order"}
        </button>
      </div>
    </form>
  );
}
