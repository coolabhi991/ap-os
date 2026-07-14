import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, Printer } from "lucide-react";

import Layout from "../../components/layout/Layout";
import LoadingState from "../../components/ui/LoadingState";
import EmptyTableRow from "../../components/ui/EmptyTableRow";
import { formatCurrency as inr, todayISO } from "../../lib/utils";
import {
  getLiabilities,
  createLiability,
  updateLiability,
  deleteLiability,
  LIABILITY_TYPES,
  LIABILITY_TYPE_LABELS,
  LIABILITY_INTEREST_TYPES,
  LIABILITY_INTEREST_TYPE_LABELS,
  LIABILITY_SECURITY_TYPES,
  LIABILITY_SECURITY_LABELS,
  LIABILITY_STATUSES,
  LIABILITY_STATUS_LABELS,
  LIABILITY_STATUS_COLORS,
} from "../../services/liabilities";
import type { Liability, LiabilityFormData } from "../../services/liabilities";
import { getLiabilityRepayments } from "../../services/liability-repayments";
import type { LiabilityRepayment } from "../../services/liability-repayments";
import BankAccountsModal from "../../components/banking/BankAccountsModal";
import ReportExportBar from "../../components/ui/ReportExportBar";
import {
  getFinanceDashboard,
  getLiabilitySummaryReport,
  getOutstandingReport,
  getInterestPaidReport,
  getEMISchedule,
  getCreditCardReport,
  getCCUtilizationReport,
  getFundingSourceReport,
  getEMICalendar,
  getLiabilityTimeline,
  getBankWiseRepaymentReport,
} from "../../services/finance-reports";
import type {
  FinanceDashboard,
  LiabilitySummaryRow,
  OutstandingReport,
  InterestPaidReport,
  EMIScheduleRow,
  CreditCardReportRow,
  CCUtilizationReport,
  FundingSourceRow,
  EMICalendarDay,
  LiabilityTimelineEntry,
  BankWiseRepaymentRow,
} from "../../services/finance-reports";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "liabilities", label: "Liabilities" },
  { key: "credit-cards", label: "Credit Cards" },
  { key: "repayment-history", label: "Repayment History" },
  { key: "interest-history", label: "Interest History" },
  { key: "reports", label: "Reports" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const emptyForm: LiabilityFormData = {
  loanName: "",
  liabilityType: "BANK_LOAN",
  lenderName: "",
  lenderMobile: "",
  bankName: "",
  branch: "",
  accountNumber: "",
  loanNumber: "",
  sanctionAmount: 0,
  outstandingAmount: 0,
  interestType: "NONE",
  interestRate: 0,
  emiAmount: 0,
  emiDate: undefined,
  statementDate: undefined,
  minimumDue: 0,
  startDate: todayISO(),
  endDate: "",
  security: "NONE",
  status: "ACTIVE",
  notes: "",
};

export default function Finance() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = (TABS.find((t) => t.key === tabParam)?.key ?? "dashboard") as TabKey;
  const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Finance</h1>
          <p className="mt-2 text-slate-500">Every liability, its outstanding balance, and every repayment — repayments only ever arrive through Banking's Transaction Allocation.</p>
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

        {tab === "dashboard" && <DashboardTab />}
        {tab === "liabilities" && <LiabilitiesTab />}
        {tab === "credit-cards" && <CreditCardsTab />}
        {tab === "repayment-history" && <RepaymentHistoryTab />}
        {tab === "interest-history" && <InterestHistoryTab />}
        {tab === "reports" && <ReportsTab />}
      </div>
    </Layout>
  );
}

function DashboardTab() {
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinanceDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Liabilities</p>
          <p className="mt-1 text-lg font-bold">{data.totalLiabilities}</p>
          <p className="mt-1 text-xs text-slate-400">{data.activeLiabilities} active</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Outstanding</p>
          <p className="mt-1 text-lg font-bold text-red-600">{inr(data.totalOutstanding)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Monthly EMI</p>
          <p className="mt-1 text-lg font-bold">{inr(data.monthlyEMI)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Monthly Interest Paid</p>
          <p className="mt-1 text-lg font-bold">{inr(data.monthlyInterestPaid)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">CC Utilization</p>
          <p className={`mt-1 text-lg font-bold ${data.ccUtilizationPercent > 80 ? "text-red-600" : "text-slate-900"}`}>{data.ccUtilizationPercent}%</p>
          <p className="mt-1 text-xs text-slate-400">{inr(data.totalRevolvingOutstanding)} of {inr(data.totalRevolvingLimit)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Upcoming Due</h2>
          <div className="mt-3 space-y-2">
            {data.upcomingDue.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No upcoming EMI due dates.</p>
            ) : (
              data.upcomingDue.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{u.loanName}</p>
                    <p className="text-xs text-slate-500">{LIABILITY_TYPE_LABELS[u.liabilityType] ?? u.liabilityType} · Day {u.emiDate} of month</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{inr(u.emiAmount)}</p>
                    <p className="text-xs text-slate-500">in {u.daysUntil}d</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Loan Distribution</h2>
          <div className="mt-3 space-y-2">
            {data.loanDistribution.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No active liabilities.</p>
            ) : (
              data.loanDistribution.map((d) => (
                <div key={d.liabilityType} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                  <p className="text-sm font-medium">{LIABILITY_TYPE_LABELS[d.liabilityType] ?? d.liabilityType}</p>
                  <p className="font-semibold">{inr(d.outstanding)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Recent Repayments</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Loan</th>
                <th className="px-4 py-3 text-right">Principal</th>
                <th className="px-4 py-3 text-right">Interest</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Bank Account</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRepayments.length === 0 ? (
                <EmptyTableRow colSpan={6}>No repayments recorded yet.</EmptyTableRow>
              ) : (
                data.recentRepayments.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">{r.paymentDate}</td>
                    <td className="px-4 py-3">{r.liability}</td>
                    <td className="px-4 py-3 text-right">{inr(r.principalPaid)}</td>
                    <td className="px-4 py-3 text-right">{inr(r.interestPaid)}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(r.totalPaid)}</td>
                    <td className="px-4 py-3 text-slate-500">{r.bankAccount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LiabilitiesTab() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LiabilityFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bankAccountsFor, setBankAccountsFor] = useState<Liability | null>(null);

  const load = () => {
    setLoading(true);
    getLiabilities({ liabilityType: typeFilter || undefined, status: statusFilter || undefined })
      .then((r) => setLiabilities(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [typeFilter, statusFilter]);

  const startAdd = () => { setEditingId(null); setForm(emptyForm); setError(null); setShowForm(true); };
  const startEdit = (l: Liability) => {
    setEditingId(l.id);
    setForm({
      loanName: l.loanName,
      liabilityType: l.liabilityType,
      lenderName: l.lenderName,
      lenderMobile: l.lenderMobile,
      bankName: l.bankName,
      branch: l.branch,
      accountNumber: l.accountNumber,
      loanNumber: l.loanNumber,
      sanctionAmount: Number(l.sanctionAmount),
      outstandingAmount: Number(l.outstandingAmount),
      interestType: l.interestType,
      interestRate: Number(l.interestRate),
      emiAmount: Number(l.emiAmount),
      emiDate: l.emiDate ?? undefined,
      statementDate: l.statementDate ?? undefined,
      minimumDue: Number(l.minimumDue),
      startDate: l.startDate,
      endDate: l.endDate,
      security: l.security,
      status: l.status,
      notes: l.notes,
    });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.loanName.trim()) return setError("Loan name is required.");
    if (!form.sanctionAmount || form.sanctionAmount <= 0) return setError("Sanction amount must be greater than zero.");
    setSaving(true);
    setError(null);
    try {
      if (editingId) await updateLiability(editingId, form);
      else await createLiability(form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save liability.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this liability?")) return;
    try {
      await deleteLiability(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete liability.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border p-2.5 text-sm">
            <option value="">All Types</option>
            {LIABILITY_TYPES.map((t) => <option key={t} value={t}>{LIABILITY_TYPE_LABELS[t]}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border p-2.5 text-sm">
            <option value="">All Statuses</option>
            {LIABILITY_STATUSES.map((s) => <option key={s} value={s}>{LIABILITY_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <button onClick={startAdd} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
          <Plus size={18} />
          Add Liability
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Loan Name *</label>
              <input value={form.loanName} onChange={(e) => setForm({ ...form, loanName: e.target.value })} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Liability Type</label>
              <select value={form.liabilityType} onChange={(e) => setForm({ ...form, liabilityType: e.target.value })} className="w-full rounded-lg border p-2.5">
                {LIABILITY_TYPES.map((t) => <option key={t} value={t}>{LIABILITY_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Lender Name</label>
              <input value={form.lenderName} onChange={(e) => setForm({ ...form, lenderName: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Lender Mobile</label>
              <input value={form.lenderMobile} onChange={(e) => setForm({ ...form, lenderMobile: e.target.value })} placeholder="For Friend / Relative loans" className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Bank Name</label>
              <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Branch</label>
              <input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Account Number</label>
              <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="Masked Card Number for Credit Cards" className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Loan Number</label>
              <input value={form.loanNumber} onChange={(e) => setForm({ ...form, loanNumber: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Sanction Amount *</label>
              <input type="number" min={0} step="0.01" value={form.sanctionAmount} onChange={(e) => setForm({ ...form, sanctionAmount: Number(e.target.value) || 0 })} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Outstanding Amount</label>
              <input type="number" min={0} step="0.01" value={form.outstandingAmount} onChange={(e) => setForm({ ...form, outstandingAmount: Number(e.target.value) || 0 })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Interest Type</label>
              <select value={form.interestType} onChange={(e) => setForm({ ...form, interestType: e.target.value })} className="w-full rounded-lg border p-2.5">
                {LIABILITY_INTEREST_TYPES.map((t) => <option key={t} value={t}>{LIABILITY_INTEREST_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Interest Rate (%)</label>
              <input type="number" min={0} step="0.01" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) || 0 })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">EMI Amount</label>
              <input type="number" min={0} step="0.01" value={form.emiAmount} onChange={(e) => setForm({ ...form, emiAmount: Number(e.target.value) || 0 })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Due Date (day of month)</label>
              <input type="number" min={1} max={31} value={form.emiDate ?? ""} onChange={(e) => setForm({ ...form, emiDate: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Statement Date (day of month)</label>
              <input type="number" min={1} max={31} value={form.statementDate ?? ""} onChange={(e) => setForm({ ...form, statementDate: e.target.value ? Number(e.target.value) : undefined })} placeholder="Credit Card / CC / OD" className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Minimum Due</label>
              <input type="number" min={0} step="0.01" value={form.minimumDue} onChange={(e) => setForm({ ...form, minimumDue: Number(e.target.value) || 0 })} placeholder="Credit Card only" className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Start Date *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Security</label>
              <select value={form.security} onChange={(e) => setForm({ ...form, security: e.target.value })} className="w-full rounded-lg border p-2.5">
                {LIABILITY_SECURITY_TYPES.map((s) => <option key={s} value={s}>{LIABILITY_SECURITY_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border p-2.5" />
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Loan Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Lender / Bank</th>
                <th className="px-4 py-3 text-right">Sanctioned</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-right">EMI</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {liabilities.length === 0 ? (
                <EmptyTableRow colSpan={8}>No liabilities recorded yet.</EmptyTableRow>
              ) : (
                liabilities.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{l.loanName}</td>
                    <td className="px-4 py-3">{LIABILITY_TYPE_LABELS[l.liabilityType] ?? l.liabilityType}</td>
                    <td className="px-4 py-3 text-slate-500">{l.lenderName || l.bankName || "—"}</td>
                    <td className="px-4 py-3 text-right">{inr(l.sanctionAmount)}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(l.outstandingAmount)}</td>
                    <td className="px-4 py-3 text-right">{Number(l.emiAmount) > 0 ? inr(l.emiAmount) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${LIABILITY_STATUS_COLORS[l.status]}`}>{LIABILITY_STATUS_LABELS[l.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setBankAccountsFor(l)} className="text-sm text-slate-600 hover:underline">Bank Accounts</button>
                        <button onClick={() => startEdit(l)} className="text-sm text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(l.id)} aria-label="Delete" className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {bankAccountsFor && (
        <BankAccountsModal
          ownerType="LIABILITY"
          ownerId={bankAccountsFor.id}
          ownerName={bankAccountsFor.loanName}
          onClose={() => setBankAccountsFor(null)}
        />
      )}
    </div>
  );
}

const emptyCreditCardForm: LiabilityFormData = {
  loanName: "",
  liabilityType: "CREDIT_CARD",
  bankName: "",
  accountNumber: "",
  sanctionAmount: 0,
  outstandingAmount: 0,
  emiDate: undefined,
  statementDate: undefined,
  minimumDue: 0,
  startDate: todayISO(),
  notes: "",
};

/**
 * Credit Cards — a dedicated section under Finance, but not a separate data model: every Credit
 * Card is a Liability with liabilityType = CREDIT_CARD (schema already shapes Liability's
 * statementDate/minimumDue fields specifically for this — see schema.prisma). This tab is a
 * purpose-built, compact create/edit form + list (Card Name, Bank, Masked Card Number, Credit
 * Limit, Billing Date, Due Date, Current Outstanding, Available Limit, Status) instead of the
 * full generic Liability form, which carries loan-only fields (Interest Rate, EMI, Security) that
 * don't apply to a card. Paying a Credit Card bill is deliberately NOT done here — exactly like
 * Liability repayments, it only ever happens through Banking's Transaction Allocation
 * ("Credit Card Bill Payment" allocation type), so Outstanding is never a second, independently
 * editable figure.
 */
function CreditCardsTab() {
  const [cards, setCards] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LiabilityFormData>(emptyCreditCardForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getLiabilities({ liabilityType: "CREDIT_CARD" })
      .then((r) => setCards(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const startAdd = () => { setEditingId(null); setForm(emptyCreditCardForm); setError(null); setShowForm(true); };
  const startEdit = (c: Liability) => {
    setEditingId(c.id);
    setForm({
      loanName: c.loanName,
      liabilityType: "CREDIT_CARD",
      bankName: c.bankName,
      accountNumber: c.accountNumber,
      sanctionAmount: Number(c.sanctionAmount),
      outstandingAmount: Number(c.outstandingAmount),
      emiDate: c.emiDate ?? undefined,
      statementDate: c.statementDate ?? undefined,
      minimumDue: Number(c.minimumDue),
      startDate: c.startDate,
      notes: c.notes,
    });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.loanName.trim()) return setError("Card name is required.");
    if (!form.sanctionAmount || form.sanctionAmount <= 0) return setError("Credit Limit must be greater than zero.");
    setSaving(true);
    setError(null);
    try {
      if (editingId) await updateLiability(editingId, form);
      else await createLiability(form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Credit Card.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this Credit Card?")) return;
    try {
      await deleteLiability(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete Credit Card.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Credit Card bill payments are recorded from Banking &gt; Transaction Allocation (Credit Card Bill Payment) — never here directly.
        </p>
        <button onClick={startAdd} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
          <Plus size={18} />
          Add Credit Card
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Card Name *</label>
              <input value={form.loanName} onChange={(e) => setForm({ ...form, loanName: e.target.value })} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Bank</label>
              <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Masked Card Number</label>
              <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="Last 4 digits, e.g. 4321" className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Credit Limit *</label>
              <input type="number" min={0} step="0.01" value={form.sanctionAmount} onChange={(e) => setForm({ ...form, sanctionAmount: Number(e.target.value) || 0 })} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Current Outstanding</label>
              <input type="number" min={0} step="0.01" value={form.outstandingAmount} onChange={(e) => setForm({ ...form, outstandingAmount: Number(e.target.value) || 0 })} disabled={!!editingId} className="w-full rounded-lg border p-2.5 disabled:bg-slate-100" />
              {editingId && <p className="mt-1 text-xs text-slate-400">Only changes via Site Expenses (Credit Card mode) and Credit Card Bill Payment once set.</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Minimum Due</label>
              <input type="number" min={0} step="0.01" value={form.minimumDue} onChange={(e) => setForm({ ...form, minimumDue: Number(e.target.value) || 0 })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Billing Date (day of month)</label>
              <input type="number" min={1} max={31} value={form.statementDate ?? ""} onChange={(e) => setForm({ ...form, statementDate: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Due Date (day of month)</label>
              <input type="number" min={1} max={31} value={form.emiDate ?? ""} onChange={(e) => setForm({ ...form, emiDate: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-lg border p-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Card Since</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="w-full rounded-lg border p-2.5" />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border p-2.5" />
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Card Name</th>
                <th className="px-4 py-3 text-left">Bank</th>
                <th className="px-4 py-3 text-left">Masked Number</th>
                <th className="px-4 py-3 text-right">Credit Limit</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-right">Available Limit</th>
                <th className="px-4 py-3 text-right">Billing Day</th>
                <th className="px-4 py-3 text-right">Due Day</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <EmptyTableRow colSpan={10}>No Credit Cards recorded yet.</EmptyTableRow>
              ) : (
                cards.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{c.loanName}</td>
                    <td className="px-4 py-3">{c.bankName || "—"}</td>
                    <td className="px-4 py-3">{c.accountNumber ? `••••${c.accountNumber.slice(-4)}` : "—"}</td>
                    <td className="px-4 py-3 text-right">{inr(c.sanctionAmount)}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(c.outstandingAmount)}</td>
                    <td className="px-4 py-3 text-right">{inr(c.availableLimit)}</td>
                    <td className="px-4 py-3 text-right">{c.statementDate ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{c.emiDate ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${LIABILITY_STATUS_COLORS[c.status]}`}>{LIABILITY_STATUS_LABELS[c.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => startEdit(c)} className="text-sm text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(c.id)} aria-label="Delete" className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
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

function RepaymentHistoryTab() {
  const navigate = useNavigate();
  const [repayments, setRepayments] = useState<LiabilityRepayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setLoading(true);
    getLiabilityRepayments({ fromDate: fromDate || undefined, toDate: toDate || undefined })
      .then((r) => setRepayments(r.data))
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Repayment History</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5 text-sm" />
          <label className="text-sm text-slate-500">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5 text-sm" />
        </div>
      </div>
      <p className="text-sm text-slate-500">Every repayment originates from Banking's Transaction Allocation — none can be entered here directly.</p>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Repayment #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Liability</th>
                <th className="px-4 py-3 text-right">Principal Paid</th>
                <th className="px-4 py-3 text-right">Interest Paid</th>
                <th className="px-4 py-3 text-right">Total Paid</th>
                <th className="px-4 py-3 text-left">Paid From</th>
                <th className="px-4 py-3 text-left">Remarks</th>
                <th className="px-4 py-3 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {repayments.length === 0 ? (
                <EmptyTableRow colSpan={9}>No repayments recorded yet.</EmptyTableRow>
              ) : (
                repayments.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">{r.repaymentNumber}</td>
                    <td className="px-4 py-3">{r.paymentDate}</td>
                    <td className="px-4 py-3">{r.liability?.loanName ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{inr(r.principalPaid)}</td>
                    <td className="px-4 py-3 text-right">{inr(r.interestPaid)}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(r.totalPaid)}</td>
                    <td className="px-4 py-3 text-slate-500">{r.companyBankAccount?.nickname || r.companyBankAccount?.bankName || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{r.remarks || "—"}</td>
                    <td className="px-4 py-3">
                      {r.sourceBankTransaction ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/banking/accounts/${r.sourceBankTransaction!.companyBankAccountId}`)}
                          className="text-blue-600 hover:underline"
                        >
                          Open Bank Transaction
                        </button>
                      ) : (
                        "—"
                      )}
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

function InterestHistoryTab() {
  const [report, setReport] = useState<InterestPaidReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setLoading(true);
    getInterestPaidReport(fromDate || undefined, toDate || undefined).then(setReport).finally(() => setLoading(false));
  }, [fromDate, toDate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Interest History</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5 text-sm" />
          <label className="text-sm text-slate-500">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5 text-sm" />
        </div>
      </div>

      {loading || !report ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Total Interest Paid (filtered)</p>
              <p className="mt-1 text-lg font-bold">{inr(report.totalInterestPaid)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Interest Paid This Year</p>
              <p className="mt-1 text-lg font-bold">{inr(report.thisYearInterestPaid)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Liability Type</th>
                  <th className="px-4 py-3 text-right">Interest Paid</th>
                </tr>
              </thead>
              <tbody>
                {report.byLiabilityType.length === 0 ? (
                  <EmptyTableRow colSpan={2}>No interest paid yet.</EmptyTableRow>
                ) : (
                  report.byLiabilityType.map((r) => (
                    <tr key={r.liabilityType} className="border-t">
                      <td className="px-4 py-3">{LIABILITY_TYPE_LABELS[r.liabilityType] ?? r.liabilityType}</td>
                      <td className="px-4 py-3 text-right font-medium">{inr(r.interestPaid)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Liability</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Interest Paid</th>
                </tr>
              </thead>
              <tbody>
                {report.repayments.length === 0 ? (
                  <EmptyTableRow colSpan={4}>No interest paid yet.</EmptyTableRow>
                ) : (
                  report.repayments.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-3">{r.paymentDate}</td>
                      <td className="px-4 py-3">{r.liability}</td>
                      <td className="px-4 py-3">{LIABILITY_TYPE_LABELS[r.liabilityType] ?? r.liabilityType}</td>
                      <td className="px-4 py-3 text-right">{inr(r.interestPaid)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const REPORT_KEYS = [
  "liability-summary",
  "outstanding",
  "emi-schedule",
  "emi-calendar",
  "credit-card",
  "cc-utilization",
  "funding-source",
  "liability-timeline",
  "bank-wise-repayment",
] as const;
type ReportKey = (typeof REPORT_KEYS)[number];
const REPORT_LABELS: Record<ReportKey, string> = {
  "liability-summary": "Liability Summary",
  outstanding: "Outstanding Report",
  "emi-schedule": "EMI Schedule",
  "emi-calendar": "EMI Calendar",
  "credit-card": "Credit Card Report",
  "cc-utilization": "CC Utilization Report",
  "funding-source": "Funding Source Report",
  "liability-timeline": "Liability Timeline",
  "bank-wise-repayment": "Bank-wise Repayment",
};

function ReportsTab() {
  const [report, setReport] = useState<ReportKey>("liability-summary");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex flex-wrap gap-2">
          {REPORT_KEYS.map((r) => (
            <button
              key={r}
              onClick={() => setReport(r)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${report === r ? "bg-slate-900 text-white" : "bg-white text-slate-600 shadow-sm hover:bg-slate-100"}`}
            >
              {REPORT_LABELS[r]}
            </button>
          ))}
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>
      {report === "liability-summary" && <LiabilitySummaryReportView />}
      {report === "outstanding" && <OutstandingReportView />}
      {report === "emi-schedule" && <EMIScheduleReportView />}
      {report === "emi-calendar" && <EMICalendarReportView />}
      {report === "credit-card" && <CreditCardReportView />}
      {report === "cc-utilization" && <CCUtilizationReportView />}
      {report === "funding-source" && <FundingSourceReportView />}
      {report === "liability-timeline" && <LiabilityTimelineReportView />}
      {report === "bank-wise-repayment" && <BankWiseRepaymentReportView />}
    </div>
  );
}

function LiabilitySummaryReportView() {
  const [rows, setRows] = useState<LiabilitySummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getLiabilitySummaryReport().then(setRows).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="space-y-3">
      <div className="flex justify-end print:hidden">
        <ReportExportBar
          input={{
            title: "Liability Summary Report",
            columns: [
              { key: "loanName", label: "Loan Name" },
              { key: "liabilityType", label: "Type" },
              { key: "sanctionAmount", label: "Sanctioned", align: "right" },
              { key: "outstandingAmount", label: "Outstanding", align: "right" },
              { key: "repaidSoFar", label: "Repaid So Far", align: "right" },
              { key: "status", label: "Status" },
            ],
            rows: rows.map((r) => ({
              loanName: r.loanName,
              liabilityType: LIABILITY_TYPE_LABELS[r.liabilityType] ?? r.liabilityType,
              sanctionAmount: r.sanctionAmount,
              outstandingAmount: r.outstandingAmount,
              repaidSoFar: r.repaidSoFar,
              status: LIABILITY_STATUS_LABELS[r.status] ?? r.status,
            })),
            totals: {
              loanName: "TOTAL",
              sanctionAmount: rows.reduce((s, r) => s + Number(r.sanctionAmount), 0).toFixed(2),
              outstandingAmount: rows.reduce((s, r) => s + Number(r.outstandingAmount), 0).toFixed(2),
              repaidSoFar: rows.reduce((s, r) => s + Number(r.repaidSoFar), 0).toFixed(2),
            },
          }}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Loan Name</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Sanctioned</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
              <th className="px-4 py-3 text-right">Repaid So Far</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyTableRow colSpan={6}>No liabilities recorded yet.</EmptyTableRow>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{r.loanName}</td>
                  <td className="px-4 py-3">{LIABILITY_TYPE_LABELS[r.liabilityType] ?? r.liabilityType}</td>
                  <td className="px-4 py-3 text-right">{inr(r.sanctionAmount)}</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(r.outstandingAmount)}</td>
                  <td className="px-4 py-3 text-right">{inr(r.repaidSoFar)}</td>
                  <td className="px-4 py-3">{LIABILITY_STATUS_LABELS[r.status] ?? r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutstandingReportView() {
  const [report, setReport] = useState<OutstandingReport | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getOutstandingReport().then(setReport).finally(() => setLoading(false)); }, []);
  if (loading || !report) return <LoadingState />;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">Total Outstanding (Active Liabilities)</p>
        <p className="mt-1 text-lg font-bold">{inr(report.totalOutstanding)}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Liability Type</th>
              <th className="px-4 py-3 text-right">Count</th>
              <th className="px-4 py-3 text-right">Sanctioned</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 ? (
              <EmptyTableRow colSpan={4}>No active liabilities.</EmptyTableRow>
            ) : (
              report.rows.map((r) => (
                <tr key={r.liabilityType} className="border-t">
                  <td className="px-4 py-3">{LIABILITY_TYPE_LABELS[r.liabilityType] ?? r.liabilityType}</td>
                  <td className="px-4 py-3 text-right">{r.count}</td>
                  <td className="px-4 py-3 text-right">{inr(r.sanctionedAmount)}</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(r.outstandingAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EMIScheduleReportView() {
  const [rows, setRows] = useState<EMIScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getEMISchedule().then(setRows).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="space-y-3">
      <div className="flex justify-end print:hidden">
        <ReportExportBar
          input={{
            title: "EMI Schedule Report",
            columns: [
              { key: "loanName", label: "Loan Name" },
              { key: "liabilityType", label: "Type" },
              { key: "emiAmount", label: "EMI Amount", align: "right" },
              { key: "emiDate", label: "EMI Day", align: "right" },
              { key: "daysUntil", label: "Days Until Due", align: "right" },
              { key: "outstandingAmount", label: "Outstanding", align: "right" },
            ],
            rows: rows.map((r) => ({
              loanName: r.loanName,
              liabilityType: LIABILITY_TYPE_LABELS[r.liabilityType] ?? r.liabilityType,
              emiAmount: r.emiAmount,
              emiDate: r.emiDate ?? "",
              daysUntil: r.daysUntil,
              outstandingAmount: r.outstandingAmount,
            })),
            totals: { loanName: "TOTAL", emiAmount: rows.reduce((s, r) => s + Number(r.emiAmount), 0).toFixed(2) },
          }}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-left">Loan Name</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-right">EMI Amount</th>
            <th className="px-4 py-3 text-right">EMI Day</th>
            <th className="px-4 py-3 text-right">Days Until Due</th>
            <th className="px-4 py-3 text-right">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={6}>No EMI-bearing liabilities.</EmptyTableRow>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 font-medium">{r.loanName}</td>
                <td className="px-4 py-3">{LIABILITY_TYPE_LABELS[r.liabilityType] ?? r.liabilityType}</td>
                <td className="px-4 py-3 text-right">{inr(r.emiAmount)}</td>
                <td className="px-4 py-3 text-right">{r.emiDate ?? "—"}</td>
                <td className="px-4 py-3 text-right">{r.daysUntil}</td>
                <td className="px-4 py-3 text-right">{inr(r.outstandingAmount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function CreditCardReportView() {
  const [rows, setRows] = useState<CreditCardReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getCreditCardReport().then(setRows).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-left">Card</th>
            <th className="px-4 py-3 text-left">Bank</th>
            <th className="px-4 py-3 text-left">Masked Number</th>
            <th className="px-4 py-3 text-right">Credit Limit</th>
            <th className="px-4 py-3 text-right">Outstanding</th>
            <th className="px-4 py-3 text-right">Available Limit</th>
            <th className="px-4 py-3 text-right">Min Due</th>
            <th className="px-4 py-3 text-right">Statement Day</th>
            <th className="px-4 py-3 text-right">Due Day</th>
            <th className="px-4 py-3 text-right">Utilization</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={11}>No Credit Cards recorded.</EmptyTableRow>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 font-medium">{r.loanName}</td>
                <td className="px-4 py-3">{r.bankName || "—"}</td>
                <td className="px-4 py-3">{r.maskedCardNumber || "—"}</td>
                <td className="px-4 py-3 text-right">{inr(r.creditLimit)}</td>
                <td className="px-4 py-3 text-right">{inr(r.outstandingAmount)}</td>
                <td className="px-4 py-3 text-right">{inr(r.availableLimit)}</td>
                <td className="px-4 py-3 text-right">{inr(r.minimumDue)}</td>
                <td className="px-4 py-3 text-right">{r.statementDate ?? "—"}</td>
                <td className="px-4 py-3 text-right">{r.dueDate ?? "—"}</td>
                <td className={`px-4 py-3 text-right font-medium ${r.utilizationPercent > 80 ? "text-red-600" : ""}`}>{r.utilizationPercent}%</td>
                <td className="px-4 py-3">{LIABILITY_STATUS_LABELS[r.status] ?? r.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function CCUtilizationReportView() {
  const [report, setReport] = useState<CCUtilizationReport | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getCCUtilizationReport().then(setReport).finally(() => setLoading(false)); }, []);
  if (loading || !report) return <LoadingState />;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">Overall Utilization (CC + Cash Credit + Overdraft)</p>
        <p className={`mt-1 text-lg font-bold ${report.overallUtilizationPercent > 80 ? "text-red-600" : ""}`}>{report.overallUtilizationPercent}%</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Loan Name</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Limit</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
              <th className="px-4 py-3 text-right">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 ? (
              <EmptyTableRow colSpan={5}>No revolving credit liabilities.</EmptyTableRow>
            ) : (
              report.rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{r.loanName}</td>
                  <td className="px-4 py-3">{LIABILITY_TYPE_LABELS[r.liabilityType] ?? r.liabilityType}</td>
                  <td className="px-4 py-3 text-right">{inr(r.limit)}</td>
                  <td className="px-4 py-3 text-right">{inr(r.outstanding)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${r.utilizationPercent > 80 ? "text-red-600" : ""}`}>{r.utilizationPercent}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FundingSourceReportView() {
  const [rows, setRows] = useState<FundingSourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getFundingSourceReport().then(setRows).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Every borrowed amount, traced from its disbursement bank account to what it funded afterward.</p>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">No liability disbursements recorded yet.</div>
      ) : (
        rows.map((r, i) => (
          <div key={`${r.liabilityId}-${i}`} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{r.loanName}</h3>
                <p className="text-sm text-slate-500">{LIABILITY_TYPE_LABELS[r.liabilityType] ?? r.liabilityType} · Disbursed {r.disbursedOn} into {r.bankAccount}</p>
              </div>
              <p className="text-lg font-bold">{inr(r.disbursementAmount)}</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Allocated To</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {r.allocatedTo.length === 0 ? (
                    <EmptyTableRow colSpan={2}>Not yet spent from this account.</EmptyTableRow>
                  ) : (
                    r.allocatedTo.map((a) => (
                      <tr key={a.destination} className="border-t border-slate-100">
                        <td className="px-4 py-2">{a.destination}</td>
                        <td className="px-4 py-2 text-right">{inr(a.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function EMICalendarReportView() {
  const [days, setDays] = useState<EMICalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getEMICalendar().then(setDays).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Every active EMI, grouped by its due day of the month.</p>
      {days.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">No EMI-bearing liabilities.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {days.map((d) => (
            <div key={d.day} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900">Day {d.day}</p>
                <p className="text-sm font-medium">{inr(d.totalAmount)}</p>
              </div>
              <div className="mt-2 space-y-1">
                {d.items.map((it) => (
                  <div key={it.liabilityId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{it.loanName}</span>
                    <span className="text-slate-500">{inr(it.emiAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LiabilityTimelineReportView() {
  const [entries, setEntries] = useState<LiabilityTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getLiabilityTimeline().then(setEntries).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Liability</th>
            <th className="px-4 py-3 text-left">Bank Account</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <EmptyTableRow colSpan={5}>No disbursements or repayments recorded yet.</EmptyTableRow>
          ) : (
            entries.map((e, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3">{e.date}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${e.type === "DISBURSEMENT" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {e.type === "DISBURSEMENT" ? "Disbursement" : "Repayment"}
                  </span>
                </td>
                <td className="px-4 py-3">{e.loanName}</td>
                <td className="px-4 py-3 text-slate-500">{e.bankAccount}</td>
                <td className="px-4 py-3 text-right font-medium">{inr(e.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function BankWiseRepaymentReportView() {
  const [rows, setRows] = useState<BankWiseRepaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getBankWiseRepaymentReport().then(setRows).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">A Liability can be repaid from any Bank Account — this groups every repayment by the account that actually funded it.</p>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">No repayments recorded yet.</div>
      ) : (
        rows.map((b) => (
          <div key={b.bankAccountId} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{b.bankAccount}</h3>
              <p className="text-lg font-bold">{inr(b.totalPaid)} <span className="text-sm font-normal text-slate-500">({b.count} repayment{b.count === 1 ? "" : "s"})</span></p>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Repayment #</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Liability</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {b.repayments.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-4 py-2">{r.repaymentNumber}</td>
                      <td className="px-4 py-2">{r.paymentDate}</td>
                      <td className="px-4 py-2">{r.liability}</td>
                      <td className="px-4 py-2 text-right">{inr(r.totalPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
