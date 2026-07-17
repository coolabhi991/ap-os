import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, ListChecks } from "lucide-react";

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
import { getSiteBoqItems } from "../../services/site-boq-items";
import type { SiteBoqItem } from "../../services/site-boq-items";
import { todayISO, formatCurrency as inr } from "../../lib/utils";

interface Row {
  siteBillItemId?: string;
  itemNo: string;
  description: string;
  unit: string;
  rate: number;
  subWorkId: string;
  subWorkName: string;
  previousQuantity: number;
  currentQuantity: number;
  remarks: string;
  isNew: boolean;
  // Set only for rows populated via "Import From BOQ" — description/unit/rate came from a BOQ
  // item and stay read-only, exactly like an existing Bill Item Master row. Purely a client-side
  // data-entry shortcut: submitted through the identical "new item" payload shape as a manual
  // row, so Form 58 calculations/backend are untouched either way.
  locked?: boolean;
}

function emptyNewRow(subWorkId: string, subWorkName: string): Row {
  return { itemNo: "", description: "", unit: "", rate: 0, subWorkId, subWorkName, previousQuantity: 0, currentQuantity: 0, remarks: "", isNew: true };
}

function rowFromBoqItem(boqItem: SiteBoqItem, subWorkId: string, subWorkName: string): Row {
  return {
    itemNo: "",
    description: boqItem.description,
    unit: boqItem.unit,
    rate: Number(boqItem.rate),
    subWorkId,
    subWorkName,
    previousQuantity: 0,
    currentQuantity: 0,
    remarks: "",
    isNew: true,
    locked: true,
  };
}

/** Bill Types share the auto-numbering prefix pattern (ADV/RA/FINAL-<seq>) — mirrors billTypePrefix in running-bill.service.ts, kept in sync by hand since bill number generation is intentionally client-previewed before Save. */
function billTypePrefix(billType: string): string {
  if (billType === "ADVANCE_BILL") return "ADV";
  if (billType === "FINAL_BILL") return "FINAL";
  return "RA";
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
  const [billNumberTouched, setBillNumberTouched] = useState(false);
  const [billType, setBillType] = useState("RA_BILL");
  const [billDate, setBillDate] = useState(todayISO());
  const [billSubmittedDate, setBillSubmittedDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [deductions, setDeductions] = useState<RunningBillDeductionInput[]>([]);
  const [gstDifferencePercent, setGstDifferencePercent] = useState(0);

  // BOQ is optional — an empty array here (no BOQ for this Site) simply means every Sub Work's
  // "Import From BOQ" button stays disabled and the page behaves exactly as it always has.
  const [boqItems, setBoqItems] = useState<SiteBoqItem[]>([]);
  const [boqPickerSubWorkId, setBoqPickerSubWorkId] = useState<string | null>(null);
  const [boqPickerSelected, setBoqPickerSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!siteId) {
      setError("No Site selected. Open this page from a Site's Running Bills tab.");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getSite(siteId), getNextRABillDraft(siteId), getSiteBoqItems(siteId)])
      .then(([siteData, draftData, boqData]) => {
        setSite(siteData);
        setDraft(draftData);
        setBoqItems(boqData);
        setBillNumber(draftData.suggestedBillNumber);
        setRows(
          draftData.items.map((i) => ({
            siteBillItemId: i.siteBillItemId,
            itemNo: i.itemNo,
            description: i.description,
            unit: i.unit,
            rate: Number(i.rate),
            subWorkId: i.subWorkId,
            subWorkName: i.subWorkName,
            previousQuantity: Number(i.previousQuantity),
            currentQuantity: 0,
            remarks: "",
            isNew: false,
          }))
        );
      })
      .catch(() => setError("Failed to load the next RA Bill draft for this Site."))
      .finally(() => setLoading(false));
  }, [siteId]);

  // Bill Type determines the auto-generated Bill No. prefix (ADV-/RA-/FINAL-) — regenerated
  // whenever Bill Type changes, unless the user has already typed their own number.
  useEffect(() => {
    if (!draft || billNumberTouched) return;
    setBillNumber(`${billTypePrefix(billType)}-${draft.nextRaSequence}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billType, draft]);

  const updateRow = (i: number, patch: Partial<Row>) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addNewRow = (subWorkId: string, subWorkName: string) => setRows((r) => [...r, emptyNewRow(subWorkId, subWorkName)]);
  const removeNewRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const boqItemsBySubWork = useMemo(() => {
    const map = new Map<string, SiteBoqItem[]>();
    for (const item of boqItems) {
      if (!map.has(item.subWorkId)) map.set(item.subWorkId, []);
      map.get(item.subWorkId)!.push(item);
    }
    return map;
  }, [boqItems]);

  const openBoqPicker = (subWorkId: string) => {
    setBoqPickerSubWorkId(subWorkId);
    setBoqPickerSelected(new Set());
  };
  const closeBoqPicker = () => {
    setBoqPickerSubWorkId(null);
    setBoqPickerSelected(new Set());
  };
  const toggleBoqSelection = (id: string) =>
    setBoqPickerSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const importSelectedBoqItems = (subWorkId: string, subWorkName: string) => {
    const selectedItems = (boqItemsBySubWork.get(subWorkId) ?? []).filter((i) => boqPickerSelected.has(i.id));
    setRows((r) => [...r, ...selectedItems.map((i) => rowFromBoqItem(i, subWorkId, subWorkName))]);
    closeBoqPicker();
  };

  const updateDeduction = (i: number, patch: Partial<RunningBillDeductionInput>) => setDeductions((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addDeduction = () => setDeductions((d) => [...d, { type: "OTHER", label: "", amount: 0, remarks: "" }]);
  const removeDeduction = (i: number) => setDeductions((d) => d.filter((_, idx) => idx !== i));

  // Every Sub Work always originates from the Recapitulation Register (draft.subWorks) — every
  // Sub Work gets its own section, even ones with zero items so far, so an item can never be
  // added without already belonging to a real Sub Work. There is no "Unassigned" bucket.
  const groups = useMemo(() => {
    if (!draft) return [];
    return draft.subWorks.map((sw) => ({
      subWorkId: sw.id,
      subWorkName: sw.name,
      rows: rows.map((row, index) => ({ row, index })).filter(({ row }) => row.subWorkId === sw.id),
    }));
  }, [draft, rows]);

  const totals = useMemo(() => {
    const grandTotalOfItems = rows.reduce((s, r) => s + Math.round(r.currentQuantity * r.rate * 100) / 100, 0);
    const tenderPercent = Number(draft?.tenderAboveBelowPercent ?? 0);
    const gstPercent = Number(draft?.gstPercent ?? 0);
    const tenderAdjustmentAmount = Math.round(grandTotalOfItems * (tenderPercent / 100) * 100) / 100;
    const adjustedTotal = Math.round((grandTotalOfItems + tenderAdjustmentAmount) * 100) / 100;
    const gstAmount = Math.round(adjustedTotal * (gstPercent / 100) * 100) / 100;
    const gstDifferenceAmount = Math.round(adjustedTotal * (gstDifferencePercent / 100) * 100) / 100;
    const totalGstAmount = Math.round((gstAmount + gstDifferenceAmount) * 100) / 100;
    const grossBillAmount = Math.round((adjustedTotal + totalGstAmount) * 100) / 100;
    const finalBillAmount = Math.round(grossBillAmount);
    const roundOff = Math.round((finalBillAmount - grossBillAmount) * 100) / 100;
    const totalDeductions = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const netPayable = Math.round((finalBillAmount - totalDeductions) * 100) / 100;
    return {
      grandTotalOfItems, tenderPercent, gstPercent, tenderAdjustmentAmount, adjustedTotal,
      gstAmount, gstDifferenceAmount, totalGstAmount, grossBillAmount, finalBillAmount, roundOff, totalDeductions, netPayable,
    };
  }, [rows, deductions, draft, gstDifferencePercent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (draft?.isBillingCompleted) {
      setError("This Site's billing is Completed — a Final Bill has already been raised.");
      return;
    }
    for (const r of rows) {
      if (r.isNew && (!r.description.trim() || !r.unit.trim())) {
        setError("Every new item needs a Description and Unit.");
        return;
      }
    }
    const items: Form58ItemInput[] = rows.map((r) =>
      r.siteBillItemId
        ? { siteBillItemId: r.siteBillItemId, currentQuantity: r.currentQuantity, remarks: r.remarks || undefined }
        : { itemNo: r.itemNo || undefined, description: r.description, unit: r.unit, rate: r.rate, currentQuantity: r.currentQuantity, remarks: r.remarks || undefined, subWorkId: r.subWorkId || undefined }
    );

    try {
      setSaving(true);
      const bill = await createRunningBillFromForm58({
        siteId,
        billNumber: billNumber || undefined,
        billType,
        billDate,
        billSubmittedDate: billSubmittedDate || undefined,
        remarks: remarks || undefined,
        items,
        deductions: deductions.length ? deductions : undefined,
        gstDifferencePercent: gstDifferencePercent || undefined,
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
              ? "First RA Bill for this Site — items entered here become the Site's Bill Item Master and are auto-included on every future bill."
              : `RA Bill ${draft?.nextRaSequence} — every item from the previous bill is carried forward automatically. Only enter Current Quantity.`}
          </p>
        </div>

        {draft?.isBillingCompleted && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-4 text-amber-800">
            <strong>Billing Completed</strong> — a Final Bill has already been raised for this Site. No further bills can be created unless it is cancelled.
          </div>
        )}

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
          <fieldset disabled={!!draft?.isBillingCompleted} className="space-y-8 disabled:opacity-60">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-700">General</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block font-medium">Bill No.</label>
                <input
                  type="text"
                  value={billNumber}
                  onChange={(e) => { setBillNumber(e.target.value); setBillNumberTouched(true); }}
                  className="w-full rounded-lg border p-3"
                />
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
                <label className="mb-2 block font-medium">Bill Submitted Date</label>
                <input type="date" value={billSubmittedDate} onChange={(e) => setBillSubmittedDate(e.target.value)} className="w-full rounded-lg border p-3" />
              </div>
              <div className="md:col-span-2">
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
              Every Sub Work comes from the Recapitulation Register. Existing items only need Current Quantity — Description, Unit, Rate, and Previous Quantity are locked.
              Leave Current Quantity at 0 for anything not worked on this period; a Sub Work with no work this period is left out of the saved bill entirely.
            </p>
            <div className="space-y-6">
              {groups.map((group, groupIndex) => {
                const groupCurrent = group.rows.reduce((s, { row }) => s + Math.round(row.currentQuantity * row.rate * 100) / 100, 0);
                const groupPrevious = group.rows.reduce((s, { row }) => s + Math.round(row.previousQuantity * row.rate * 100) / 100, 0);
                const groupUpToDate = group.rows.reduce((s, { row }) => s + Math.round((row.previousQuantity + row.currentQuantity) * row.rate * 100) / 100, 0);
                return (
                  <div key={group.subWorkId} className="overflow-hidden rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between bg-slate-800 px-3 py-2 text-sm font-semibold text-white">
                      <span>Sub Work No. {groupIndex + 1} : {group.subWorkName}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openBoqPicker(group.subWorkId)}
                          disabled={!(boqItemsBySubWork.get(group.subWorkId)?.length)}
                          title={boqItemsBySubWork.get(group.subWorkId)?.length ? "" : "No BOQ items for this Sub Work"}
                          className="flex items-center gap-1 rounded border border-white/40 px-2 py-1 text-xs hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ListChecks className="h-3 w-3" /> Import From BOQ
                        </button>
                        <button type="button" onClick={() => addNewRow(group.subWorkId, group.subWorkName)} className="flex items-center gap-1 rounded border border-white/40 px-2 py-1 text-xs hover:bg-white/10">
                          <Plus className="h-3 w-3" /> Manual Entry
                        </button>
                      </div>
                    </div>

                    {boqPickerSubWorkId === group.subWorkId && (
                      <div className="border-b border-slate-200 bg-blue-50/60 p-4">
                        <p className="mb-2 text-sm font-medium text-slate-700">Import From BOQ — {group.subWorkName}</p>
                        <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                          {(boqItemsBySubWork.get(group.subWorkId) ?? []).map((boqItem) => (
                            <label key={boqItem.id} className="flex items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                              <input type="checkbox" checked={boqPickerSelected.has(boqItem.id)} onChange={() => toggleBoqSelection(boqItem.id)} />
                              <span className="min-w-0 flex-1 truncate">{boqItem.description}</span>
                              <span className="w-16 shrink-0 text-slate-500">{boqItem.unit}</span>
                              <span className="w-24 shrink-0 text-right text-slate-500">{inr(boqItem.rate)}</span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => importSelectedBoqItems(group.subWorkId, group.subWorkName)}
                            disabled={boqPickerSelected.size === 0}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Import Selected ({boqPickerSelected.size})
                          </button>
                          <button type="button" onClick={closeBoqPicker} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
                        </div>
                      </div>
                    )}

                    {group.rows.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-slate-400">No items yet in this Sub Work — use "Import From BOQ" or "Manual Entry" to add the first one.</p>
                    ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-2 py-2 text-left">Item No.</th>
                            <th className="px-2 py-2 text-left">Description</th>
                            <th className="px-2 py-2 text-left">Unit</th>
                            <th className="px-2 py-2 text-right">Rate</th>
                            <th className="px-2 py-2 text-right">Previous Qty</th>
                            <th className="px-2 py-2 text-right">Current Qty</th>
                            <th className="px-2 py-2 text-right">Current Amount</th>
                            <th className="px-2 py-2 text-right">Previous Amount</th>
                            <th className="px-2 py-2 text-right">Up To Date Amount</th>
                            <th className="px-2 py-2 text-right">Now To Pay</th>
                            <th className="px-2 py-2 text-left">Remarks</th>
                            <th className="px-2 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map(({ row, index: i }) => {
                            const totalQty = row.previousQuantity + (Number(row.currentQuantity) || 0);
                            const currentAmount = Math.round((Number(row.currentQuantity) || 0) * row.rate * 100) / 100;
                            const previousAmount = Math.round(row.previousQuantity * row.rate * 100) / 100;
                            const upToDateAmount = Math.round(totalQty * row.rate * 100) / 100;
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
                                  {row.isNew && !row.locked ? (
                                    <input value={row.description} onChange={(e) => updateRow(i, { description: e.target.value })} placeholder="Item description" className="w-48 rounded border p-1.5" />
                                  ) : (
                                    <span className="px-1.5">
                                      {row.description}
                                      {row.locked && <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">BOQ</span>}
                                    </span>
                                  )}
                                </td>
                                <td className="p-1">
                                  {row.isNew && !row.locked ? (
                                    <input value={row.unit} onChange={(e) => updateRow(i, { unit: e.target.value })} placeholder="Unit" className="w-16 rounded border p-1.5" />
                                  ) : (
                                    <span className="px-1.5">{row.unit}</span>
                                  )}
                                </td>
                                <td className="p-1 text-right">
                                  {row.isNew && !row.locked ? (
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
                                <td className="p-1 text-right font-medium text-slate-600">{inr(currentAmount)}</td>
                                <td className="p-1 text-right text-slate-500">{inr(previousAmount)}</td>
                                <td className="p-1 text-right text-slate-500">{inr(upToDateAmount)}</td>
                                <td className="p-1 text-right font-medium text-slate-600">{inr(currentAmount)}</td>
                                <td className="p-1">
                                  <input value={row.remarks} onChange={(e) => updateRow(i, { remarks: e.target.value })} placeholder="Remarks" className="w-32 rounded border p-1.5" />
                                </td>
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
                        <tfoot>
                          <tr className="border-t bg-slate-50 font-semibold">
                            <td colSpan={6} className="px-2 py-2 text-right">Sub Work Total</td>
                            <td className="px-2 py-2 text-right">{inr(groupCurrent)}</td>
                            <td className="px-2 py-2 text-right">{inr(groupPrevious)}</td>
                            <td className="px-2 py-2 text-right">{inr(groupUpToDate)}</td>
                            <td colSpan={3}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    )}
                  </div>
                );
              })}
              {groups.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  No Sub Works found for this Site — add Sub Works via the Recapitulation Register first, then return here to bill their items.
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-slate-700">Deductions</h2>
            <p className="mb-4 text-sm text-slate-400">Security Deposit, GST TDS, Income Tax, Royalty, Labour Cess, Insurance, Mobilization Recovery, MSEB, Fine, or Other.</p>
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
            <h2 className="mb-4 text-lg font-semibold text-slate-700">Summary — Form 58 Calculation Flow</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Grand Total of Items</span><span className="font-medium">{inr(totals.grandTotalOfItems)}</span></div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tender Above/Below Adjustment ({totals.tenderPercent >= 0 ? "+" : ""}{totals.tenderPercent}% — from Work Order)</span>
                <span className="font-medium">{inr(totals.tenderAdjustmentAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2"><span className="text-slate-500">Adjusted Total</span><span className="font-medium">{inr(totals.adjustedTotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">GST ({totals.gstPercent}% — from Work Order)</span><span className="font-medium">{inr(totals.gstAmount)}</span></div>
              <div className="flex items-center justify-between">
                <label className="text-slate-500">GST Difference (%) <span className="text-xs text-slate-400">— when Government billing GST differs from Work Order</span></label>
                <input
                  type="number" step="0.01"
                  value={gstDifferencePercent}
                  onChange={(e) => setGstDifferencePercent(Number(e.target.value) || 0)}
                  className="w-24 rounded border p-1.5 text-right"
                />
              </div>
              {gstDifferencePercent !== 0 && (
                <div className="flex justify-between"><span className="text-slate-500">GST Difference Amount</span><span className="font-medium">{inr(totals.gstDifferenceAmount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-slate-500">Total GST</span><span className="font-medium">{inr(totals.totalGstAmount)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="text-slate-500">Gross Bill Amount</span><span className="font-medium">{inr(totals.grossBillAmount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Round Off</span><span className="font-medium">{inr(totals.roundOff)}</span></div>
              <div className="flex justify-between border-t pt-2 font-semibold"><span>Final Bill Amount</span><span>{inr(totals.finalBillAmount)}</span></div>
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
          </fieldset>
        </form>
      </div>
    </Layout>
  );
}
