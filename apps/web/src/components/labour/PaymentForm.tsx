import { useEffect, useState } from "react";
import type { LabourPaymentFormData } from "../../services/labour-payments";
import { PAYMENT_MODE_OPTIONS, PAYMENT_MODE_LABELS } from "../../services/labour-payments";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";
import { getSites } from "../../services/sites";
import type { Site } from "../../services/sites";

interface Option {
  id: string;
  name: string;
}

interface Props {
  onSubmit: (data: LabourPaymentFormData) => void;
  saving?: boolean;
  labourers: Option[];
  projects: Option[];
  companyBankAccounts: CompanyBankAccount[];
}

export default function PaymentForm({ onSubmit, saving = false, labourers, projects, companyBankAccounts }: Props) {
  const [form, setForm] = useState<LabourPaymentFormData>({
    labourId: "",
    projectId: "",
    siteId: "",
    amount: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    periodFrom: "",
    periodTo: "",
    mode: "",
    companyBankAccountId: "",
    remarks: "",
    logAsExpense: false,
  });
  const [error, setError] = useState<string | null>(null);
  const isCompanyBank = form.mode === "COMPANY_BANK";

  const set = <K extends keyof LabourPaymentFormData>(key: K, value: LabourPaymentFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const [sites, setSites] = useState<Site[]>([]);
  useEffect(() => {
    if (!form.projectId) {
      setSites([]);
      return;
    }
    getSites(form.projectId).then((result) => {
      setSites(result);
      if (result.length === 1) set("siteId", result[0].id);
    }).catch(() => setSites([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.projectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.labourId) return setError("Select a worker.");
    if (!form.amount || form.amount <= 0) return setError("Enter an amount greater than zero.");
    if (!form.mode) return setError("Select a payment mode.");
    if (isCompanyBank && !form.companyBankAccountId) return setError("Select the company bank account.");
    if (form.logAsExpense && !form.projectId) return setError("Project is required to also log this as a Site Expense.");
    if (form.logAsExpense && !form.siteId) return setError("Site is required to also log this as a Site Expense.");
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
          <label className="mb-2 block font-medium">Project {form.logAsExpense && <span className="text-red-500">*</span>}</label>
          <select
            value={form.projectId}
            onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value, siteId: "" }))}
            required={form.logAsExpense}
            className="w-full rounded-lg border p-3"
          >
            <option value="">Not project-specific</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block font-medium">Site {form.logAsExpense && <span className="text-red-500">*</span>}</label>
          <select
            value={form.siteId}
            onChange={(e) => set("siteId", e.target.value)}
            disabled={!form.projectId}
            required={form.logAsExpense}
            className="w-full rounded-lg border p-3 disabled:bg-slate-50"
          >
            <option value="">Select Site</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block font-medium">Amount *</label>
          <input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => set("amount", parseFloat(e.target.value) || 0)} required className="w-full rounded-lg border p-3" />
        </div>
        <div>
          <label className="mb-2 block font-medium">Payment Date</label>
          <input type="date" value={form.paymentDate} onChange={(e) => set("paymentDate", e.target.value)} className="w-full rounded-lg border p-3" />
        </div>
        <div>
          <label className="mb-2 block font-medium">Period From</label>
          <input type="date" value={form.periodFrom} onChange={(e) => set("periodFrom", e.target.value)} className="w-full rounded-lg border p-3" />
        </div>
        <div>
          <label className="mb-2 block font-medium">Period To</label>
          <input type="date" value={form.periodTo} onChange={(e) => set("periodTo", e.target.value)} className="w-full rounded-lg border p-3" />
        </div>
        <div>
          <label className="mb-2 block font-medium">Mode *</label>
          <select value={form.mode} onChange={(e) => set("mode", e.target.value)} required className="w-full rounded-lg border p-3">
            <option value="">Select Mode</option>
            {PAYMENT_MODE_OPTIONS.map((m) => <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>)}
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
        <div className="md:col-span-2 rounded-lg bg-slate-50 p-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.logAsExpense} onChange={(e) => set("logAsExpense", e.target.checked)} />
            Also log this payment as a Site Expense (category: Labour)
          </label>
          <p className="mt-1 text-xs text-slate-400">Optional — never automatic. Requires a project and an active "Labour" expense category.</p>
        </div>
      </div>
      <div className="flex justify-end gap-4">
        <button type="button" className="rounded-lg border px-6 py-3">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : "Record Payment"}
        </button>
      </div>
    </form>
  );
}
