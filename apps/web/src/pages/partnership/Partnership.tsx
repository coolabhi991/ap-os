import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import Layout from "../../components/layout/Layout";
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  PARTNER_TYPE_OPTIONS,
  PARTNER_TYPE_LABELS,
} from "../../services/partners";
import type { Partner, PartnerFormData } from "../../services/partners";
import {
  getPartnerInvestments,
  createPartnerInvestment,
  deletePartnerInvestment,
  PAYMENT_MODE_OPTIONS as INVESTMENT_MODE_OPTIONS,
  PAYMENT_MODE_LABELS as INVESTMENT_MODE_LABELS,
} from "../../services/partner-investments";
import type { PartnerInvestment, PartnerInvestmentFormData } from "../../services/partner-investments";
import {
  getPartnerSettlements,
  createPartnerSettlement,
  deletePartnerSettlement,
  SETTLEMENT_TYPE_OPTIONS,
  SETTLEMENT_TYPE_LABELS,
  PAYMENT_MODE_OPTIONS as SETTLEMENT_MODE_OPTIONS,
  PAYMENT_MODE_LABELS as SETTLEMENT_MODE_LABELS,
} from "../../services/partner-settlements";
import type { PartnerSettlement, PartnerSettlementFormData } from "../../services/partner-settlements";
import {
  getAllocationLedger,
  getPartnerCapitalSummary,
  getProfitSharingReport,
} from "../../services/partnership-reports";
import type { AllocationLedgerRow, PartnerCapitalSummary, ProfitSharingReport } from "../../services/partnership-reports";
import { ALLOCATION_TYPE_LABELS } from "../../services/transaction-allocations";
import { getCompanyBankAccounts } from "../../services/company-bank-accounts";
import type { CompanyBankAccount } from "../../services/company-bank-accounts";
import LoadingState from "../../components/ui/LoadingState";
import { formatCurrency as inr, todayISO } from "../../lib/utils";
import EmptyTableRow from "../../components/ui/EmptyTableRow";


const TABS = [
  { key: "partners", label: "Partner Master" },
  { key: "investments", label: "Investment Ledger" },
  { key: "allocation-ledger", label: "Allocation Ledger" },
  { key: "profit-sharing", label: "Profit Sharing" },
  { key: "settlements", label: "Settlement" },
  { key: "reports", label: "Reports" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const emptyPartnerForm: PartnerFormData = { name: "", partnerType: "PARTNER", phone: "", email: "", address: "", panNumber: "", sharePercent: 0, isActive: true };

export default function Partnership() {
  const [tab, setTab] = useState<TabKey>("partners");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [bankAccounts, setBankAccounts] = useState<CompanyBankAccount[]>([]);

  const loadPartners = () => getPartners().then((r) => setPartners(r.data)).catch(() => {});
  useEffect(() => {
    loadPartners();
    getCompanyBankAccounts().then(setBankAccounts).catch(() => {});
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Partnership</h1>
          <p className="mt-2 text-slate-500">Partner capital is global — money is later allocated to Sites through Banking's Transaction Allocation.</p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "partners" && <PartnersTab partners={partners} reload={loadPartners} />}
        {tab === "investments" && <InvestmentsTab partners={partners} bankAccounts={bankAccounts} />}
        {tab === "allocation-ledger" && <AllocationLedgerTab />}
        {tab === "profit-sharing" && <ProfitSharingTab />}
        {tab === "settlements" && <SettlementsTab partners={partners} bankAccounts={bankAccounts} />}
        {tab === "reports" && <ReportsTab />}
      </div>
    </Layout>
  );
}

function PartnersTab({ partners, reload }: { partners: Partner[]; reload: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerFormData>(emptyPartnerForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAdd = () => { setEditingId(null); setForm(emptyPartnerForm); setError(null); setShowForm(true); };
  const startEdit = (p: Partner) => {
    setEditingId(p.id);
    setForm({ name: p.name, partnerType: p.partnerType, phone: p.phone, email: p.email, address: p.address, panNumber: p.panNumber, sharePercent: Number(p.sharePercent), isActive: p.isActive });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Partner name is required.");
    setSaving(true);
    try {
      if (editingId) await updatePartner(editingId, form);
      else await createPartner(form);
      setShowForm(false);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save partner.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this partner?")) return;
    try {
      await deletePartner(id);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete partner.");
    }
  };

  const totalShare = partners.filter((p) => p.isActive).reduce((s, p) => s + Number(p.sharePercent), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Total active share allocated: <strong className={totalShare > 100 ? "text-red-600" : ""}>{totalShare.toFixed(2)}%</strong>
        </p>
        <button onClick={startAdd} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Partner
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select value={form.partnerType} onChange={(e) => setForm({ ...form, partnerType: e.target.value })} className="w-full rounded-lg border p-2.5">
                {PARTNER_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{PARTNER_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Share %</label>
              <input type="number" min={0} max={100} step="0.01" value={form.sharePercent} onChange={(e) => setForm({ ...form, sharePercent: Number(e.target.value) || 0 })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">PAN</label>
              <input value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-medium">Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Share %</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 ? (
              <EmptyTableRow colSpan={6}>No partners yet.</EmptyTableRow>
            ) : (
              partners.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{PARTNER_TYPE_LABELS[p.partnerType]}</td>
                  <td className="px-4 py-3 text-right">{p.sharePercent}%</td>
                  <td className="px-4 py-3 text-slate-500">{p.phone || p.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => startEdit(p)} className="text-sm text-slate-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvestmentsTab({ partners, bankAccounts }: { partners: Partner[]; bankAccounts: CompanyBankAccount[] }) {
  const [investments, setInvestments] = useState<PartnerInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerInvestmentFormData>({ partnerId: "", amount: 0, investmentDate: todayISO(), mode: "CASH" });

  const load = () => {
    setLoading(true);
    getPartnerInvestments().then((r) => setInvestments(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partnerId) return setError("Select a partner.");
    if (!form.amount || form.amount <= 0) return setError("Enter an amount greater than zero.");
    if (form.mode === "COMPANY_BANK" && !form.companyBankAccountId) return setError("Select the company bank account.");
    setSaving(true);
    setError(null);
    try {
      await createPartnerInvestment(form);
      setShowForm(false);
      setForm({ partnerId: "", amount: 0, investmentDate: todayISO(), mode: "CASH" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record investment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this investment record?")) return;
    try {
      await deletePartnerInvestment(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete investment.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Investment Ledger</h2>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Record Investment
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Partner *</label>
              <select value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} className="w-full rounded-lg border p-2.5">
                <option value="">Select Partner</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Amount *</label>
              <input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date</label>
              <input type="date" value={form.investmentDate} onChange={(e) => setForm({ ...form, investmentDate: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Mode</label>
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full rounded-lg border p-2.5">
                {INVESTMENT_MODE_OPTIONS.map((m) => <option key={m} value={m}>{INVESTMENT_MODE_LABELS[m]}</option>)}
              </select>
            </div>
            {form.mode === "COMPANY_BANK" && (
              <div>
                <label className="mb-1 block text-sm font-medium">Bank Account *</label>
                <select value={form.companyBankAccountId ?? ""} onChange={(e) => setForm({ ...form, companyBankAccountId: e.target.value })} className="w-full rounded-lg border p-2.5">
                  <option value="">Select Account</option>
                  {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Reference #</label>
              <input value={form.referenceNumber ?? ""} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-medium">Remarks</label>
              <input value={form.remarks ?? ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Investment #</th>
                <th className="px-4 py-3 text-left">Partner</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Mode</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {investments.length === 0 ? (
                <EmptyTableRow colSpan={6}>No investments recorded yet.</EmptyTableRow>
              ) : (
                investments.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-4 py-3">{i.investmentNumber}</td>
                    <td className="px-4 py-3">{i.partner?.name ?? "—"}</td>
                    <td className="px-4 py-3">{i.investmentDate}</td>
                    <td className="px-4 py-3">{INVESTMENT_MODE_LABELS[i.mode] ?? i.mode}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(i.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(i.id)} aria-label="Delete" className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettlementsTab({ partners, bankAccounts }: { partners: Partner[]; bankAccounts: CompanyBankAccount[] }) {
  const [settlements, setSettlements] = useState<PartnerSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerSettlementFormData>({ partnerId: "", settlementType: "OTHER", amount: 0, settlementDate: todayISO(), mode: "CASH" });

  const load = () => {
    setLoading(true);
    getPartnerSettlements().then((r) => setSettlements(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partnerId) return setError("Select a partner.");
    if (!form.amount || form.amount <= 0) return setError("Enter an amount greater than zero.");
    if (form.mode === "COMPANY_BANK" && !form.companyBankAccountId) return setError("Select the company bank account.");
    setSaving(true);
    setError(null);
    try {
      await createPartnerSettlement(form);
      setShowForm(false);
      setForm({ partnerId: "", settlementType: "OTHER", amount: 0, settlementDate: todayISO(), mode: "CASH" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record settlement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this settlement record?")) return;
    try {
      await deletePartnerSettlement(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete settlement.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Settlement</h2>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Record Settlement
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Partner *</label>
              <select value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} className="w-full rounded-lg border p-2.5">
                <option value="">Select Partner</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select value={form.settlementType} onChange={(e) => setForm({ ...form, settlementType: e.target.value })} className="w-full rounded-lg border p-2.5">
                {SETTLEMENT_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{SETTLEMENT_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Amount *</label>
              <input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date</label>
              <input type="date" value={form.settlementDate} onChange={(e) => setForm({ ...form, settlementDate: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Mode</label>
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full rounded-lg border p-2.5">
                {SETTLEMENT_MODE_OPTIONS.map((m) => <option key={m} value={m}>{SETTLEMENT_MODE_LABELS[m]}</option>)}
              </select>
            </div>
            {form.mode === "COMPANY_BANK" && (
              <div>
                <label className="mb-1 block text-sm font-medium">Bank Account *</label>
                <select value={form.companyBankAccountId ?? ""} onChange={(e) => setForm({ ...form, companyBankAccountId: e.target.value })} className="w-full rounded-lg border p-2.5">
                  <option value="">Select Account</option>
                  {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName}</option>)}
                </select>
              </div>
            )}
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-medium">Remarks</label>
              <input value={form.remarks ?? ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Settlement #</th>
                <th className="px-4 py-3 text-left">Partner</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 ? (
                <EmptyTableRow colSpan={6}>No settlements recorded yet.</EmptyTableRow>
              ) : (
                settlements.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3">{s.settlementNumber}</td>
                    <td className="px-4 py-3">{s.partner?.name ?? "—"}</td>
                    <td className="px-4 py-3">{SETTLEMENT_TYPE_LABELS[s.settlementType] ?? s.settlementType}</td>
                    <td className="px-4 py-3">{s.settlementDate}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(s.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(s.id)} aria-label="Delete" className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AllocationLedgerTab() {
  const [rows, setRows] = useState<AllocationLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    getAllocationLedger({ allocationType: typeFilter || undefined }).then((r) => setRows(r.data)).finally(() => setLoading(false));
  }, [typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Allocation Ledger</h2>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border p-2.5 text-sm">
          <option value="">All Types</option>
          {Object.entries(ALLOCATION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <p className="text-sm text-slate-500">Every allocation ever saved from Banking — how invested and received capital has actually moved. Read directly from Banking's Transaction Allocation data.</p>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">Site</th>
                <th className="px-4 py-3 text-left">Bank Account</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyTableRow colSpan={6}>No allocations yet.</EmptyTableRow>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3">{ALLOCATION_TYPE_LABELS[r.allocationType] ?? r.allocationType}</td>
                    <td className="px-4 py-3 text-slate-500">{r.reference || r.partyName || "—"}</td>
                    <td className="px-4 py-3">{r.site || "—"}</td>
                    <td className="px-4 py-3">{r.bankAccount}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(r.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProfitSharingTab() {
  const [report, setReport] = useState<ProfitSharingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setLoading(true);
    getProfitSharingReport(fromDate || undefined, toDate || undefined).then(setReport).finally(() => setLoading(false));
  }, [fromDate, toDate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Profit Sharing</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5 text-sm" />
          <label className="text-sm text-slate-500">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5 text-sm" />
        </div>
      </div>
      <p className="text-sm text-slate-500">
        Net Profit (cash basis) = Client Receipts − Vendor Payments − Labour Payments − Site Expenses − GST − Office Expense. Read from existing Running Bill/Vendor/Labour/Expense/Banking ledgers — never recomputed elsewhere.
      </p>

      {loading || !report ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">Revenue (Client Receipts)</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">{inr(report.revenue)}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-red-700">Total Costs</p>
              <p className="mt-1 text-lg font-bold text-red-700">{inr(report.costs.total)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Net Profit</p>
              <p className={`mt-1 text-lg font-bold ${Number(report.netProfit) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(report.netProfit)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Share % Allocated</p>
              <p className="mt-1 text-lg font-bold">{report.totalSharePercentAllocated}%</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Cost Component</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="px-4 py-3">Vendor Payments</td><td className="px-4 py-3 text-right">{inr(report.costs.vendorPayments)}</td></tr>
                <tr className="border-t"><td className="px-4 py-3">Labour Payments</td><td className="px-4 py-3 text-right">{inr(report.costs.labourPayments)}</td></tr>
                <tr className="border-t"><td className="px-4 py-3">Site Expenses</td><td className="px-4 py-3 text-right">{inr(report.costs.siteExpenses)}</td></tr>
                <tr className="border-t"><td className="px-4 py-3">GST</td><td className="px-4 py-3 text-right">{inr(report.costs.gst)}</td></tr>
                <tr className="border-t"><td className="px-4 py-3">Office Expense</td><td className="px-4 py-3 text-right">{inr(report.costs.officeExpense)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Partner Shares</h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Partner</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Share %</th>
                    <th className="px-4 py-3 text-right">Share Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.shares.length === 0 ? (
                    <EmptyTableRow colSpan={4}>No partners with an active share yet.</EmptyTableRow>
                  ) : (
                    report.shares.map((s) => (
                      <tr key={s.partnerId} className="border-t">
                        <td className="px-4 py-3 font-medium">{s.partnerName}</td>
                        <td className="px-4 py-3">{PARTNER_TYPE_LABELS[s.partnerType]}</td>
                        <td className="px-4 py-3 text-right">{s.sharePercent}%</td>
                        <td className="px-4 py-3 text-right font-medium">{inr(s.shareAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportsTab() {
  const [summary, setSummary] = useState<PartnerCapitalSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPartnerCapitalSummary().then(setSummary).finally(() => setLoading(false));
  }, []);

  if (loading || !summary) return <LoadingState />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Capital Summary</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Invested</p>
          <p className="mt-1 text-lg font-bold">{inr(summary.totalInvested)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Settled</p>
          <p className="mt-1 text-lg font-bold">{inr(summary.totalSettled)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Active Share</p>
          <p className={`mt-1 text-lg font-bold ${Number(summary.totalSharePercent) > 100 ? "text-red-600" : ""}`}>{summary.totalSharePercent}%</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Partner</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Invested</th>
              <th className="px-4 py-3 text-right">Settled</th>
              <th className="px-4 py-3 text-right">Net Position</th>
            </tr>
          </thead>
          <tbody>
            {summary.partners.length === 0 ? (
              <EmptyTableRow colSpan={5}>No partners yet.</EmptyTableRow>
            ) : (
              summary.partners.map((p) => (
                <tr key={p.partnerId} className="border-t">
                  <td className="px-4 py-3 font-medium">{p.partnerName}</td>
                  <td className="px-4 py-3">{PARTNER_TYPE_LABELS[p.partnerType]}</td>
                  <td className="px-4 py-3 text-right">{inr(p.totalInvested)}</td>
                  <td className="px-4 py-3 text-right">{inr(p.totalSettled)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${Number(p.netPosition) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(p.netPosition)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
