import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, AlertTriangle } from "lucide-react";

import Layout from "../../components/layout/Layout";
import LoadingState from "../../components/ui/LoadingState";
import { getBankAccountsWithBalances, getDuplicateBankTransactions, deleteDuplicateBankTransaction } from "../../services/bank-transactions";
import type { BankAccountBalance, DuplicateTransactionGroup } from "../../services/bank-transactions";
import { formatCurrency as inr } from "../../lib/utils";

export default function DuplicateTransactions() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<BankAccountBalance[]>([]);
  const [accountFilter, setAccountFilter] = useState("");
  const [groups, setGroups] = useState<DuplicateTransactionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    getBankAccountsWithBalances().then(setAccounts).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setGroups(await getDuplicateBankTransactions(accountFilter || undefined));
    } catch {
      setError("Failed to load duplicate transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountFilter]);

  const handleDelete = async (id: string, hasAllocations: boolean, confirmAllocated: boolean) => {
    try {
      await deleteDuplicateBankTransaction(id, confirmAllocated);
      setConfirmingId(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete duplicate transaction.");
      if (hasAllocations) setConfirmingId(null);
    }
  };

  const totalDuplicateRows = groups.reduce((sum, g) => sum + (g.count - 1), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Duplicate Transactions</h1>
          <p className="mt-2 text-slate-500">
            Find and safely remove duplicate bank transaction rows left behind by a past re-imported statement — never removes a whole
            imported statement, only the extra duplicate rows.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="rounded-lg border p-2.5">
            <option value="">All Accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName}</option>)}
          </select>
          <button onClick={() => navigate("/banking")} className="rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50">Back to Banking</button>
        </div>

        {loading && <LoadingState label="Scanning for duplicate transactions..." />}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && (
          <>
            {groups.length === 0 ? (
              <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">
                No duplicate transactions found{accountFilter ? " for this account" : ""}. Your transaction history is clean.
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Found {groups.length} duplicate group{groups.length === 1 ? "" : "s"} — {totalDuplicateRows} extra row
                  {totalDuplicateRows === 1 ? "" : "s"} can be safely removed (one copy is always kept per group).
                </div>
                <div className="space-y-4">
                  {groups.map((group) => {
                    const first = group.transactions[0];
                    return (
                      <div key={group.fingerprint} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="text-sm">
                            <span className="font-semibold">{first.transactionDate}</span>
                            {" — "}
                            {first.description || "No description"}
                            {" — "}
                            {Number(first.deposit) > 0 ? `Deposit ${inr(first.deposit)}` : `Withdrawal ${inr(first.withdrawal)}`}
                            {first.referenceNumber && <> — Ref: {first.referenceNumber}</>}
                          </div>
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">{group.count} copies</span>
                        </div>
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                              <th className="px-4 py-2 text-left">Account</th>
                              <th className="px-4 py-2 text-left">Source</th>
                              <th className="px-4 py-2 text-left">Imported/Created</th>
                              <th className="px-4 py-2 text-left">Allocation Status</th>
                              <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.transactions.map((t) => (
                              <tr key={t.id} className="border-t">
                                <td className="px-4 py-2">{t.companyBankAccount?.nickname || t.companyBankAccount?.bankName}</td>
                                <td className="px-4 py-2 text-slate-500">{t.source === "IMPORTED" ? "Statement Import" : "Manual"}</td>
                                <td className="px-4 py-2 text-slate-500">{t.createdAt.slice(0, 10)}</td>
                                <td className="px-4 py-2">
                                  {t.allocationCount > 0 ? (
                                    <span className="flex items-center gap-1 text-amber-700">
                                      <AlertTriangle className="h-3.5 w-3.5" /> {t.allocationCount} allocation{t.allocationCount === 1 ? "" : "s"}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Unallocated</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {confirmingId === t.id ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <span className="text-xs text-red-700">Delete this allocated duplicate?</span>
                                      <button
                                        onClick={() => handleDelete(t.id, true, true)}
                                        className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                                      >
                                        Confirm
                                      </button>
                                      <button onClick={() => setConfirmingId(null)} className="rounded border px-2 py-1 text-xs">Cancel</button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => (t.allocationCount > 0 ? setConfirmingId(t.id) : handleDelete(t.id, false, false))}
                                      className="flex items-center gap-1 rounded p-1.5 text-red-600 hover:bg-red-50"
                                      title="Delete duplicate"
                                    >
                                      <Trash2 className="h-4 w-4" /> <span className="text-xs">Delete</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
