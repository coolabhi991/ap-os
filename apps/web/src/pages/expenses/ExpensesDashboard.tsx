import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import StatCard from "../../components/dashboard/StatCard";
import ExpenseTable from "../../components/expenses/ExpenseTable";

import { getExpenseDashboard, deleteExpense, PAYMENT_MODE_LABELS } from "../../services/expenses";
import type { ExpenseDashboardSummary } from "../../services/expenses";
import LoadingState from "../../components/ui/LoadingState";
import EmptyTableRow from "../../components/ui/EmptyTableRow";

export default function ExpensesDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ExpenseDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    getExpenseDashboard()
      .then(setSummary)
      .catch(() => setError("Failed to load expenses dashboard."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete expense.");
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Site Expenses Dashboard</h1>
          <p className="mt-2 text-slate-500">Cash book activity across projects, categories, and payment modes.</p>
        </div>

        {loading && <LoadingState />}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && summary && (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Today's Expenses" value={`₹${summary.today.amount}`} subtitle={`${summary.today.count} expenses`} />
              <StatCard title="This Month" value={`₹${summary.thisMonth.amount}`} subtitle={`${summary.thisMonth.count} expenses`} />
              <StatCard title="Outstanding Vendor Credit" value={`₹${summary.outstandingVendorCredit.amount}`} subtitle={`${summary.outstandingVendorCredit.count} expenses`} />
              <StatCard
                title="Cash vs Company Bank"
                value={`₹${summary.byPaymentMode.find((m) => m.mode === "CASH")?.amount ?? "0"} / ₹${summary.byPaymentMode.find((m) => m.mode === "COMPANY_BANK")?.amount ?? "0"}`}
              />
              <StatCard
                title="Machinery Cost"
                value={`₹${summary.machineryCost.amount}`}
                subtitle={`${summary.machineryCost.hours} hrs across ${summary.machineryCost.count} expenses`}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Payments by Mode</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {summary.byPaymentMode.map((m) => (
                  <StatCard key={m.mode} title={PAYMENT_MODE_LABELS[m.mode] ?? m.mode} value={`₹${m.amount}`} subtitle={`${m.count} expenses`} />
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Project-wise Expenses</h2>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Project</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.byProject.length === 0 ? (
                        <EmptyTableRow colSpan={2}>No data.</EmptyTableRow>
                      ) : (
                        summary.byProject.map((p) => (
                          <tr key={p.projectId} className="border-t">
                            <td className="px-4 py-3">{p.projectName}</td>
                            <td className="px-4 py-3 text-right font-medium">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Top Expense Categories</h2>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.byCategory.length === 0 ? (
                        <EmptyTableRow colSpan={2}>No data.</EmptyTableRow>
                      ) : (
                        summary.byCategory.slice(0, 8).map((c) => (
                          <tr key={c.categoryId} className="border-t">
                            <td className="px-4 py-3">{c.categoryName}</td>
                            <td className="px-4 py-3 text-right font-medium">₹{Number(c.amount).toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Recent Expenses</h2>
              <ExpenseTable
                expenses={summary.recentExpenses}
                onView={(id) => navigate(`/expenses/${id}`)}
                onEdit={(id) => navigate(`/expenses/${id}/edit`)}
                onDelete={handleDelete}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
