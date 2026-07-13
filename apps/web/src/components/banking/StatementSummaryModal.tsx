import { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { getStatementSummary, STATEMENT_AUDIT_ACTION_LABELS } from "../../services/bank-statement-imports";
import type { StatementSummary } from "../../services/bank-statement-imports";
import { formatCurrency as inr } from "../../lib/utils";

interface Props {
  statementId: string;
  mode: "view" | "delete";
  onClose: () => void;
  onConfirmDelete?: () => void;
  deleting?: boolean;
}

export default function StatementSummaryModal({ statementId, mode, onClose, onConfirmDelete, deleting = false }: Props) {
  const [summary, setSummary] = useState<StatementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getStatementSummary(statementId)
      .then(setSummary)
      .catch(() => setError("Failed to load statement summary."))
      .finally(() => setLoading(false));
  }, [statementId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{mode === "delete" ? "Delete Bank Statement" : "Statement Summary"}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-500" /></button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {loading && <div className="py-10 text-center text-slate-500">Loading...</div>}
          {error && !loading && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {summary && !loading && (
            <>
              {mode === "delete" && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  This only hides the statement and its transactions from Banking, Allocation, and Reports. No allocation or ledger
                  record (Vendor Payment, Running Bill Receipt, etc.) is ever modified or deleted — Restore brings everything back exactly as it is now.
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Statement Information</h3>
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div><p className="text-slate-500">File Name</p><p className="font-medium">{summary.statement.fileName || "—"}</p></div>
                  <div><p className="text-slate-500">Bank Account</p><p className="font-medium">{summary.statement.companyBankAccount?.nickname || summary.statement.companyBankAccount?.bankName || "—"}</p></div>
                  <div><p className="text-slate-500">Statement Period</p><p className="font-medium">{summary.statement.periodFrom && summary.statement.periodTo ? `${summary.statement.periodFrom} to ${summary.statement.periodTo}` : "—"}</p></div>
                  <div><p className="text-slate-500">Imported By</p><p className="font-medium">{summary.statement.createdBy?.name ?? "—"}</p></div>
                  <div><p className="text-slate-500">Import Date</p><p className="font-medium">{new Date(summary.statement.createdAt).toLocaleString()}</p></div>
                  <div><p className="text-slate-500">Status</p><p className="font-medium">{summary.statement.isDeleted ? "Deleted" : "Active"}</p></div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Import Statistics</h3>
                <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div><p className="text-slate-500">Total Rows</p><p className="font-medium">{summary.statement.totalRows}</p></div>
                  <div><p className="text-slate-500">Imported</p><p className="font-medium">{summary.statement.importedRows}</p></div>
                  <div><p className="text-slate-500">Duplicate Skipped</p><p className="font-medium">{summary.statement.skippedRows}</p></div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Impact</h3>
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-3">
                  <div><p className="text-slate-500">Total Transactions</p><p className="font-medium">{summary.totalTransactions}</p></div>
                  <div><p className="text-slate-500">Allocated</p><p className="font-medium">{summary.allocatedTransactions}</p></div>
                  <div><p className="text-slate-500">Unallocated</p><p className="font-medium">{summary.unallocatedTransactions}</p></div>
                  <div>
                    <p className="text-slate-500">Ledger-backed Allocations</p>
                    <p className={`font-medium ${summary.ledgerBackedAllocationCount > 0 ? "text-amber-700" : ""}`}>
                      {summary.ledgerBackedAllocationCount}
                      {summary.ledgerBackedAllocationCount > 0 && <AlertTriangle className="ml-1 inline h-3.5 w-3.5" />}
                    </p>
                  </div>
                  <div><p className="text-slate-500">Total Deposit</p><p className="font-medium text-emerald-700">{inr(summary.totalDeposit)}</p></div>
                  <div><p className="text-slate-500">Total Withdrawal</p><p className="font-medium text-red-700">{inr(summary.totalWithdrawal)}</p></div>
                </div>
              </div>

              {summary.auditLog.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">Audit Log</h3>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr><th className="px-3 py-2 text-left">Action</th><th className="px-3 py-2 text-left">By</th><th className="px-3 py-2 text-left">When</th></tr>
                      </thead>
                      <tbody>
                        {summary.auditLog.map((a) => (
                          <tr key={a.id} className="border-t">
                            <td className="px-3 py-2">{STATEMENT_AUDIT_ACTION_LABELS[a.action] ?? a.action}</td>
                            <td className="px-3 py-2">{a.performedBy}</td>
                            <td className="px-3 py-2 text-slate-500">{new Date(a.performedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-5 py-2.5 text-sm hover:bg-slate-50">{mode === "delete" ? "Cancel" : "Close"}</button>
          {mode === "delete" && (
            <button
              onClick={onConfirmDelete}
              disabled={loading || deleting || !summary}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
