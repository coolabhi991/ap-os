import { useState } from "react";
import type { MRFormData, ReceiptItem, ReceivablePO } from "../../services/material-receipts";
import { MR_STATUS_LABELS, QUALITY_STATUS_OPTIONS } from "../../services/material-receipts";
import type { POItem } from "../../services/purchase-orders";

interface Props {
  initialData?: Partial<MRFormData>;
  onSubmit: (data: MRFormData) => void;
  saving?: boolean;
  receivablePOs: ReceivablePO[];
  projects: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
  /** Locked once a PO is selected on create; editing an existing receipt keeps the original PO. */
  poLocked?: boolean;
}

function itemsFromPO(po: ReceivablePO): ReceiptItem[] {
  const poItems = (po.items as POItem[] | null) ?? [];
  return poItems.map((item, index) => {
    const orderedQty = item.quantity;
    const previouslyReceivedQty = po.receivedByIndex[index] ?? 0;
    const balanceQty = Math.max(0, orderedQty - previouslyReceivedQty);
    return {
      poItemIndex: index,
      itemCode: item.itemCode,
      itemName: item.itemName,
      description: item.description,
      unit: item.unit,
      orderedQty,
      previouslyReceivedQty,
      receivingQty: balanceQty,
      acceptedQty: balanceQty,
      rejectedQty: 0,
      balanceQty: 0,
    };
  });
}

function recalcItem(item: ReceiptItem): ReceiptItem {
  const balanceQty = Math.max(0, item.orderedQty - item.previouslyReceivedQty - item.receivingQty);
  return { ...item, balanceQty };
}

export default function MaterialReceiptForm({
  initialData,
  onSubmit,
  saving = false,
  receivablePOs,
  projects,
  vendors,
  poLocked = false,
}: Props) {
  const [form, setForm] = useState<MRFormData>({
    purchaseOrderId: initialData?.purchaseOrderId ?? "",
    projectId: initialData?.projectId ?? "",
    vendorId: initialData?.vendorId ?? "",
    receivedDate: initialData?.receivedDate ?? new Date().toISOString().slice(0, 10),
    challanNumber: initialData?.challanNumber ?? "",
    supplierInvoiceNumber: initialData?.supplierInvoiceNumber ?? "",
    vehicleNumber: initialData?.vehicleNumber ?? "",
    receivedBy: initialData?.receivedBy ?? "",
    supplierRepresentative: initialData?.supplierRepresentative ?? "",
    qualityStatus: initialData?.qualityStatus ?? "",
    items: initialData?.items?.length ? initialData.items : [],
    status: initialData?.status ?? "PENDING",
    remarks: initialData?.remarks ?? "",
    notes: initialData?.notes ?? "",
  });

  const set = <K extends keyof MRFormData>(key: K, value: MRFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handlePOSelect = (poId: string) => {
    set("purchaseOrderId", poId);
    if (!poId) {
      set("items", []);
      return;
    }

    const po = receivablePOs.find((p) => p.id === poId);
    if (!po) return;

    if (po.projectId) set("projectId", po.projectId);
    if (po.vendorId) set("vendorId", po.vendorId);
    set("items", itemsFromPO(po));
  };

  const updateItem = (index: number, key: "receivingQty" | "acceptedQty" | "rejectedQty", raw: string) => {
    const items = [...form.items];
    const value = Math.max(0, parseFloat(raw) || 0);
    items[index] = recalcItem({ ...items[index], [key]: value });
    set("items", items);
  };

  const totalReceiving = form.items.reduce((s, i) => s + i.receivingQty, 0);
  const totalAccepted = form.items.reduce((s, i) => s + i.acceptedQty, 0);
  const totalRejected = form.items.reduce((s, i) => s + i.rejectedQty, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">

      {/* Header */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Receipt Details</h2>
        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <label className="mb-2 block font-medium">Purchase Order *</label>
            <select
              value={form.purchaseOrderId}
              onChange={(e) => handlePOSelect(e.target.value)}
              required
              disabled={poLocked}
              className="w-full rounded-lg border p-3 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="">Select Issued/Partial PO</option>
              {receivablePOs.map((po) => (
                <option key={po.id} value={po.id}>{po.poNumber}</option>
              ))}
            </select>
            {receivablePOs.length === 0 && !poLocked && (
              <p className="mt-1 text-sm text-amber-600">No issued purchase orders awaiting receipt.</p>
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
            <label className="mb-2 block font-medium">Received Date</label>
            <input
              type="date"
              value={form.receivedDate}
              onChange={(e) => set("receivedDate", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Challan Number</label>
            <input
              value={form.challanNumber}
              onChange={(e) => set("challanNumber", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Supplier Invoice Number</label>
            <input
              value={form.supplierInvoiceNumber}
              onChange={(e) => set("supplierInvoiceNumber", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Vehicle Number</label>
            <input
              value={form.vehicleNumber}
              onChange={(e) => set("vehicleNumber", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Received By</label>
            <input
              value={form.receivedBy}
              onChange={(e) => set("receivedBy", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Supplier Representative</label>
            <input
              value={form.supplierRepresentative}
              onChange={(e) => set("supplierRepresentative", e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Quality Status</label>
            <select
              value={form.qualityStatus}
              onChange={(e) => set("qualityStatus", e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select Quality Status</option>
              {QUALITY_STATUS_OPTIONS.map((q) => (
                <option key={q} value={q}>{q.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              {Object.entries(MR_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Items</h2>

        {form.items.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
            Select a Purchase Order to load its items.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Item", "Unit", "Ordered", "Prev. Received", "Receiving", "Accepted", "Rejected", "Balance"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-medium text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {form.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-xs text-slate-500">{item.description}</div>
                    </td>
                    <td className="px-3 py-2">{item.unit}</td>
                    <td className="px-3 py-2 text-right">{item.orderedQty}</td>
                    <td className="px-3 py-2 text-right">{item.previouslyReceivedQty}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={item.receivingQty}
                        onChange={(e) => updateItem(i, "receivingQty", e.target.value)}
                        className="w-24 rounded border p-2 text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={item.acceptedQty}
                        onChange={(e) => updateItem(i, "acceptedQty", e.target.value)}
                        className="w-24 rounded border p-2 text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={item.rejectedQty}
                        onChange={(e) => updateItem(i, "rejectedQty", e.target.value)}
                        className="w-24 rounded border p-2 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{item.balanceQty}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-sm">
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right text-slate-600">Totals</td>
                  <td className="px-3 py-2 text-right font-medium">{totalReceiving}</td>
                  <td className="px-3 py-2 text-right font-medium">{totalAccepted}</td>
                  <td className="px-3 py-2 text-right font-medium">{totalRejected}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Remarks */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-medium">Remarks</label>
          <textarea rows={3} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} className="w-full rounded-lg border p-3" />
        </div>
        <div>
          <label className="mb-2 block font-medium">Notes</label>
          <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} className="w-full rounded-lg border p-3" />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving || form.items.length === 0} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save Receipt"}
        </button>
      </div>
    </form>
  );
}
