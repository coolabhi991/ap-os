import { Fragment, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download, AlertTriangle } from "lucide-react";
import type { MB, MBFormData, MBItemInput, MBFieldAudit } from "../../services/measurement-books";
import { MB_STATUS_OPTIONS, MB_STATUS_LABELS, PAYMENT_PERCENT_PRESETS, getMBRowsFromRecapitulation, getMBFieldAudits } from "../../services/measurement-books";
import { getSubWorks } from "../../services/sub-works";
import type { SubWork } from "../../services/sub-works";
import { getSites } from "../../services/sites";
import type { Site } from "../../services/sites";
import { todayISO, formatCurrency as inr } from "../../lib/utils";
import EmptyTableRow from "../ui/EmptyTableRow";

interface Option {
  id: string;
  name: string;
}

interface Props {
  initialData?: MB;
  onSubmit: (data: MBFormData) => void;
  saving?: boolean;
  projects: Option[];
  contractors: Option[];
  engineers: Option[];
}

interface ItemRow extends Omit<MBItemInput, "length" | "breadth" | "height" | "currentQuantity" | "previousQuantity"> {
  length: number | "";
  breadth: number | "";
  height: number | "";
  currentQuantity: number | "";
  paymentPercent: number;
  previousQuantity: number;
  // The Previous Qty / Rate the row started with (auto carry-forward or as-loaded) — used to
  // detect a Government-revision edit and require a reason before saving.
  basePreviousQuantity: number;
  baseRate: number;
}

function calcRow(row: ItemRow) {
  const length = row.length === "" ? undefined : Number(row.length);
  const breadth = row.breadth === "" ? undefined : Number(row.breadth);
  const height = row.height === "" ? undefined : Number(row.height);

  let quantity = 0;
  if (length !== undefined) {
    if (breadth !== undefined && height !== undefined) quantity = length * breadth * height;
    else if (breadth !== undefined) quantity = length * breadth;
    else quantity = length;
  } else if (row.currentQuantity !== "" && row.currentQuantity !== undefined) {
    quantity = Number(row.currentQuantity);
  }
  const effectiveRate = Math.round((row.boqRate || 0) * (row.paymentPercent / 100) * 100) / 100;
  const amount = Math.round(quantity * effectiveRate * 100) / 100;
  const totalQuantity = row.previousQuantity + quantity;
  const totalAmount = Math.round(totalQuantity * effectiveRate * 100) / 100;
  return { quantity, effectiveRate, amount, totalQuantity, totalAmount };
}

function emptyRow(): ItemRow {
  return {
    boqItemNo: "", boqDescription: "", unit: "", length: "", breadth: "", height: "", currentQuantity: "",
    boqRate: 0, paymentPercent: 100, remarks: "", previousQuantity: 0, basePreviousQuantity: 0, baseRate: 0,
  };
}

export default function MBForm({ initialData, onSubmit, saving = false, projects, contractors, engineers }: Props) {
  const isLocked = initialData?.status === "APPROVED";

  const [projectId, setProjectId] = useState(initialData?.projectId ?? "");
  const [siteId, setSiteId] = useState(initialData?.siteId ?? "");
  const [subWorkId, setSubWorkId] = useState(initialData?.subWorkId ?? "");
  const [mbNumber, setMbNumber] = useState(initialData?.mbNumber ?? "");
  const [raBillNumber, setRaBillNumber] = useState(initialData?.raBillNumber ?? "");
  const [mbDate, setMbDate] = useState(initialData?.mbDate ?? todayISO());
  const [site, setSite] = useState(initialData?.site ?? "");
  const [engineerId, setEngineerId] = useState(initialData?.engineerId ?? "");
  const [contractorId, setContractorId] = useState(initialData?.contractorId ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");
  const [remarks, setRemarks] = useState(initialData?.remarks ?? "");
  const [abstractPdfUrl, setAbstractPdfUrl] = useState(initialData?.abstractPdfUrl ?? "");
  const [abstractPdfName, setAbstractPdfName] = useState(initialData?.abstractPdfName ?? "");
  const [sourceRecapRevisionId, setSourceRecapRevisionId] = useState(initialData?.sourceRecapRevisionId ?? "");

  const [subWorks, setSubWorks] = useState<SubWork[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingFromRecap, setLoadingFromRecap] = useState(false);
  const [auditHistory, setAuditHistory] = useState<MBFieldAudit[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [rows, setRows] = useState<ItemRow[]>(
    initialData?.items.length
      ? initialData.items.map((i) => ({
          boqItemNo: i.boqItemNo,
          boqDescription: i.boqDescription,
          unit: i.unit,
          subWorkId: i.subWorkId || undefined,
          length: i.length ? Number(i.length) : "",
          breadth: i.breadth ? Number(i.breadth) : "",
          height: i.height ? Number(i.height) : "",
          currentQuantity: i.length ? "" : Number(i.quantity),
          boqRate: Number(i.boqRate),
          paymentPercent: Number(i.paymentPercent),
          remarks: i.remarks,
          previousQuantity: Number(i.previousQuantity),
          basePreviousQuantity: Number(i.previousQuantity),
          baseRate: Number(i.boqRate),
        }))
      : [emptyRow()]
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setSubWorks([]);
      return;
    }
    getSubWorks(projectId).then(setSubWorks).catch(() => setSubWorks([]));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setSites([]);
      return;
    }
    getSites(projectId).then((result) => {
      setSites(result);
      if (result.length === 1) setSiteId(result[0].id);
    }).catch(() => setSites([]));
  }, [projectId]);

  useEffect(() => {
    if (!initialData?.id) return;
    getMBFieldAudits(initialData.id).then(setAuditHistory).catch(() => {});
  }, [initialData?.id]);

  const updateRow = (i: number, patch: Partial<ItemRow>) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addRow = () => setRows((r) => [...r, emptyRow()]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const handleLoadFromRecap = async () => {
    if (!siteId) return setError("Select a Site first.");
    setLoadingFromRecap(true);
    setError(null);
    try {
      const draft = await getMBRowsFromRecapitulation(siteId);
      setSourceRecapRevisionId(draft.sourceRecapRevisionId);
      setRows(
        draft.items.map((it) => ({
          boqItemNo: it.boqItemNo,
          boqDescription: it.boqDescription,
          unit: it.unit,
          subWorkId: it.subWorkId || undefined,
          length: "",
          breadth: "",
          height: "",
          currentQuantity: Number(it.currentQuantity),
          boqRate: Number(it.boqRate),
          paymentPercent: 100,
          remarks: "",
          previousQuantity: Number(it.previousQuantity),
          basePreviousQuantity: Number(it.previousQuantity),
          baseRate: Number(it.boqRate),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rows from Recapitulation.");
    } finally {
      setLoadingFromRecap(false);
    }
  };

  const totals = useMemo(() => {
    let quantity = 0;
    let amount = 0;
    rows.forEach((r) => {
      const c = calcRow(r);
      quantity += c.quantity;
      amount += c.amount;
    });
    return { quantity, amount };
  }, [rows]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return setError("This Measurement Book is Approved and can no longer be edited.");
    if (!projectId) return setError("Select a project.");
    if (!siteId) return setError("Select a site.");
    if (!mbNumber.trim()) return setError("MB Number is required.");
    for (const r of rows) {
      if (!r.boqItemNo.trim() || !r.boqDescription.trim() || !r.unit.trim()) {
        return setError("Every abstract row needs a BOQ Item No., Description, and Unit.");
      }
      const previousChanged = Math.abs(r.previousQuantity - r.basePreviousQuantity) > 0.0001;
      const rateChanged = Math.abs((Number(r.boqRate) || 0) - r.baseRate) > 0.0001 && r.baseRate > 0;
      if ((previousChanged || rateChanged) && !r.fieldChangeReason?.trim()) {
        return setError(`Row "${r.boqItemNo}": Previous Qty or Rate was changed — a reason is required.`);
      }
    }

    setError(null);
    onSubmit({
      projectId,
      siteId,
      subWorkId: subWorkId || undefined,
      mbNumber: mbNumber.trim(),
      raBillNumber: raBillNumber || undefined,
      mbDate,
      site: site || undefined,
      engineerId: engineerId || undefined,
      contractorId: contractorId || undefined,
      status,
      remarks: remarks || undefined,
      abstractPdfUrl: abstractPdfUrl || undefined,
      abstractPdfName: abstractPdfName || undefined,
      sourceRecapRevisionId: sourceRecapRevisionId || undefined,
      items: rows.map((r) => ({
        boqItemNo: r.boqItemNo,
        boqDescription: r.boqDescription,
        unit: r.unit,
        subWorkId: r.subWorkId || undefined,
        length: r.length === "" ? undefined : Number(r.length),
        breadth: r.breadth === "" ? undefined : Number(r.breadth),
        height: r.height === "" ? undefined : Number(r.height),
        currentQuantity: r.currentQuantity === "" ? undefined : Number(r.currentQuantity),
        boqRate: Number(r.boqRate) || 0,
        paymentPercent: Number(r.paymentPercent) || 0,
        previousQuantity: r.previousQuantity,
        fieldChangeReason: r.fieldChangeReason || undefined,
        remarks: r.remarks || undefined,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
      {isLocked && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-700">
          This Measurement Book is Approved — it is the official record and can no longer be edited.
        </div>
      )}

      {/* GENERAL */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">General</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">MB Number *</label>
            <input type="text" value={mbNumber} onChange={(e) => setMbNumber(e.target.value)} required disabled={isLocked} placeholder="Official government MB number" className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
          <div>
            <label className="mb-2 block font-medium">RA Bill Number</label>
            <input type="text" value={raBillNumber} onChange={(e) => setRaBillNumber(e.target.value)} disabled={isLocked} placeholder="e.g. RA-2" className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
          <div>
            <label className="mb-2 block font-medium">MB Date *</label>
            <input type="date" value={mbDate} onChange={(e) => setMbDate(e.target.value)} required disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Project *</label>
            <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setSiteId(""); setSubWorkId(""); }} required disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50">
              <option value="">Select Project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Site *</label>
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} disabled={!projectId || isLocked} required className="w-full rounded-lg border p-3 disabled:bg-slate-50">
              <option value="">Select Site</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Sub Work <span className="font-normal text-slate-400">(optional)</span></label>
            <select value={subWorkId} onChange={(e) => setSubWorkId(e.target.value)} disabled={!projectId || isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50">
              <option value="">No Sub Work</option>
              {subWorks.map((sw) => <option key={sw.id} value={sw.id}>{sw.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Site</label>
            <input type="text" value={site} onChange={(e) => setSite(e.target.value)} disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Engineer</label>
            <select value={engineerId} onChange={(e) => setEngineerId(e.target.value)} disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50">
              <option value="">Select Engineer</option>
              {engineers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Contractor</label>
            <select value={contractorId} onChange={(e) => setContractorId(e.target.value)} disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50">
              <option value="">Select Contractor</option>
              {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Status *</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} required disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50">
              {MB_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{MB_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Abstract PDF</label>
            <div className="flex gap-2">
              <input type="text" value={abstractPdfName} onChange={(e) => setAbstractPdfName(e.target.value)} disabled={isLocked} placeholder="File name" className="w-1/2 rounded-lg border p-3 disabled:bg-slate-50" />
              <input type="text" value={abstractPdfUrl} onChange={(e) => setAbstractPdfUrl(e.target.value)} disabled={isLocked} placeholder="File URL" className="w-1/2 rounded-lg border p-3 disabled:bg-slate-50" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Remarks</label>
            <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
        </div>
      </div>

      {/* ABSTRACT SHEET */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-700">Abstract Sheet</h2>
          {!isLocked && (
            <button type="button" onClick={handleLoadFromRecap} disabled={loadingFromRecap || !siteId} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">
              <Download className="h-4 w-4" /> {loadingFromRecap ? "Loading..." : "Load from Recapitulation"}
            </button>
          )}
        </div>
        <p className="mb-4 text-sm text-slate-400">Quantity, Effective Rate, and Amount are always calculated automatically — never enter them directly. Previous Qty auto-carries forward from the prior Measurement Book; editing it or the Rate away from that auto value requires a reason.</p>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-2 text-left">Item No.</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-left">Unit</th>
                <th className="px-2 py-2 text-right">Length</th>
                <th className="px-2 py-2 text-right">Breadth</th>
                <th className="px-2 py-2 text-right">Height</th>
                <th className="px-2 py-2 text-right">Current Qty</th>
                <th className="px-2 py-2 text-right">Previous Qty</th>
                <th className="px-2 py-2 text-right">Total Qty</th>
                <th className="px-2 py-2 text-right">Rate</th>
                <th className="px-2 py-2 text-right">Payment %</th>
                <th className="px-2 py-2 text-right">Eff. Rate</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-2 py-2 text-right">Total Amount</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const calc = calcRow(row);
                const previousChanged = Math.abs(row.previousQuantity - row.basePreviousQuantity) > 0.0001;
                const rateChanged = Math.abs((Number(row.boqRate) || 0) - row.baseRate) > 0.0001 && row.baseRate > 0;
                const needsReason = previousChanged || rateChanged;
                return (
                  <Fragment key={i}>
                    <tr className="border-t">
                      <td className="p-1"><input value={row.boqItemNo} onChange={(e) => updateRow(i, { boqItemNo: e.target.value })} disabled={isLocked} className="w-20 rounded border p-1.5 disabled:bg-slate-50" /></td>
                      <td className="p-1"><input value={row.boqDescription} onChange={(e) => updateRow(i, { boqDescription: e.target.value })} disabled={isLocked} className="w-40 rounded border p-1.5 disabled:bg-slate-50" /></td>
                      <td className="p-1"><input value={row.unit} onChange={(e) => updateRow(i, { unit: e.target.value })} disabled={isLocked} className="w-16 rounded border p-1.5 disabled:bg-slate-50" /></td>
                      <td className="p-1"><input type="number" min={0} step="0.01" value={row.length} onChange={(e) => updateRow(i, { length: e.target.value === "" ? "" : Number(e.target.value) })} disabled={isLocked} className="w-16 rounded border p-1.5 text-right disabled:bg-slate-50" /></td>
                      <td className="p-1"><input type="number" min={0} step="0.01" value={row.breadth} onChange={(e) => updateRow(i, { breadth: e.target.value === "" ? "" : Number(e.target.value) })} disabled={isLocked} className="w-16 rounded border p-1.5 text-right disabled:bg-slate-50" /></td>
                      <td className="p-1"><input type="number" min={0} step="0.01" value={row.height} onChange={(e) => updateRow(i, { height: e.target.value === "" ? "" : Number(e.target.value) })} disabled={isLocked} className="w-16 rounded border p-1.5 text-right disabled:bg-slate-50" /></td>
                      <td className="p-1">
                        <input
                          type="number" min={0} step="0.0001"
                          value={row.length === "" ? row.currentQuantity : ""}
                          onChange={(e) => updateRow(i, { currentQuantity: e.target.value === "" ? "" : Number(e.target.value) })}
                          disabled={isLocked || row.length !== ""}
                          placeholder={row.length !== "" ? calc.quantity.toFixed(4) : ""}
                          className="w-20 rounded border p-1.5 text-right disabled:bg-slate-50"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number" min={0} step="0.0001"
                          value={row.previousQuantity}
                          onChange={(e) => updateRow(i, { previousQuantity: Number(e.target.value) || 0 })}
                          disabled={isLocked}
                          className={`w-20 rounded border p-1.5 text-right disabled:bg-slate-50 ${previousChanged ? "border-amber-400 bg-amber-50" : ""}`}
                        />
                      </td>
                      <td className="p-1 text-right font-medium text-slate-600">{calc.totalQuantity.toFixed(4)}</td>
                      <td className="p-1"><input type="number" min={0} step="0.01" value={row.boqRate} onChange={(e) => updateRow(i, { boqRate: Number(e.target.value) || 0 })} disabled={isLocked} className={`w-20 rounded border p-1.5 text-right disabled:bg-slate-50 ${rateChanged ? "border-amber-400 bg-amber-50" : ""}`} /></td>
                      <td className="p-1">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          list={`payment-percent-presets-${i}`}
                          value={row.paymentPercent}
                          onChange={(e) => updateRow(i, { paymentPercent: Number(e.target.value) || 0 })}
                          disabled={isLocked}
                          className="w-16 rounded border p-1.5 text-right disabled:bg-slate-50"
                        />
                        <datalist id={`payment-percent-presets-${i}`}>
                          {PAYMENT_PERCENT_PRESETS.map((p) => <option key={p} value={p} />)}
                        </datalist>
                      </td>
                      <td className="p-1 text-right font-medium text-slate-600">{calc.effectiveRate.toFixed(2)}</td>
                      <td className="p-1 text-right font-medium text-slate-600">{calc.amount.toFixed(2)}</td>
                      <td className="p-1 text-right font-medium text-slate-600">{calc.totalAmount.toFixed(2)}</td>
                      <td className="p-1">
                        {!isLocked && (
                          <button type="button" onClick={() => removeRow(i)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                    {needsReason && !isLocked && (
                      <tr className="border-t bg-amber-50">
                        <td colSpan={15} className="p-2">
                          <div className="flex items-center gap-2 text-xs text-amber-700">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Previous Qty / Rate changed for "{row.boqItemNo || "this row"}" — a reason is required:</span>
                            <input
                              value={row.fieldChangeReason ?? ""}
                              onChange={(e) => updateRow(i, { fieldChangeReason: e.target.value })}
                              placeholder="e.g. Government revised certified quantity"
                              className="flex-1 rounded border border-amber-300 p-1.5"
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              <tr className="border-t bg-slate-50 font-bold">
                <td className="p-2" colSpan={6}>Total</td>
                <td className="p-2 text-right">{totals.quantity.toFixed(4)}</td>
                <td className="p-2" colSpan={2}></td>
                <td className="p-2" colSpan={3}></td>
                <td className="p-2 text-right">{totals.amount.toFixed(2)}</td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        {!isLocked && (
          <button type="button" onClick={addRow} className="mt-3 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            <Plus className="h-4 w-4" /> Add Row
          </button>
        )}
      </div>

      {initialData?.id && (
        <div>
          <button type="button" onClick={() => setShowHistory((v) => !v)} className="text-sm text-blue-600 hover:underline">
            {showHistory ? "Hide" : "Show"} Edit History ({auditHistory.length})
          </button>
          {showHistory && (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Field</th>
                    <th className="px-3 py-2 text-right">Old Value</th>
                    <th className="px-3 py-2 text-right">New Value</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                    <th className="px-3 py-2 text-left">Changed By</th>
                    <th className="px-3 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.length === 0 ? (
                    <EmptyTableRow colSpan={7}>No edits to Previous Qty or Rate yet.</EmptyTableRow>
                  ) : (
                    auditHistory.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="px-3 py-2">{a.boqItemNo}</td>
                        <td className="px-3 py-2">{a.fieldName === "previousQuantity" ? "Previous Qty" : "Rate"}</td>
                        <td className="px-3 py-2 text-right">{a.fieldName === "boqRate" ? inr(a.oldValue) : a.oldValue}</td>
                        <td className="px-3 py-2 text-right">{a.fieldName === "boqRate" ? inr(a.newValue) : a.newValue}</td>
                        <td className="px-3 py-2">{a.reason}</td>
                        <td className="px-3 py-2">{a.changedByName}</td>
                        <td className="px-3 py-2">{new Date(a.changedAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving || isLocked} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save Measurement Book"}
        </button>
      </div>
    </form>
  );
}
