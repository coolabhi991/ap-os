import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { RunningBill, RunningBillDeductionInput, RunningBillFormData } from "../../services/running-bills";
import { BILL_TYPE_OPTIONS, BILL_TYPE_LABELS, DEDUCTION_TYPE_OPTIONS, DEDUCTION_TYPE_LABELS } from "../../services/running-bills";
import { todayISO } from "../../lib/utils";

export interface AbstractPreviewRow {
  boqItemNo: string;
  boqDescription: string;
  unit: string;
  previousQuantity?: string;
  currentQuantity: string;
  totalQuantity?: string;
  boqRate: string;
  paymentPercent: string;
  effectiveRate: string;
  previousAmount?: string;
  currentAmount: string;
  totalAmount?: string;
}

export interface SourceInfo {
  mbNumber: string;
  mbDate: string;
  project: string;
  subWork: string;
  site?: string;
}

type DeductionRow = RunningBillDeductionInput;

interface Props {
  initialData?: RunningBill;
  source: SourceInfo;
  items: AbstractPreviewRow[];
  onSubmit: (data: RunningBillFormData) => void;
  saving?: boolean;
}

function emptyDeduction(): DeductionRow {
  return { type: "OTHER", label: "", amount: 0, remarks: "" };
}

export default function RunningBillForm({ initialData, source, items, onSubmit, saving = false }: Props) {
  const isLocked = !!initialData && initialData.status !== "DRAFT";

  const [billNumber, setBillNumber] = useState(initialData?.billNumber ?? "");
  const [billType, setBillType] = useState(initialData?.billType ?? "RA_BILL");
  const [site, setSite] = useState(initialData?.site ?? source.site ?? "");
  const [billSubmittedDate, setBillSubmittedDate] = useState(initialData?.billSubmittedDate ?? "");
  const [billDate, setBillDate] = useState(initialData?.billDate ?? todayISO());
  const [remarks, setRemarks] = useState(initialData?.remarks ?? "");

  const [deductions, setDeductions] = useState<DeductionRow[]>(
    initialData?.deductions.length
      ? initialData.deductions.map((d) => ({ type: d.type, label: d.label, amount: Number(d.amount), remarks: d.remarks }))
      : []
  );

  const [error, setError] = useState<string | null>(null);

  const updateDeduction = (i: number, patch: Partial<DeductionRow>) => setDeductions((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addDeduction = () => setDeductions((rows) => [...rows, emptyDeduction()]);
  const removeDeduction = (i: number) => setDeductions((rows) => rows.filter((_, idx) => idx !== i));

  const currentCertifiedAmount = useMemo(() => items.reduce((s, i) => s + Number(i.currentAmount), 0), [items]);
  const totalDeductions = useMemo(() => deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0), [deductions]);
  const netPayable = currentCertifiedAmount - totalDeductions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return setError("This Running Bill is no longer a Draft and cannot be edited.");
    if (!billNumber.trim()) return setError("Running Bill No. is required.");
    for (const d of deductions) {
      if (!Number.isFinite(Number(d.amount)) || Number(d.amount) < 0) return setError("Every deduction amount must be zero or greater.");
    }

    setError(null);
    onSubmit({
      measurementBookId: initialData?.measurementBookId ?? "",
      billNumber: billNumber.trim(),
      billType,
      site: site || undefined,
      billSubmittedDate: billSubmittedDate || undefined,
      billDate,
      remarks: remarks || undefined,
      deductions: deductions.map((d) => ({ type: d.type, label: d.label || undefined, amount: Number(d.amount) || 0, remarks: d.remarks || undefined })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
      {isLocked && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 text-blue-700">
          This Running Bill has left Draft — header and deductions can no longer be edited.
        </div>
      )}

      {/* SOURCE */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">{source.mbNumber ? "Sourced From Measurement Book" : "Form 58 — Site Bill Item Master"}</h2>
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
          {source.mbNumber ? (
            <>
              <div><p className="text-xs text-slate-500">MB Number</p><p className="font-medium">{source.mbNumber}</p></div>
              <div><p className="text-xs text-slate-500">MB Date</p><p className="font-medium">{source.mbDate}</p></div>
            </>
          ) : (
            <div><p className="text-xs text-slate-500">Site</p><p className="font-medium">{source.site || "—"}</p></div>
          )}
          <div><p className="text-xs text-slate-500">Project</p><p className="font-medium">{source.project}</p></div>
          <div><p className="text-xs text-slate-500">Sub Work</p><p className="font-medium">{source.subWork || "—"}</p></div>
        </div>
      </div>

      {/* GENERAL */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">General</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Running Bill No. *</label>
            <input type="text" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} required disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Bill Type *</label>
            <select value={billType} onChange={(e) => setBillType(e.target.value)} required disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50">
              {BILL_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{BILL_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Bill Date *</label>
            <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} required disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Site</label>
            <input type="text" value={site} onChange={(e) => setSite(e.target.value)} disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Bill Submitted Date</label>
            <input type="date" value={billSubmittedDate} onChange={(e) => setBillSubmittedDate(e.target.value)} disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Remarks</label>
            <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
        </div>
      </div>

      {/* ABSTRACT */}
      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-700">Abstract</h2>
        <p className="mb-4 text-sm text-slate-400">
          Imported automatically from the Measurement Book — never re-entered.{" "}
          {!initialData && "Previous/Total Quantity and Amount are computed on save (cumulative across every earlier Running Bill for this project)."}
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-2 text-left">Item No.</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-left">Unit</th>
                <th className="px-2 py-2 text-right">Prev Qty</th>
                <th className="px-2 py-2 text-right">Curr Qty</th>
                <th className="px-2 py-2 text-right">Total Qty</th>
                <th className="px-2 py-2 text-right">BOQ Rate</th>
                <th className="px-2 py-2 text-right">Payment %</th>
                <th className="px-2 py-2 text-right">Eff. Rate</th>
                <th className="px-2 py-2 text-right">Curr Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-2">{item.boqItemNo}</td>
                  <td className="px-2 py-2">{item.boqDescription}</td>
                  <td className="px-2 py-2">{item.unit}</td>
                  <td className="px-2 py-2 text-right text-slate-500">{item.previousQuantity ?? "computed on save"}</td>
                  <td className="px-2 py-2 text-right font-medium">{Number(item.currentQuantity).toFixed(4)}</td>
                  <td className="px-2 py-2 text-right text-slate-500">{item.totalQuantity ?? "computed on save"}</td>
                  <td className="px-2 py-2 text-right">₹{Number(item.boqRate).toLocaleString("en-IN")}</td>
                  <td className="px-2 py-2 text-right">{Number(item.paymentPercent)}%</td>
                  <td className="px-2 py-2 text-right">₹{Number(item.effectiveRate).toLocaleString("en-IN")}</td>
                  <td className="px-2 py-2 text-right font-medium">₹{Number(item.currentAmount).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              <tr className="border-t bg-slate-50 font-bold">
                <td className="p-2" colSpan={9}>Current Certified Amount</td>
                <td className="p-2 text-right">₹{currentCertifiedAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DEDUCTIONS */}
      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-700">Deductions</h2>
        <p className="mb-4 text-sm text-slate-400">Standard recoveries plus unlimited custom deductions.</p>
        <div className="space-y-3">
          {deductions.map((d, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-5">
              <select value={d.type} onChange={(e) => updateDeduction(i, { type: e.target.value, label: "" })} disabled={isLocked} className="rounded-lg border p-2 disabled:bg-slate-50">
                {DEDUCTION_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{DEDUCTION_TYPE_LABELS[t]}</option>)}
              </select>
              <input
                type="text"
                placeholder={d.type === "OTHER" ? "Custom label" : DEDUCTION_TYPE_LABELS[d.type]}
                value={d.label}
                onChange={(e) => updateDeduction(i, { label: e.target.value })}
                disabled={isLocked}
                className="rounded-lg border p-2 disabled:bg-slate-50 md:col-span-2"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={d.amount}
                onChange={(e) => updateDeduction(i, { amount: Number(e.target.value) || 0 })}
                disabled={isLocked}
                className="rounded-lg border p-2 text-right disabled:bg-slate-50"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Remarks"
                  value={d.remarks}
                  onChange={(e) => updateDeduction(i, { remarks: e.target.value })}
                  disabled={isLocked}
                  className="flex-1 rounded-lg border p-2 disabled:bg-slate-50"
                />
                {!isLocked && (
                  <button type="button" onClick={() => removeDeduction(i)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!isLocked && (
            <button type="button" onClick={addDeduction} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              <Plus className="h-4 w-4" /> Add Deduction
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Current Certified Amount</span><span className="font-medium">₹{currentCertifiedAmount.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Total Deductions</span><span className="font-medium text-red-600">− ₹{totalDeductions.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Net Payable</span><span>₹{netPayable.toLocaleString("en-IN")}</span></div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving || isLocked} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save Running Bill"}
        </button>
      </div>
    </form>
  );
}
