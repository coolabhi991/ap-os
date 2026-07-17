import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { getExpenses } from "../../../services/expenses";
import type { Expense } from "../../../services/expenses";
import LoadingState from "../../ui/LoadingState";
import EmptyTableRow from "../../ui/EmptyTableRow";
import { formatCurrency as inr } from "../../../lib/utils";

export default function SiteExpensesTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getExpenses({ projectId, page: 1, limit: 50, sortBy: "expenseDate", sortOrder: "desc" })
      .then((res) => {
        setExpenses(res.data);
        setTotal(res.total);
      })
      .catch(() => setError("Failed to load Site Expenses."))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState label="Loading Site Expenses..." />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Site Expenses</h2>
        <button onClick={() => navigate(`/expenses/new?projectId=${projectId}`)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Site</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <EmptyTableRow colSpan={5}>No expenses recorded for this project yet.</EmptyTableRow>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/expenses/${e.id}`)}>
                  <td className="px-4 py-3">{e.expenseDate}</td>
                  <td className="px-4 py-3 text-slate-600">{e.site?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{e.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{e.description || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(e.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {total > expenses.length && (
          <div className="border-t bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
            Showing {expenses.length} of {total} — open the Expenses module for the full list.
          </div>
        )}
      </div>
    </div>
  );
}
