import { useEffect, useState } from "react";
import type { VendorBillFormData } from "../../services/vendor-bills";
import { getSubWorks } from "../../services/sub-works";
import type { SubWork } from "../../services/sub-works";
import { todayISO } from "../../lib/utils";

interface Option {
  id: string;
  name: string;
}

interface POOption {
  id: string;
  poNumber: string;
}

interface MROption {
  id: string;
  receiptNumber: string;
}

interface FormState {
  vendorId: string;
  projectId: string;
  purchaseOrderId: string;
  materialReceiptId: string;
  subWorkId: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  billAmount: string;
  taxableAmount: string;
  gstAmount: string;
  totalAmount: string;
  invoiceFileName: string;
  invoiceFileUrl: string;
  notes: string;
}

interface Props {
  initialData?: Partial<VendorBillFormData>;
  vendors?: Option[];
  projects?: Option[];
  purchaseOrders?: POOption[];
  materialReceipts?: MROption[];
  onSubmit: (data: VendorBillFormData) => void;
  saving?: boolean;
  isEdit?: boolean;
}

export default function VendorBillForm({
  initialData,
  vendors = [],
  projects = [],
  purchaseOrders = [],
  materialReceipts = [],
  onSubmit,
  saving = false,
  isEdit = false,
}: Props) {
  const [form, setForm] = useState<FormState>({
    vendorId: initialData?.vendorId ?? "",
    projectId: initialData?.projectId ?? "",
    purchaseOrderId: initialData?.purchaseOrderId ?? "",
    materialReceiptId: initialData?.materialReceiptId ?? "",
    subWorkId: initialData?.subWorkId ?? "",
    billNumber: initialData?.billNumber ?? "",
    billDate: initialData?.billDate ?? todayISO(),
    dueDate: initialData?.dueDate ?? "",
    billAmount: initialData?.billAmount !== undefined ? String(initialData.billAmount) : "0",
    taxableAmount: initialData?.taxableAmount !== undefined ? String(initialData.taxableAmount) : "0",
    gstAmount: initialData?.gstAmount !== undefined ? String(initialData.gstAmount) : "0",
    totalAmount: initialData?.totalAmount !== undefined ? String(initialData.totalAmount) : "0",
    invoiceFileName: initialData?.invoiceFileName ?? "",
    invoiceFileUrl: initialData?.invoiceFileUrl ?? "",
    notes: initialData?.notes ?? "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (e.target.name === "projectId") {
      setForm({ ...form, projectId: e.target.value, subWorkId: "" });
      return;
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      vendorId: form.vendorId,
      projectId: form.projectId,
      purchaseOrderId: form.purchaseOrderId,
      materialReceiptId: form.materialReceiptId,
      subWorkId: form.subWorkId,
      billNumber: form.billNumber,
      billDate: form.billDate,
      dueDate: form.dueDate,
      billAmount: Number(form.billAmount) || 0,
      taxableAmount: Number(form.taxableAmount) || 0,
      gstAmount: Number(form.gstAmount) || 0,
      totalAmount: Number(form.totalAmount) || 0,
      invoiceFileName: form.invoiceFileName,
      invoiceFileUrl: form.invoiceFileUrl,
      notes: form.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
      {/* Basic */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Bill Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Vendor *</label>
            <select name="vendorId" value={form.vendorId} onChange={handleChange} required className="w-full rounded-lg border p-3">
              <option value="">Select Vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Project</label>
            <select name="projectId" value={form.projectId} onChange={handleChange} className="w-full rounded-lg border p-3">
              <option value="">Not project-specific</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Sub Work <span className="font-normal text-slate-400">(optional)</span></label>
            <select name="subWorkId" value={form.subWorkId} onChange={handleChange} disabled={!form.projectId} className="w-full rounded-lg border p-3 disabled:bg-slate-50">
              <option value="">No Sub Work</option>
              {subWorks.map((sw) => (
                <option key={sw.id} value={sw.id}>{sw.name}</option>
              ))}
            </select>
          </div>

          {isEdit && (
            <div>
              <label className="mb-2 block font-medium">Bill Number</label>
              <input type="text" value={form.billNumber} disabled className="w-full rounded-lg border bg-slate-50 p-3 text-slate-500" />
            </div>
          )}

          <div>
            <label className="mb-2 block font-medium">Bill Date</label>
            <input type="date" name="billDate" value={form.billDate} onChange={handleChange} className="w-full rounded-lg border p-3" />
          </div>

          <div>
            <label className="mb-2 block font-medium">Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="w-full rounded-lg border p-3" />
          </div>
        </div>
      </div>

      {/* Optional linkage — this company usually skips both */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">
          Purchase Order &amp; Material Receipt <span className="font-normal text-slate-400">(optional)</span>
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          Most vendor bills are raised directly from a phone order and site delivery, without a Purchase
          Order. Link one only if this bill happens to follow the formal PO workflow.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Purchase Order</label>
            <select name="purchaseOrderId" value={form.purchaseOrderId} onChange={handleChange} className="w-full rounded-lg border p-3">
              <option value="">None</option>
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Material Receipt</label>
            <select name="materialReceiptId" value={form.materialReceiptId} onChange={handleChange} className="w-full rounded-lg border p-3">
              <option value="">None</option>
              {materialReceipts.map((mr) => (
                <option key={mr.id} value={mr.id}>
                  {mr.receiptNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Amounts */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Amounts</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <div>
            <label className="mb-2 block font-medium">Bill Amount</label>
            <input type="number" min={0} step="0.01" name="billAmount" value={form.billAmount} onChange={handleChange} className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Taxable Amount</label>
            <input type="number" min={0} step="0.01" name="taxableAmount" value={form.taxableAmount} onChange={handleChange} className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">GST</label>
            <input type="number" min={0} step="0.01" name="gstAmount" value={form.gstAmount} onChange={handleChange} className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Total Amount</label>
            <input type="number" min={0} step="0.01" name="totalAmount" value={form.totalAmount} onChange={handleChange} className="w-full rounded-lg border p-3" />
          </div>
        </div>
        {isEdit && (
          <p className="mt-3 text-sm text-slate-400">
            Outstanding balance and payment status update automatically from recorded payments on the
            bill&apos;s detail page — they are not editable here.
          </p>
        )}
      </div>

      {/* Invoice attachment (future-ready) */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Invoice Attachment</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Invoice File Name</label>
            <input type="text" name="invoiceFileName" value={form.invoiceFileName} onChange={handleChange} placeholder="e.g. invoice-1024.pdf" className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Invoice File URL</label>
            <input type="text" name="invoiceFileUrl" value={form.invoiceFileUrl} onChange={handleChange} placeholder="Uploaded file URL (once storage is wired up)" className="w-full rounded-lg border p-3" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-2 block font-medium">Notes</label>
        <textarea
          name="notes"
          rows={4}
          value={form.notes}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Bill"}
        </button>
      </div>
    </form>
  );
}
