import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

import Layout from "../../components/layout/Layout";
import { getSite } from "../../services/sites";
import type { Site } from "../../services/sites";
import {
  getNextRABillDraft,
  createRunningBillFromForm58,
  BILL_TYPE_OPTIONS,
  BILL_TYPE_LABELS,
  DEDUCTION_TYPE_OPTIONS,
  DEDUCTION_TYPE_LABELS,
} from "../../services/running-bills";
import type { NextRABillDraft, Form58ItemInput, RunningBillDeductionInput } from "../../services/running-bills";
import { todayISO, formatCurrency as inr } from "../../lib/utils";

interface Row {
  siteBillItemId?: string;
  itemNo: string;
  description: string;
  unit: string;
  rate: number;
  previousQuantity: number;
  currentQuantity: number;
  isNew: boolean;
}

function emptyNewRow(): Row {
  return { itemNo: "", description: "", unit: "", rate: 0, previousQuantity: 0, currentQuantity: 0, isNew: true };
}

export default function AddRunningBillForm58() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const siteId = searchParams.get("siteId") || "";

  const [site, setSite] = useState<Site | null>(null);
  const [draft, setDraft] = useState<NextRABillDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);
  const [billNumber, setBillNumber] = useState("");
  const [billType, setBillType] = useState("RA_BILL");
  const [billDate, setBillDate] = useState(todayISO());
  const [billPeriodFrom, setBillPeriodFrom] = useState("");
  const [billPeriodTo, setBillPeriodTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [deductions, setDeductions] = useState<RunningBillDeductionInput[]>([]);

  useEffect(() => {
    if (!siteId) {
      setError("No Site selected. Open this page from a Site's Running Bills tab.");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getSite(siteId), getNextRABillDraft(siteId)])
      .then(([siteData, draftData]) => {
        setSite(siteData);
        setDraft(draftData);
        setBillNumber(draftData.suggestedBillNumber);
        setRows(
          draftData.items.map((i) => ({
            siteBillItemId: i.siteBillItemId,
            itemNo: i.itemNo,
            description: i.description,
            unit: i.unit,
            rate: Number(i.rate),
            previousQuantity: Number(i.previousQuantity),
            currentQuantity: 0,
            isNew: false,
          }))
        );
      })
      .catch(() => setError("Failed to load the next RA Bill draft for this Site."))
      .finally(() => setLoading(false));
  }, [siteId]);

  const updateRow = (i: number, patch: Partial<Row>) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addNewRow = () => setRows((r) => [...r, emptyNewRow()]);
  const removeNewRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const updateDeduction = (i: number, patch: Partial<RunningBillDeductionInput>) => setDeductions((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addDeduction = () => setDeductions((d) => [...d, { type: "OTHER", label: "", amount: 0, remarks: "" }]);
  const removeDeduction = (i: number) => setDeductions((d) => d.filter((_, idx) => idx !== i));

  const totals = useMemo(() => {
    let grossAmount = 0;
    for (const r of rows) grossAmount += Math.round(r.currentQuantity * r.rate * 100) / 100;
    const totalDeductions = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    return { grossAmount, totalDeductions, netPayable: grossAmount - totalDeductions };
  }, [rows, deductions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    for (const r of rows) {
      if (r.isNew && (!r.description.trim() || !r.unit.trim())) {
        setError("Every new item needs a Description and Unit.");
        return;
      }
    }
    const items: Form58ItemInput[] = rows.map((r) =>
      r.siteBillItemId
        ? { siteBillItemId: r.siteBillItemId, currentQuantity: r.currentQuantity }
        : { itemNo: r.itemNo || undefined, description: r.description, unit: r.unit, rate: r.rate, currentQuantity: r.currentQuantity }
    );

    try {
      setSaving(true);
      const bill = await createRunningBillFromForm58({
        siteId,
        billNumber: billNumber || undefined,
        billType,
        billDate,
        billPeriodFrom: billPeriodFrom || undefined,
        billPeriodTo: billPeriodTo || undefined,
        remarks: remarks || undefined,
        items,
        deductions: deductions.length ? deductions : undefined,
      });
      navigate(`/running-bills/${bill.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create RA Bill.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error && !draft) return <Layout><div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New RA Bill — {site?.name}</h1>
          <p className="mt-2 text-slate-500">
            {draft?.isFirstBill
              ? "First RA Bill for this Site — the items entered here become the Site's Bill Item Master and are auto-included on every future bill."
              : `RA Bill ${draft?.nextRaSequence} — every item from the previous bill is carried forward automatically. Only enter Current Quantity.`}
          </p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-700">General</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block font-medium">RA Bill No.</label>
                <input type="text" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} className="w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="mb-2 block font-medium">Bill Type *</label>
                <select value={billType} onChange={(e) => setBillType(e.target.value)} required className="w-full rounded-lg border p-3">
                  {BILL_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{BILL_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block font-medium">Bill Date *</label>
                <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} required className="w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="mb-2 block font-medium">Bill Period From</label>
                <input type="date" value={billPeriodFrom} onChange={(e) => setBillPeriodFrom(e.target.value)} className="w-full rounded-lg border p-3" />
              </div>
              <div>
                <label className="mb-2 block font-medium">Bill Period To</label>
                <input type="date" value={billPeriodTo} onChange={(e) => setBillPeriodTo(e.target.value)} className="w-full rounded-lg border p-3" />
              </div>
              <div className="md:col-span-3">
                <label className="mb-2 block font-medium">Remarks</label>
                <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-lg border p-3" />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700">Form 58 — Item of Work</h2>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Existing items only need Current Quantity — Description, Unit, Rate, and Previous Quantity are locked. Leave Current Quantity at 0 for anything not worked on this period.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-2 py-2 text-left">Item No.</th>
                    <th className="px-2 py-2 text-left">Description</th>
                    <th className="px-2 py-2 text-left">Unit</th>
                    <th className="px-2 py-2 text-right">Rate</th>
                    <th className="px-2 py-2 text-right">Previous Qty</th>
                    <th className="px-2 py-2 text-right">Current Qty</th>
                    <th className="px-2 py-2 text-right">Up To Date Qty</th>
                    <th className="px-2 py-2 text-right">Now To Pay</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const totalQty = row.previousQuantity + (Number(row.currentQuantity) || 0);
                    const nowToPay = Math.round((Number(row.currentQuantity) || 0) * row.rate * 100) / 100;
                    return (
                      <tr key={i} className="border-t">
                        <td className="p-1">
                          {row.isNew ? (
                            <input value={row.itemNo} onChange={(e) => updateRow(i, { itemNo: e.target.value })} placeholder={String(i + 1)} className="w-16 rounded border p-1.5" />
                          ) : (
                            <span className="px-1.5">{row.itemNo}</span>
                          )}
                        </td>
                        <td className="p-1">
                          {row.isNew ? (
                            <input value={row.description} onChange={(e) => updateRow(i, { description: e.target.value })} placeholder="Item description" className="w-48 rounded border p-1.5" />
                          ) : (
                            <span className="px-1.5">{row.description}</span>
                          )}
                        </td>
                        <td className="p-1">
                          {row.isNew ? (
                            <input value={row.unit} onChange={(e) => updateRow(i, { unit: e.target.value })} placeholder="Unit" className="w-16 rounded border p-1.5" />
                          ) : (
                            <span className="px-1.5">{row.unit}</span>
                          )}
                        </td>
                        <td className="p-1 text-right">
                          {row.isNew ? (
                            <input type="number" min={0} step="0.01" value={row.rate} onChange={(e) => updateRow(i, { rate: Number(e.target.value) || 0 })} className="w-24 rounded border p-1.5 text-right" />
                          ) : (
                            <span className="px-1.5">{inr(row.rate)}</span>
                          )}
                        </td>
                        <td className="p-1 text-right text-slate-500">{row.previousQuantity.toFixed(4)}</td>
                        <td className="p-1">
                          <input
                            type="number" min={0} step="0.0001"
                            value={row.currentQuantity}
                            onChange={(e) => updateRow(i, { currentQuantity: Number(e.target.value) || 0 })}
                            className="w-24 rounded border p-1.5 text-right"
                          />
                        </td>
                        <td className="p-1 text-right font-medium text-slate-600">{totalQty.toFixed(4)}</td>
                        <td className="p-1 text-right font-medium text-slate-600">{inr(nowToPay)}</td>
                        <td className="p-1">
                          {row.isNew && (
                            <button type="button" onClick={() => removeNewRow(i)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addNewRow} className="mt-3 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              <Plus className="h-4 w-4" /> Add New Item
            </button>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-slate-700">Deductions</h2>
            <p className="mb-4 text-sm text-slate-400">GST State/Central, Income Tax, Security Deposit, Royalty, Insurance, Fine, Labour Cess, Mobilization Recovery, TDS, or Other.</p>
            <div className="space-y-3">
              {deductions.map((d, i) => (
                <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-5">
                  <select value={d.type} onChange={(e) => updateDeduction(i, { type: e.target.value, label: "" })} className="rounded-lg border p-2">
                    {DEDUCTION_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{DEDUCTION_TYPE_LABELS[t]}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder={d.type === "OTHER" ? "Custom label" : DEDUCTION_TYPE_LABELS[d.type]}
                    value={d.label ?? ""}
                    onChange={(e) => updateDeduction(i, { label: e.target.value })}
                    className="rounded-lg border p-2 md:col-span-2"
                  />
                  <input
                    type="number" min={0} step="0.01"
                    value={d.amount}
                    onChange={(e) => updateDeduction(i, { amount: Number(e.target.value) || 0 })}
                    className="rounded-lg border p-2 text-right"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text" placeholder="Remarks"
                      value={d.remarks ?? ""}
                      onChange={(e) => updateDeduction(i, { remarks: e.target.value })}
                      className="flex-1 rounded-lg border p-2"
                    />
                    <button type="button" onClick={() => removeDeduction(i)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addDeduction} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
                <Plus className="h-4 w-4" /> Add Deduction
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-700">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Gross Amount</span><span className="font-medium">{inr(totals.grossAmount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total Deductions</span><span className="font-medium text-red-600">− {inr(totals.totalDeductions)}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Net Payable</span><span>{inr(totals.netPayable)}</span></div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate(-1)} className="rounded-lg border px-6 py-3">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save RA Bill"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
