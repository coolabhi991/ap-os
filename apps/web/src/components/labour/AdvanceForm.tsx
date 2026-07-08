import { useState } from "react";
import type { LabourAdvanceFormData } from "../../services/labour-advances";
import { ADVANCE_MODE_OPTIONS, ADVANCE_MODE_LABELS } from "../../services/labour-advances";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";

interface Option {
  id: string;
  name: string;
}

interface Props {
  onSubmit: (data: LabourAdvanceFormData) => void;
  saving?: boolean;
  labourers: Option[];
  projects: Option[];
  companyBankAccounts: CompanyBankAccount[];
}

export default function AdvanceForm({ onSubmit, saving = false, labourers, projects, companyBankAccounts }: Props) {
  const [form, setForm] = useState<LabourAdvanceFormData>({
    labourId: "",
    projectId: "",
    amount: 0,
    advanceDate: new Date().toISOString().slice(0, 10),
    mode: "",
    companyBankAccountId: "",
    remarks: "",
  });
  const [error, setError] = useState<string | null>(null);
  const isCompanyBank = form.mode === "COMPANY_BANK";

  const set = <K extends keyof LabourAdvanceFormData>(key: K, value: LabourAdvanceFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.labourId) return setError("Select a worker.");
    if (!form.amount || form.amount <= 0) return setError("Enter an amount greater than zero.");
    if (!form.mode) return setError("Select a payment mode.");
    if (isCompanyBank && !form.companyBankAccountId) return setError("Select the company bank account.");
    setError(null);
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-8 shadow-sm">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-medium">Worker *</label>
          <select value={form.labourId} onChange={(e) => set("labourId", e.target.value)} required className="w-full rounded-lg border p-3">
            <option value="">Select Worker</option>
            {labourers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block font-medium">Project</label>
          <select value={form.projectId} onChange={(e) => set("projectId", e.target.value)} className="w-full rounded-lg border p-3">
            <option value="">Not project-specific</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block font-medium">Amount *</label>
          <input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => set("amount", parseFloat(e.target.value) || 0)} required className="w-full rounded-lg border p-3" />
        </div>
        <div>
          <label className="mb-2 block font-medium">Date</label>
          <input type="date" value={form.advanceDate} onChange={(e) => set("advanceDate", e.target.value)} className="w-full rounded-lg border p-3" />
        </div>
        <div>
          <label className="mb-2 block font-medium">Mode *</label>
          <select value={form.mode} onChange={(e) => set("mode", e.target.value)} required className="w-full rounded-lg border p-3">
            <option value="">Select Mode</option>
            {ADVANCE_MODE_OPTIONS.map((m) => <option key={m} value={m}>{ADVANCE_MODE_LABELS[m]}</option>)}
          </select>
        </div>
        {isCompanyBank && (
          <div>
            <label className="mb-2 block font-medium">Company Bank Account *</label>
            <select value={form.companyBankAccountId} onChange={(e) => set("companyBankAccountId", e.target.value)} required className="w-full rounded-lg border p-3">
              <option value="">Select Account</option>
              {companyBankAccounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName} (••••{a.accountNumber.slice(-4)})</option>)}
            </select>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="mb-2 block font-medium">Remarks</label>
          <input type="text" value={form.remarks} onChange={(e) => set("remarks", e.target.value)} className="w-full rounded-lg border p-3" />
        </div>
      </div>
      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Record Advance"}
        </button>
      </div>
    </form>
  );
}
