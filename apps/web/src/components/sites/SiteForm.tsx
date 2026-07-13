import { useState } from "react";
import type { SiteFormData } from "../../services/sites";
import { SITE_TYPE_OPTIONS, SITE_TYPE_LABELS, SITE_STATUS_OPTIONS, SITE_STATUS_LABELS } from "../../services/sites";

interface Props {
  initialData?: Partial<SiteFormData>;
  onSubmit: (data: SiteFormData) => void;
  saving: boolean;
}

const EMPTY: SiteFormData = {
  projectId: "",
  name: "",
  village: "",
  taluka: "",
  district: "",
  engineer: "",
  siteType: "OWN_SITE",
  status: "PLANNING",
  contractValue: 0,
  emdValue: 0,
  securityDeposit: 0,
  performanceGuarantee: 0,
  workOrderDate: "",
  completionDate: "",
  actualCompletionDate: "",
  workOrderNumber: "",
  agreementNumber: "",
  agreementDate: "",
  tenderNumber: "",
  tenderAboveBelowPercent: "",
  department: "",
  division: "",
  subDivision: "",
  clientEngineer: "",
  defectLiabilityPeriod: "",
  gstPercent: "",
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

export default function SiteForm({ initialData, onSubmit, saving }: Props) {
  const [data, setData] = useState<SiteFormData>({ ...EMPTY, ...initialData });

  const set = <K extends keyof SiteFormData>(key: K, value: SiteFormData[K]) => setData((d) => ({ ...d, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim()) {
      alert("Site name is required");
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Site Name" required>
          <input className={inputClass} value={data.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="Site Type" required>
          <select className={inputClass} value={data.siteType} onChange={(e) => set("siteType", e.target.value)}>
            {SITE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{SITE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>
        <Field label="Village">
          <input className={inputClass} value={data.village} onChange={(e) => set("village", e.target.value)} />
        </Field>
        <Field label="Taluka">
          <input className={inputClass} value={data.taluka} onChange={(e) => set("taluka", e.target.value)} />
        </Field>
        <Field label="District">
          <input className={inputClass} value={data.district} onChange={(e) => set("district", e.target.value)} />
        </Field>
        <Field label="Engineer">
          <input className={inputClass} value={data.engineer} onChange={(e) => set("engineer", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={data.status} onChange={(e) => set("status", e.target.value)}>
            {SITE_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{SITE_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Contract Details (optional — can be added later)</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Work Order Number">
            <input className={inputClass} value={data.workOrderNumber} onChange={(e) => set("workOrderNumber", e.target.value)} />
          </Field>
          <Field label="Tender Above / Below (%)">
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.tenderAboveBelowPercent}
              onChange={(e) => set("tenderAboveBelowPercent", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. -5.00 for 5% below"
            />
          </Field>
          <Field label="Contract Value">
            <input type="number" min="0" step="0.01" className={inputClass} value={data.contractValue} onChange={(e) => set("contractValue", Number(e.target.value))} />
          </Field>
          <Field label="EMD Value">
            <input type="number" min="0" step="0.01" className={inputClass} value={data.emdValue} onChange={(e) => set("emdValue", Number(e.target.value))} />
          </Field>
          <Field label="Security Deposit">
            <input type="number" min="0" step="0.01" className={inputClass} value={data.securityDeposit} onChange={(e) => set("securityDeposit", Number(e.target.value))} />
          </Field>
          <Field label="Performance Guarantee">
            <input type="number" min="0" step="0.01" className={inputClass} value={data.performanceGuarantee} onChange={(e) => set("performanceGuarantee", Number(e.target.value))} />
          </Field>
          <Field label="Work Order Date">
            <input type="date" className={inputClass} value={data.workOrderDate} onChange={(e) => set("workOrderDate", e.target.value)} />
          </Field>
          <Field label="Work Order End Date (Expected Completion)">
            <input type="date" className={inputClass} value={data.completionDate} onChange={(e) => set("completionDate", e.target.value)} />
          </Field>
          {data.status === "COMPLETED" && (
            <Field label="Actual Completion Date">
              <input type="date" className={inputClass} value={data.actualCompletionDate} onChange={(e) => set("actualCompletionDate", e.target.value)} />
            </Field>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Site"}
        </button>
      </div>
    </form>
  );
}
