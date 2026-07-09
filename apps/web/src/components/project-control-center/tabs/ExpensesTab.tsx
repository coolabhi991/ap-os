import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExpenses, PAYMENT_MODE_LABELS } from "../../../services/expenses";
import type { Expense } from "../../../services/expenses";
import type { Project } from "../../../services/projects";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function ExpensesTab({ project }: { project: Project }) {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getExpenses({ projectId: project.id, page: 1, limit: 10, sortBy: "expenseDate", sortOrder: "desc" })
      .then((res) => {
        setExpenses(res.data);
        setTotal(res.total);
      })
      .catch(() => setError("Failed to load expenses."))
      .finally(() => setLoading(false));
  }, [project.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Site Expenses</h2>
        <button onClick={() => navigate("/expenses")} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Open Expenses Module</button>
      </div>

      {loading && <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Expense #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Payment Mode</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-500">No expenses for this project yet.</td></tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/expenses/${e.id}`)}>
                    <td className="px-4 py-3">{e.expenseNumber}</td>
                    <td className="px-4 py-3">{e.expenseDate}</td>
                    <td className="px-4 py-3">{e.category?.name ?? "—"}</td>
                    <td className="px-4 py-3">{PAYMENT_MODE_LABELS[e.paymentMode] ?? e.paymentMode}</td>
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
      )}
    </div>
  );
}
