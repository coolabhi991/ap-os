import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Download } from "lucide-react";

import Layout from "../../components/layout/Layout";
import ImportTransactionsModal from "../../components/banking/ImportTransactionsModal";
import AllocateTransactionModal from "../../components/banking/AllocateTransactionModal";
import {
  getBankAccountsWithBalances,
  getBankTransactions,
  exportBankTransactionsCSV,
  ALLOCATION_STATUS_LABELS,
  ALLOCATION_STATUS_COLORS,
} from "../../services/bank-transactions";
import type { BankAccountBalance, BankTransaction } from "../../services/bank-transactions";
import { ACCOUNT_TYPE_LABELS } from "../../services/company-bank-accounts";

export default function BankAccountStatement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<BankAccountBalance | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [allocatingTxn, setAllocatingTxn] = useState<BankTransaction | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [accounts, result] = await Promise.all([
        getBankAccountsWithBalances(),
        getBankTransactions({ companyBankAccountId: id, page: 1, limit: 200, sortOrder: "desc" }),
      ]);
      const found = accounts.find((a) => a.id === id);
      if (!found) {
        setError("Bank account not found.");
      } else {
        setAccount(found);
        setTransactions(result.data);
      }
    } catch {
      setError("Failed to load statement history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleExport = async () => {
    if (!id) return;
    setExporting(true);
    try {
      await exportBankTransactionsCSV({ companyBankAccountId: id });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading statement history...</div>
      </Layout>
    );
  }

  if (error || !account) {
    return (
      <Layout>
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <button onClick={() => navigate("/banking")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} /> Back to Banking
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{account.nickname || account.bankName}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${account.accountType === "CASH" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                {ACCOUNT_TYPE_LABELS[account.accountType] ?? account.accountType}
              </span>
            </div>
            {account.accountType !== "CASH" && <p className="mt-1 text-sm text-slate-500">{account.bankName} • ••••{account.accountNumber.slice(-4)}</p>}
            <p className="mt-2 text-2xl font-bold text-slate-900">₹{Number(account.currentBalance).toLocaleString("en-IN")}</p>
            <p className="text-xs text-slate-400">{account.transactionCount} transaction{account.transactionCount === 1 ? "" : "s"}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60">
              <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export CSV"}
            </button>
            <button onClick={() => setShowImport(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white hover:bg-blue-700">
              <Upload className="h-4 w-4" /> Upload Statement
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-right">Deposit</th>
                <th className="px-4 py-3 text-right">Withdrawal</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-slate-500">No transactions on this account yet.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">{t.transactionDate}</td>
                    <td className="px-4 py-3">{t.description || "—"}</td>
                    <td className="px-4 py-3">{t.referenceNumber || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{t.source === "IMPORTED" ? "Statement" : "Manual"}</td>
                    <td className="px-4 py-3 text-right">{Number(t.deposit) > 0 ? `₹${Number(t.deposit).toLocaleString("en-IN")}` : "—"}</td>
                    <td className="px-4 py-3 text-right">{Number(t.withdrawal) > 0 ? `₹${Number(t.withdrawal).toLocaleString("en-IN")}` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ALLOCATION_STATUS_COLORS[t.allocationStatus]}`}>
                        {ALLOCATION_STATUS_LABELS[t.allocationStatus] ?? t.allocationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setAllocatingTxn(t)} className="text-sm text-blue-600 hover:underline">Allocate</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showImport && (
        <ImportTransactionsModal
          accounts={[account]}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); load(); }}
        />
      )}

      {allocatingTxn && (
        <AllocateTransactionModal transaction={allocatingTxn} onClose={() => setAllocatingTxn(null)} onSaved={() => { setAllocatingTxn(null); load(); }} />
      )}
    </Layout>
  );
}
