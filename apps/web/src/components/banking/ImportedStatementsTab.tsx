import { useEffect, useState } from "react";
import { Eye, Trash2, RotateCcw } from "lucide-react";
import { getImportedStatements, deleteStatement, restoreStatement } from "../../services/bank-statement-imports";
import type { ImportedStatement } from "../../services/bank-statement-imports";
import type { BankAccountBalance } from "../../services/bank-transactions";
import StatementSummaryModal from "./StatementSummaryModal";
import LoadingState from "../ui/LoadingState";
import EmptyTableRow from "../ui/EmptyTableRow";

export default function ImportedStatementsTab({ accounts }: { accounts: BankAccountBalance[] }) {
  const [statements, setStatements] = useState<ImportedStatement[]>([]);
  const [total, setTotal] = useState(0);
  const [accountFilter, setAccountFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "deleted" | "all">("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteInFlight, setDeleteInFlight] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getImportedStatements({ companyBankAccountId: accountFilter || undefined, status: statusFilter, page: 1, limit: 100 });
      setStatements(result.data);
      setTotal(result.total);
    } catch {
      setError("Failed to load imported statements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountFilter, statusFilter]);

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setDeleteInFlight(true);
      await deleteStatement(deletingId);
      setDeletingId(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete bank statement.");
    } finally {
      setDeleteInFlight(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!window.confirm("Restore this bank statement? It and all its transactions will become visible again in Banking, Allocation, and Reports.")) return;
    try {
      setRestoringId(id);
      await restoreStatement(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore bank statement.");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{total} statement{total === 1 ? "" : "s"}</p>
        <div className="flex flex-wrap items-center gap-3">
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="rounded-lg border p-2.5 text-sm">
            <option value="">All Accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.nickname || a.bankName}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "active" | "deleted" | "all")} className="rounded-lg border p-2.5 text-sm">
            <option value="active">Active</option>
            <option value="deleted">Deleted</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {loading && <LoadingState />}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Import Date</th>
                <th className="px-4 py-3 text-left">Statement File Name</th>
                <th className="px-4 py-3 text-left">Bank Account</th>
                <th className="px-4 py-3 text-left">Statement Period</th>
                <th className="px-4 py-3 text-right">Total Transactions</th>
                <th className="px-4 py-3 text-right">Imported</th>
                <th className="px-4 py-3 text-right">Duplicate Skipped</th>
                <th className="px-4 py-3 text-left">Imported By</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {statements.length === 0 ? (
                <EmptyTableRow colSpan={10}>No imported statements found.</EmptyTableRow>
              ) : (
                statements.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{s.fileName || "—"}</td>
                    <td className="px-4 py-3">{s.companyBankAccount?.nickname || s.companyBankAccount?.bankName || "—"}</td>
                    <td className="px-4 py-3">{s.periodFrom && s.periodTo ? `${s.periodFrom} to ${s.periodTo}` : "—"}</td>
                    <td className="px-4 py-3 text-right">{s.transactionCount}</td>
                    <td className="px-4 py-3 text-right">{s.importedRows}</td>
                    <td className="px-4 py-3 text-right">{s.skippedRows}</td>
                    <td className="px-4 py-3">{s.createdBy?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {s.isDeleted ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">Deleted</span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setViewingId(s.id)} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          <Eye className="h-3.5 w-3.5" /> View Summary
                        </button>
                        {!s.isDeleted && (
                          <button onClick={() => setDeletingId(s.id)} className="flex items-center gap-1 text-sm text-red-600 hover:underline">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )}
                        {s.isDeleted && (
                          <button onClick={() => handleRestore(s.id)} disabled={restoringId === s.id} className="flex items-center gap-1 text-sm text-emerald-600 hover:underline disabled:opacity-60">
                            <RotateCcw className="h-3.5 w-3.5" /> {restoringId === s.id ? "Restoring..." : "Restore"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewingId && <StatementSummaryModal statementId={viewingId} mode="view" onClose={() => setViewingId(null)} />}

      {deletingId && (
        <StatementSummaryModal
          statementId={deletingId}
          mode="delete"
          deleting={deleteInFlight}
          onClose={() => setDeletingId(null)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
}
