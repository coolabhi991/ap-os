import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { DPRDetail, DPRFormData, ManualMachineryEntry, AutoPullPreview } from "../../services/dpr";
import {
  getAutoPullPreview,
  SHIFT_OPTIONS,
  SHIFT_LABELS,
  VISITOR_TYPE_OPTIONS,
  VISITOR_TYPE_LABELS,
  SITE_PROBLEM_TYPE_OPTIONS,
  SITE_PROBLEM_TYPE_LABELS,
} from "../../services/dpr";
import { getSubWorks } from "../../services/sub-works";
import type { SubWork } from "../../services/sub-works";
import { getSites } from "../../services/sites";
import type { Site } from "../../services/sites";
import { formatCurrency as inr, todayISO } from "../../lib/utils";

interface Option {
  id: string;
  name: string;
}

interface VisitorRow {
  visitorType: string;
  name: string;
  remarks: string;
}

interface SiteProblemRow {
  problemType: string;
  description: string;
}

interface Props {
  initialData?: DPRDetail;
  onSubmit: (data: DPRFormData) => void;
  saving?: boolean;
  projects: Option[];
  contractors: Option[];
  engineers: Option[];
}


export default function DPRForm({ initialData, onSubmit, saving = false, projects, contractors, engineers }: Props) {
  const [projectId, setProjectId] = useState(initialData?.projectId ?? "");
  const [siteId, setSiteId] = useState(initialData?.siteId ?? "");
  const [subWorkId, setSubWorkId] = useState(initialData?.subWorkId ?? "");
  const [reportDate, setReportDate] = useState(initialData?.reportDate ?? todayISO());
  const [site, setSite] = useState(initialData?.site ?? "");
  const [engineerId, setEngineerId] = useState(initialData?.engineerId ?? "");
  const [contractorId, setContractorId] = useState(initialData?.contractorId ?? "");
  const [weather, setWeather] = useState(initialData?.weather ?? "");
  const [shift, setShift] = useState(initialData?.shift ?? "DAY");
  const [remarks, setRemarks] = useState(initialData?.remarks ?? "");

  const [workDone, setWorkDone] = useState(initialData?.workDone ?? "");
  const [plannedWork, setPlannedWork] = useState(initialData?.plannedWork ?? "");
  const [physicalProgressUpdate, setPhysicalProgressUpdate] = useState(
    initialData?.physicalProgressUpdate !== null && initialData?.physicalProgressUpdate !== undefined ? String(initialData.physicalProgressUpdate) : ""
  );
  const [delayReason, setDelayReason] = useState(initialData?.delayReason ?? "");
  const [instructions, setInstructions] = useState(initialData?.instructions ?? "");

  const [subWorks, setSubWorks] = useState<SubWork[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [autoPull, setAutoPull] = useState<AutoPullPreview | null>(null);
  const [autoPullLoading, setAutoPullLoading] = useState(false);

  const [manualLabour, setManualLabour] = useState(initialData?.labourManuallyAdjusted ?? false);
  const [labourSkilled, setLabourSkilled] = useState(String(initialData?.labourSkilled ?? 0));
  const [labourUnskilled, setLabourUnskilled] = useState(String(initialData?.labourUnskilled ?? 0));
  const [labourSupervisor, setLabourSupervisor] = useState(String(initialData?.labourSupervisor ?? 0));
  const [labourOperator, setLabourOperator] = useState(String(initialData?.labourOperator ?? 0));

  const [manualMachineryEntries, setManualMachineryEntries] = useState<ManualMachineryEntry[]>(initialData?.manualMachineryEntries ?? []);

  const [visitors, setVisitors] = useState<VisitorRow[]>(
    initialData?.visitors.map((v) => ({ visitorType: v.visitorType, name: v.name, remarks: v.remarks })) ?? []
  );
  const [siteProblems, setSiteProblems] = useState<SiteProblemRow[]>(
    initialData?.siteProblems.map((p) => ({ problemType: p.problemType, description: p.description })) ?? []
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
    if (!projectId || !reportDate) {
      setAutoPull(null);
      return;
    }
    setAutoPullLoading(true);
    getAutoPullPreview(projectId, reportDate, subWorkId || undefined)
      .then(setAutoPull)
      .catch(() => setAutoPull(null))
      .finally(() => setAutoPullLoading(false));
  }, [projectId, subWorkId, reportDate]);

  const addMachineryRow = () => setManualMachineryEntries((rows) => [...rows, { machineType: "", hours: 0, amount: 0, remarks: "" }]);
  const updateMachineryRow = (i: number, patch: Partial<ManualMachineryEntry>) =>
    setManualMachineryEntries((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeMachineryRow = (i: number) => setManualMachineryEntries((rows) => rows.filter((_, idx) => idx !== i));

  const addVisitorRow = () => setVisitors((rows) => [...rows, { visitorType: "EXECUTIVE_ENGINEER", name: "", remarks: "" }]);
  const updateVisitorRow = (i: number, patch: Partial<VisitorRow>) => setVisitors((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeVisitorRow = (i: number) => setVisitors((rows) => rows.filter((_, idx) => idx !== i));

  const addSiteProblemRow = () => setSiteProblems((rows) => [...rows, { problemType: "RAIN", description: "" }]);
  const updateSiteProblemRow = (i: number, patch: Partial<SiteProblemRow>) =>
    setSiteProblems((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeSiteProblemRow = (i: number) => setSiteProblems((rows) => rows.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return setError("Select a project.");
    if (!siteId) return setError("Select a site.");
    if (!reportDate) return setError("Select a date.");
    for (const m of manualMachineryEntries) {
      if (!m.machineType.trim()) return setError("Every manual machinery entry needs a machine type.");
    }
    for (const v of visitors) {
      if (!v.visitorType) return setError("Every visitor row needs a type.");
    }
    for (const p of siteProblems) {
      if (!p.problemType) return setError("Every site problem row needs a type.");
    }

    setError(null);
    onSubmit({
      projectId,
      siteId,
      subWorkId: subWorkId || undefined,
      reportDate,
      site: site || undefined,
      engineerId: engineerId || undefined,
      contractorId: contractorId || undefined,
      weather: weather || undefined,
      shift,
      remarks: remarks || undefined,
      workDone: workDone || undefined,
      plannedWork: plannedWork || undefined,
      physicalProgressUpdate: physicalProgressUpdate !== "" ? Number(physicalProgressUpdate) : undefined,
      delayReason: delayReason || undefined,
      instructions: instructions || undefined,
      ...(manualLabour
        ? {
            labourSkilled: Number(labourSkilled) || 0,
            labourUnskilled: Number(labourUnskilled) || 0,
            labourSupervisor: Number(labourSupervisor) || 0,
            labourOperator: Number(labourOperator) || 0,
          }
        : {}),
      manualMachineryEntries,
      visitors: visitors.map((v) => ({ visitorType: v.visitorType, name: v.name || undefined, remarks: v.remarks || undefined })),
      siteProblems: siteProblems.map((p) => ({ problemType: p.problemType, description: p.description || undefined })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-sm">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}

      {/* GENERAL INFORMATION */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">General Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Project *</label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setSiteId("");
                setSubWorkId("");
              }}
              required
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select Project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Site *</label>
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} disabled={!projectId} required className="w-full rounded-lg border p-3 disabled:bg-slate-50">
              <option value="">Select Site</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Sub Work <span className="font-normal text-slate-400">(optional)</span></label>
            <select value={subWorkId} onChange={(e) => setSubWorkId(e.target.value)} disabled={!projectId} className="w-full rounded-lg border p-3 disabled:bg-slate-50">
              <option value="">No Sub Work</option>
              {subWorks.map((sw) => <option key={sw.id} value={sw.id}>{sw.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Date *</label>
            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Shift *</label>
            <select value={shift} onChange={(e) => setShift(e.target.value)} required className="w-full rounded-lg border p-3">
              {SHIFT_OPTIONS.map((s) => <option key={s} value={s}>{SHIFT_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Site</label>
            <input
              type="text"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder={projects.find((p) => p.id === projectId)?.name ? "Defaults to project location" : ""}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium">Engineer</label>
            <select value={engineerId} onChange={(e) => setEngineerId(e.target.value)} className="w-full rounded-lg border p-3">
              <option value="">Select Engineer</option>
              {engineers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Contractor</label>
            <select value={contractorId} onChange={(e) => setContractorId(e.target.value)} className="w-full rounded-lg border p-3">
              <option value="">Select Contractor</option>
              {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium">Weather</label>
            <input type="text" value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="e.g. Sunny, light rain in afternoon" className="w-full rounded-lg border p-3" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Remarks</label>
            <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-lg border p-3" />
          </div>
        </div>
      </div>

      {/* WORK PROGRESS */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Work Progress</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Work Done Today</label>
            <textarea rows={3} value={workDone} onChange={(e) => setWorkDone(e.target.value)} className="w-full rounded-lg border p-3" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Planned Work</label>
            <textarea rows={3} value={plannedWork} onChange={(e) => setPlannedWork(e.target.value)} className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-2 block font-medium">
              Physical Progress Update % {subWorkId && <span className="font-normal text-slate-400">(updates the Sub Work's tracked progress)</span>}
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={physicalProgressUpdate}
              onChange={(e) => setPhysicalProgressUpdate(e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium">Delay Reason</label>
            <input type="text" value={delayReason} onChange={(e) => setDelayReason(e.target.value)} className="w-full rounded-lg border p-3" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Instructions</label>
            <textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full rounded-lg border p-3" />
          </div>
        </div>
      </div>

      {/* LABOUR SUMMARY */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-700">Labour Summary</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={manualLabour} onChange={(e) => setManualLabour(e.target.checked)} />
            Adjust manually
          </label>
        </div>
        <p className="mb-4 text-sm text-slate-400">Automatically pulled from today's Labour Attendance for this project{subWorkId ? " / sub work" : ""}.</p>
        {manualLabour ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Skilled</label>
              <input type="number" min={0} value={labourSkilled} onChange={(e) => setLabourSkilled(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Unskilled</label>
              <input type="number" min={0} value={labourUnskilled} onChange={(e) => setLabourUnskilled(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Supervisor</label>
              <input type="number" min={0} value={labourSupervisor} onChange={(e) => setLabourSupervisor(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Operator</label>
              <input type="number" min={0} value={labourOperator} onChange={(e) => setLabourOperator(e.target.value)} className="w-full rounded-lg border p-2.5" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatBox label="Skilled" value={autoPullLoading ? "..." : String(autoPull?.labourSkilled ?? 0)} />
            <StatBox label="Unskilled" value={autoPullLoading ? "..." : String(autoPull?.labourUnskilled ?? 0)} />
            <StatBox label="Supervisor" value={autoPullLoading ? "..." : String(autoPull?.labourSupervisor ?? 0)} />
            <StatBox label="Operator" value={autoPullLoading ? "..." : String(autoPull?.labourOperator ?? 0)} />
            <StatBox label="Total" value={autoPullLoading ? "..." : String(autoPull?.labourTotal ?? 0)} highlight />
          </div>
        )}
      </div>

      {/* MACHINERY SUMMARY */}
      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-700">Machinery Summary</h2>
        <p className="mb-4 text-sm text-slate-400">Automatically pulled from today's Machinery Site Expenses. Add a manual entry only for machines not yet logged there.</p>

        {(autoPull?.machinerySummary.length ?? 0) > 0 && (
          <div className="mb-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Machine Type</th><th className="px-3 py-2 text-right">Hours</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
              <tbody>
                {autoPull!.machinerySummary.map((m) => (
                  <tr key={m.id} className="border-t"><td className="px-3 py-2">{m.machineType || "—"}</td><td className="px-3 py-2 text-right">{m.hours}</td><td className="px-3 py-2 text-right">{inr(m.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="space-y-3">
          {manualMachineryEntries.map((m, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-5">
              <input type="text" placeholder="Machine Type" value={m.machineType} onChange={(e) => updateMachineryRow(i, { machineType: e.target.value })} className="rounded-lg border p-2" />
              <input type="number" min={0} placeholder="Hours" value={m.hours} onChange={(e) => updateMachineryRow(i, { hours: Number(e.target.value) || 0 })} className="rounded-lg border p-2" />
              <input type="number" min={0} placeholder="Amount" value={m.amount} onChange={(e) => updateMachineryRow(i, { amount: Number(e.target.value) || 0 })} className="rounded-lg border p-2" />
              <input type="text" placeholder="Remarks" value={m.remarks ?? ""} onChange={(e) => updateMachineryRow(i, { remarks: e.target.value })} className="rounded-lg border p-2 md:col-span-1" />
              <button type="button" onClick={() => removeMachineryRow(i)} className="flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addMachineryRow} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            <Plus className="h-4 w-4" /> Add Manual Machinery Entry
          </button>
        </div>
      </div>

      {/* MATERIAL SUMMARY (read-only preview) */}
      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-700">Material Summary</h2>
        <p className="mb-4 text-sm text-slate-400">Automatically shown from Material Receipts and Material Issues for this date — no entry needed.</p>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 font-medium text-slate-600">Received Today</p>
            {autoPull?.materialSummary.materialReceivedToday.length ? (
              <ul className="space-y-1 text-slate-500">
                {autoPull.materialSummary.materialReceivedToday.map((r) => <li key={r.id}>{r.itemName} — {r.quantity} {r.unit}</li>)}
              </ul>
            ) : <p className="text-slate-400">None.</p>}
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 font-medium text-slate-600">Issued Today</p>
            {autoPull?.materialSummary.materialIssuedToday.length ? (
              <ul className="space-y-1 text-slate-500">
                {autoPull.materialSummary.materialIssuedToday.map((i) => <li key={i.id}>{i.itemName} — {i.quantity} {i.unit}</li>)}
              </ul>
            ) : <p className="text-slate-400">None.</p>}
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 font-medium text-slate-600">Major Materials Used</p>
            {autoPull?.materialSummary.majorMaterialsUsed.length ? (
              <ul className="space-y-1 text-slate-500">
                {autoPull.materialSummary.majorMaterialsUsed.map((m, i) => <li key={i}>{m.itemName} — {m.quantity} {m.unit}</li>)}
              </ul>
            ) : <p className="text-slate-400">None.</p>}
          </div>
        </div>
      </div>

      {/* VISITORS */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Visitors</h2>
        <div className="space-y-3">
          {visitors.map((v, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-4">
              <select value={v.visitorType} onChange={(e) => updateVisitorRow(i, { visitorType: e.target.value })} className="rounded-lg border p-2">
                {VISITOR_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{VISITOR_TYPE_LABELS[t]}</option>)}
              </select>
              <input type="text" placeholder="Name (optional)" value={v.name} onChange={(e) => updateVisitorRow(i, { name: e.target.value })} className="rounded-lg border p-2" />
              <input type="text" placeholder="Remarks" value={v.remarks} onChange={(e) => updateVisitorRow(i, { remarks: e.target.value })} className="rounded-lg border p-2" />
              <button type="button" onClick={() => removeVisitorRow(i)} className="flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addVisitorRow} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            <Plus className="h-4 w-4" /> Add Visitor
          </button>
        </div>
      </div>

      {/* SITE PROBLEMS */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Site Problems</h2>
        <div className="space-y-3">
          {siteProblems.map((p, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-4">
              <select value={p.problemType} onChange={(e) => updateSiteProblemRow(i, { problemType: e.target.value })} className="rounded-lg border p-2">
                {SITE_PROBLEM_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{SITE_PROBLEM_TYPE_LABELS[t]}</option>)}
              </select>
              <input
                type="text"
                placeholder="Description"
                value={p.description}
                onChange={(e) => updateSiteProblemRow(i, { description: e.target.value })}
                className="rounded-lg border p-2 md:col-span-2"
              />
              <button type="button" onClick={() => removeSiteProblemRow(i)} className="flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addSiteProblemRow} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            <Plus className="h-4 w-4" /> Add Site Problem
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save DPR"}
        </button>
      </div>
    </form>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${highlight ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${highlight ? "text-blue-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
