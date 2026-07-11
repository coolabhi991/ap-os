import { useEffect, useState } from "react";
import { Plus, Upload, RefreshCw, Download, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import BankTransactionFormModal from "../../components/banking/BankTransactionFormModal";
import ImportTransactionsModal from "../../components/banking/ImportTransactionsModal";
import MatchTransactionModal from "../../components/banking/MatchTransactionModal";
import {
  getBankAccountsWithBalances,
  getBankTransactions,
  deleteBankTransaction,
  unmatchBankTransaction,
  runAutoReconcile,
  exportBankTransactionsCSV,
  RECONCILIATION_STATUS_OPTIONS,
  RECONCILIATION_STATUS_LABELS,
  RECONCILIATION_STATUS_COLORS,
} from "../../services/bank-transactions";
import type { BankAccountBalance, BankTransaction } from "../../services/bank-transactions";
import { ACCOUNT_TYPE_LABELS } from "../../services/company-bank-accounts";

export default function BankTransactions() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<BankAccountBalance[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [total, setTotal] = useState(0);

  const [accountFilter, setAccountFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState<BankTransaction | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [matchingTxn, setMatchingTxn] = useState<BankTransaction | null>(null);

  const loadAccounts = () => getBankAccountsWithBalances().then(setAccounts).catch(() => {});

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBankTransactions({
        search: search || undefined,
        companyBankAccountId: accountFilter || undefined,
        reconciliationStatus: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: 1,
        limit: 100,
      });
      setTransactions(result.data);
      setTotal(result.total);
    } catch {
      setError("Failed to load bank transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, accountFilter, statusFilter, fromDate, toDate]);

  const refreshAll = () => {
    load();
    loadAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this bank transaction?")) return;
    try {
      await deleteBankTransaction(id);
      refreshAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete transaction.");
    }
  };

  const handleUnmatch = async (id: string) => {
    if (!window.confirm("Unmatch this transaction?")) return;
    try {
      await unmatchBankTransaction(id);
      refreshAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unmatch transaction.");
    }
  };

  const handleAutoReconcile = async () => {
    setReconciling(true);
    try {
      const result = await runAutoReconcile(accountFilter || undefined);
      alert(`Scanned ${result.scanned} — Matched ${result.matched}, Partially Matched ${result.partiallyMatched}, Still Unmatched ${result.stillUnmatched}.`);
      refreshAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to run auto-reconciliation.");
    } finally {
      setReconciling(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportBankTransactionsCSV({ companyBankAccountId: accountFilter || undefined, reconciliationStatus: statusFilter || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined });
    } catch {
      alert("Failed to export transactions.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bank Transactions</h1>
            <p className="mt-2 text-slate-500">Every rupee, tracked and reconciled — {total} transaction{total === 1 ? "" : "s"}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate("/banking/reports")} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50">
              <BarChart3 className="h-4 w-4" /> Reports
            </button>
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60">
              <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export CSV"}
            </button>
            <button onClick={() => setShowImport(true)} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50">
              <Upload className="h-4 w-4" /> Import
            </button>
            <button onClick={handleAutoReconcile} disabled={reconciling} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw className="h-4 w-4" /> {reconciling ? "Reconciling..." : "Auto-Reconcile"}
            </button>
            <button onClick={() => { setEditingTxn(null); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New Transaction
            </button>
          </div>
        </div>

        {/* Account balance cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccountFilter(accountFilter === a.id ? "" : a.id)}
              className={`rounded-xl border bg-white p-5 text-left shadow-sm transition ${accountFilter === a.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"} ${!a.isActive ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{a.nickname || a.bankName}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.accountType === "CASH" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                  {ACCOUNT_TYPE_LABELS[a.accountType] ?? a.accountType}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">₹{Number(a.currentBalance).toLocaleString("en-IN")}</p>
              <p className="mt-1 text-xs text-slate-400">{a.transactionCount} transaction{a.transactionCount === 1 ? "" : "s"}</p>
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, description, category..."
              className="min-w-[220px] flex-1 rounded-lg border p-2.5"
            />
            <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="rounded-lg border p-2.5">
              <option value="">All Accounts</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border p-2.5">
              <option value="">All Statuses</option>
              {RECONCILIATION_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{RECONCILIATION_STATUS_LABELS[s]}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
              <label className="text-sm text-slate-500">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
            </div>
          </div>
        </div>

        {loading && <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-right">Deposit</th>
                  <th className="px-4 py-3 text-right">Withdrawal</th>
                  <th className="px-4 py-3 text-left">Matched Against</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={9} className="py-10 text-center text-slate-500">No bank transactions recorded yet.</td></tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3">{t.transactionDate}</td>
                      <td className="px-4 py-3">{t.companyBankAccount?.nickname || t.companyBankAccount?.bankName}</td>
                      <td className="px-4 py-3">{t.description || "—"}</td>
                      <td className="px-4 py-3">{t.referenceNumber || "—"}</td>
                      <td className="px-4 py-3 text-right">{Number(t.deposit) > 0 ? `₹${Number(t.deposit).toLocaleString("en-IN")}` : "—"}</td>
                      <td className="px-4 py-3 text-right">{Number(t.withdrawal) > 0 ? `₹${Number(t.withdrawal).toLocaleString("en-IN")}` : "—"}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {t.runningBillPayment ? `RB ${t.runningBillPayment.billNumber}` : t.vendorPayment ? `VB ${t.vendorPayment.billNumber}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RECONCILIATION_STATUS_COLORS[t.reconciliationStatus]}`}>
                          {RECONCILIATION_STATUS_LABELS[t.reconciliationStatus] ?? t.reconciliationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {t.reconciliationStatus === "UNMATCHED" ? (
                            <button onClick={() => setMatchingTxn(t)} className="text-sm text-blue-600 hover:underline">Match</button>
                          ) : (
                            <button onClick={() => handleUnmatch(t.id)} className="text-sm text-amber-600 hover:underline">Unmatch</button>
                          )}
                          <button onClick={() => { setEditingTxn(t); setShowForm(true); }} className="text-sm text-slate-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(t.id)} className="text-sm text-red-600 hover:underline">Delete</button>
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

      {showForm && (
        <BankTransactionFormModal
          accounts={accounts}
          initialData={editingTxn ?? undefined}
          defaultAccountId={accountFilter || undefined}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refreshAll(); }}
        />
      )}

      {showImport && (
        <ImportTransactionsModal accounts={accounts} onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); refreshAll(); }} />
      )}

      {matchingTxn && (
        <MatchTransactionModal transaction={matchingTxn} onClose={() => setMatchingTxn(null)} onMatched={() => { setMatchingTxn(null); refreshAll(); }} />
      )}
    </Layout>
  );
}
