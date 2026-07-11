import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { MB, MBFormData, MBItemInput } from "../../services/measurement-books";
import { MB_STATUS_OPTIONS, MB_STATUS_LABELS, PAYMENT_PERCENT_PRESETS } from "../../services/measurement-books";
import { getSubWorks } from "../../services/sub-works";
import type { SubWork } from "../../services/sub-works";
import { getSites } from "../../services/sites";
import type { Site } from "../../services/sites";

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

interface ItemRow extends Omit<MBItemInput, "length" | "breadth" | "height"> {
  length: number | "";
  breadth: number | "";
  height: number | "";
  paymentPercent: number;
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
  }
  const effectiveRate = Math.round((row.boqRate || 0) * (row.paymentPercent / 100) * 100) / 100;
  const amount = Math.round(quantity * effectiveRate * 100) / 100;
  return { quantity, effectiveRate, amount };
}

function emptyRow(): ItemRow {
  return { boqItemNo: "", boqDescription: "", unit: "", length: "", breadth: "", height: "", boqRate: 0, paymentPercent: 100, remarks: "" };
}

export default function MBForm({ initialData, onSubmit, saving = false, projects, contractors, engineers }: Props) {
  const isLocked = initialData?.status === "APPROVED";

  const [projectId, setProjectId] = useState(initialData?.projectId ?? "");
  const [siteId, setSiteId] = useState(initialData?.siteId ?? "");
  const [subWorkId, setSubWorkId] = useState(initialData?.subWorkId ?? "");
  const [mbNumber, setMbNumber] = useState(initialData?.mbNumber ?? "");
  const [mbDate, setMbDate] = useState(initialData?.mbDate ?? new Date().toISOString().slice(0, 10));
  const [site, setSite] = useState(initialData?.site ?? "");
  const [engineerId, setEngineerId] = useState(initialData?.engineerId ?? "");
  const [contractorId, setContractorId] = useState(initialData?.contractorId ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");
  const [remarks, setRemarks] = useState(initialData?.remarks ?? "");

  const [subWorks, setSubWorks] = useState<SubWork[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [rows, setRows] = useState<ItemRow[]>(
    initialData?.items.length
      ? initialData.items.map((i) => ({
          boqItemNo: i.boqItemNo,
          boqDescription: i.boqDescription,
          unit: i.unit,
          length: i.length ? Number(i.length) : "",
          breadth: i.breadth ? Number(i.breadth) : "",
          height: i.height ? Number(i.height) : "",
          boqRate: Number(i.boqRate),
          paymentPercent: Number(i.paymentPercent),
          remarks: i.remarks,
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

  const updateRow = (i: number, patch: Partial<ItemRow>) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addRow = () => setRows((r) => [...r, emptyRow()]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

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
    }

    setError(null);
    onSubmit({
      projectId,
      siteId,
      subWorkId: subWorkId || undefined,
      mbNumber: mbNumber.trim(),
      mbDate,
      site: site || undefined,
      engineerId: engineerId || undefined,
      contractorId: contractorId || undefined,
      status,
      remarks: remarks || undefined,
      items: rows.map((r) => ({
        boqItemNo: r.boqItemNo,
        boqDescription: r.boqDescription,
        unit: r.unit,
        length: r.length === "" ? undefined : Number(r.length),
        breadth: r.breadth === "" ? undefined : Number(r.breadth),
        height: r.height === "" ? undefined : Number(r.height),
        boqRate: Number(r.boqRate) || 0,
        paymentPercent: Number(r.paymentPercent) || 0,
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
          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Remarks</label>
            <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={isLocked} className="w-full rounded-lg border p-3 disabled:bg-slate-50" />
          </div>
        </div>
      </div>

      {/* ABSTRACT SHEET */}
      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-700">Abstract Sheet</h2>
        <p className="mb-4 text-sm text-slate-400">Quantity, Effective Rate, and Amount are always calculated automatically — never enter them directly.</p>

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
                <th className="px-2 py-2 text-right">Quantity</th>
                <th className="px-2 py-2 text-right">BOQ Rate</th>
                <th className="px-2 py-2 text-right">Payment %</th>
                <th className="px-2 py-2 text-right">Eff. Rate</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const calc = calcRow(row);
                return (
                  <tr key={i} className="border-t">
                    <td className="p-1"><input value={row.boqItemNo} onChange={(e) => updateRow(i, { boqItemNo: e.target.value })} disabled={isLocked} className="w-24 rounded border p-1.5 disabled:bg-slate-50" /></td>
                    <td className="p-1"><input value={row.boqDescription} onChange={(e) => updateRow(i, { boqDescription: e.target.value })} disabled={isLocked} className="w-48 rounded border p-1.5 disabled:bg-slate-50" /></td>
                    <td className="p-1"><input value={row.unit} onChange={(e) => updateRow(i, { unit: e.target.value })} disabled={isLocked} className="w-16 rounded border p-1.5 disabled:bg-slate-50" /></td>
                    <td className="p-1"><input type="number" min={0} step="0.01" value={row.length} onChange={(e) => updateRow(i, { length: e.target.value === "" ? "" : Number(e.target.value) })} disabled={isLocked} className="w-20 rounded border p-1.5 text-right disabled:bg-slate-50" /></td>
                    <td className="p-1"><input type="number" min={0} step="0.01" value={row.breadth} onChange={(e) => updateRow(i, { breadth: e.target.value === "" ? "" : Number(e.target.value) })} disabled={isLocked} className="w-20 rounded border p-1.5 text-right disabled:bg-slate-50" /></td>
                    <td className="p-1"><input type="number" min={0} step="0.01" value={row.height} onChange={(e) => updateRow(i, { height: e.target.value === "" ? "" : Number(e.target.value) })} disabled={isLocked} className="w-20 rounded border p-1.5 text-right disabled:bg-slate-50" /></td>
                    <td className="p-1 text-right font-medium text-slate-600">{calc.quantity.toFixed(4)}</td>
                    <td className="p-1"><input type="number" min={0} step="0.01" value={row.boqRate} onChange={(e) => updateRow(i, { boqRate: Number(e.target.value) || 0 })} disabled={isLocked} className="w-24 rounded border p-1.5 text-right disabled:bg-slate-50" /></td>
                    <td className="p-1">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        list={`payment-percent-presets-${i}`}
                        value={row.paymentPercent}
                        onChange={(e) => updateRow(i, { paymentPercent: Number(e.target.value) || 0 })}
                        disabled={isLocked}
                        className="w-20 rounded border p-1.5 text-right disabled:bg-slate-50"
                      />
                      <datalist id={`payment-percent-presets-${i}`}>
                        {PAYMENT_PERCENT_PRESETS.map((p) => <option key={p} value={p} />)}
                      </datalist>
                    </td>
                    <td className="p-1 text-right font-medium text-slate-600">{calc.effectiveRate.toFixed(2)}</td>
                    <td className="p-1 text-right font-medium text-slate-600">{calc.amount.toFixed(2)}</td>
                    <td className="p-1">
                      {!isLocked && (
                        <button type="button" onClick={() => removeRow(i)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t bg-slate-50 font-bold">
                <td className="p-2" colSpan={6}>Total</td>
                <td className="p-2 text-right">{totals.quantity.toFixed(4)}</td>
                <td className="p-2" colSpan={3}></td>
                <td className="p-2 text-right">{totals.amount.toFixed(2)}</td>
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

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving || isLocked} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save Measurement Book"}
        </button>
      </div>
    </form>
  );
}
