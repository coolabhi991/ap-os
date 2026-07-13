import { useState } from "react";
import type { Site } from "../../../services/sites";
import { updateSite } from "../../../services/sites";

interface FormState {
  workOrderNumber: string;
  agreementNumber: string;
  agreementDate: string;
  tenderNumber: string;
  tenderAboveBelowPercent: number | "";
  contractValue: number;
  workOrderDate: string;
  completionDate: string;
  actualCompletionDate: string;
  securityDeposit: number;
  performanceGuarantee: number;
  emdValue: number;
  gstPercent: number | "";
  department: string;
  division: string;
  subDivision: string;
  clientEngineer: string;
  defectLiabilityPeriod: string;
}

function toFormState(site: Site): FormState {
  return {
    workOrderNumber: site.workOrderNumber,
    agreementNumber: site.agreementNumber,
    agreementDate: site.agreementDate,
    tenderNumber: site.tenderNumber,
    tenderAboveBelowPercent: site.tenderAboveBelowPercent === "" ? "" : Number(site.tenderAboveBelowPercent),
    contractValue: Number(site.contractValue),
    workOrderDate: site.workOrderDate,
    completionDate: site.completionDate,
    actualCompletionDate: site.actualCompletionDate,
    securityDeposit: Number(site.securityDeposit),
    performanceGuarantee: Number(site.performanceGuarantee),
    emdValue: Number(site.emdValue),
    gstPercent: site.gstPercent === "" ? "" : Number(site.gstPercent),
    department: site.department,
    division: site.division,
    subDivision: site.subDivision,
    clientEngineer: site.clientEngineer,
    defectLiabilityPeriod: site.defectLiabilityPeriod,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

export default function WorkOrderDetailsTab({ site, onSiteUpdated }: { site: Site; onSiteUpdated: (site: Site) => void }) {
  const [data, setData] = useState<FormState>(toFormState(site));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setData((d) => ({ ...d, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSite(site.id, data);
      onSiteUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Work Order Details.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setData(toFormState(site));
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Work Order Details</h2>
          <p className="text-sm text-slate-500">Every Site is self-contained — all contract and statutory details live here.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-600" title="System-generated, permanent, read-only">
            {site.siteCode || "Site Code pending"}
          </span>
          {!editing && (
            <button onClick={() => setEditing(true)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              Edit
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Work Order & Agreement</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Work Order Number">
              <input disabled={!editing} className={inputClass} value={data.workOrderNumber} onChange={(e) => set("workOrderNumber", e.target.value)} />
            </Field>
            <Field label="Work Order Date">
              <input type="date" disabled={!editing} className={inputClass} value={data.workOrderDate} onChange={(e) => set("workOrderDate", e.target.value)} />
            </Field>
            <Field label="Work Order End Date">
              <input type="date" disabled={!editing} className={inputClass} value={data.completionDate} onChange={(e) => set("completionDate", e.target.value)} />
            </Field>
            <Field label="Agreement Number">
              <input disabled={!editing} className={inputClass} value={data.agreementNumber} onChange={(e) => set("agreementNumber", e.target.value)} />
            </Field>
            <Field label="Agreement Date">
              <input type="date" disabled={!editing} className={inputClass} value={data.agreementDate} onChange={(e) => set("agreementDate", e.target.value)} />
            </Field>
            <Field label="Tender Number">
              <input disabled={!editing} className={inputClass} value={data.tenderNumber} onChange={(e) => set("tenderNumber", e.target.value)} />
            </Field>
            <Field label="Tender Above / Below (%)">
              <input
                type="number"
                step="0.01"
                disabled={!editing}
                className={inputClass}
                value={data.tenderAboveBelowPercent}
                onChange={(e) => set("tenderAboveBelowPercent", e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Field>
            {site.status === "COMPLETED" && (
              <Field label="Actual Completion Date">
                <input type="date" disabled={!editing} className={inputClass} value={data.actualCompletionDate} onChange={(e) => set("actualCompletionDate", e.target.value)} />
              </Field>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Value & Statutory</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Agreement Value">
              <input type="number" min="0" step="0.01" disabled={!editing} className={inputClass} value={data.contractValue} onChange={(e) => set("contractValue", Number(e.target.value))} />
            </Field>
            <Field label="EMD Value">
              <input type="number" min="0" step="0.01" disabled={!editing} className={inputClass} value={data.emdValue} onChange={(e) => set("emdValue", Number(e.target.value))} />
            </Field>
            <Field label="Security Deposit">
              <input type="number" min="0" step="0.01" disabled={!editing} className={inputClass} value={data.securityDeposit} onChange={(e) => set("securityDeposit", Number(e.target.value))} />
            </Field>
            <Field label="Performance Guarantee">
              <input type="number" min="0" step="0.01" disabled={!editing} className={inputClass} value={data.performanceGuarantee} onChange={(e) => set("performanceGuarantee", Number(e.target.value))} />
            </Field>
            <Field label="GST (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={!editing}
                className={inputClass}
                value={data.gstPercent}
                onChange={(e) => set("gstPercent", e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Field>
            <Field label="Defect Liability Period">
              <input disabled={!editing} className={inputClass} value={data.defectLiabilityPeriod} onChange={(e) => set("defectLiabilityPeriod", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Department</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Department">
              <input disabled={!editing} className={inputClass} value={data.department} onChange={(e) => set("department", e.target.value)} />
            </Field>
            <Field label="Division">
              <input disabled={!editing} className={inputClass} value={data.division} onChange={(e) => set("division", e.target.value)} />
            </Field>
            <Field label="Sub Division">
              <input disabled={!editing} className={inputClass} value={data.subDivision} onChange={(e) => set("subDivision", e.target.value)} />
            </Field>
            <Field label="Client Engineer">
              <input disabled={!editing} className={inputClass} value={data.clientEngineer} onChange={(e) => set("clientEngineer", e.target.value)} />
            </Field>
          </div>
        </div>

        {editing && (
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={handleCancel} className="rounded-lg border px-5 py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </form>

      <p className="text-xs text-slate-400">
        Contract Documents for this Site are managed in the Documents tab.
      </p>
    </div>
  );
}
