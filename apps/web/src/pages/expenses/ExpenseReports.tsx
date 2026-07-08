import { useEffect, useState } from "react";

import Layout from "../../components/layout/Layout";
import {
  getProjectExpenseSummary,
  getCategoryExpenseSummary,
  getMonthlyExpenseSummary,
  getVendorCreditSummary,
} from "../../services/expenses";
import type {
  ProjectExpenseSummaryRow,
  CategoryExpenseSummaryRow,
  MonthlyExpenseSummaryRow,
  VendorCreditSummaryRow,
} from "../../services/expenses";

type ReportTab = "project" | "category" | "monthly" | "vendor-credit";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "project", label: "Project Expense Summary" },
  { key: "category", label: "Category Summary" },
  { key: "monthly", label: "Monthly Summary" },
  { key: "vendor-credit", label: "Vendor Credit Summary" },
];

export default function ExpenseReports() {
  const [tab, setTab] = useState<ReportTab>("project");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectRows, setProjectRows] = useState<ProjectExpenseSummaryRow[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryExpenseSummaryRow[]>([]);
  const [monthlyRows, setMonthlyRows] = useState<MonthlyExpenseSummaryRow[]>([]);
  const [vendorCreditRows, setVendorCreditRows] = useState<VendorCreditSummaryRow[]>([]);

  const query = { fromDate: fromDate || undefined, toDate: toDate || undefined };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [project, category, monthly, vendorCredit] = await Promise.all([
        getProjectExpenseSummary(query),
        getCategoryExpenseSummary(query),
        getMonthlyExpenseSummary(query),
        getVendorCreditSummary(query),
      ]);
      setProjectRows(project);
      setCategoryRows(category);
      setMonthlyRows(monthly);
      setVendorCreditRows(vendorCredit);
    } catch {
      setError("Failed to load expense reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Expense Reports</h1>
          <p className="mt-2 text-slate-500">Project, category, monthly, and vendor credit breakdowns.</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm text-slate-500">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
              <label className="whitespace-nowrap text-sm text-slate-500">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {tab === "project" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Project</th><th className="px-6 py-4 text-right">Total Amount</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {projectRows.length === 0 ? <tr><td colSpan={3} className="py-10 text-center text-slate-500">No data.</td></tr> : projectRows.map((r) => (
                    <tr key={r.projectId} className="border-t"><td className="px-6 py-4">{r.projectName}</td><td className="px-6 py-4 text-right font-medium">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "category" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Category</th><th className="px-6 py-4 text-right">Total Amount</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {categoryRows.length === 0 ? <tr><td colSpan={3} className="py-10 text-center text-slate-500">No data.</td></tr> : categoryRows.map((r) => (
                    <tr key={r.categoryId} className="border-t"><td className="px-6 py-4">{r.categoryName}</td><td className="px-6 py-4 text-right font-medium">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "monthly" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Month</th><th className="px-6 py-4 text-right">Total Amount</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {monthlyRows.length === 0 ? <tr><td colSpan={3} className="py-10 text-center text-slate-500">No data.</td></tr> : monthlyRows.map((r) => (
                    <tr key={r.month} className="border-t"><td className="px-6 py-4">{r.month}</td><td className="px-6 py-4 text-right font-medium">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "vendor-credit" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Vendor</th><th className="px-6 py-4 text-right">Outstanding Credit</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {vendorCreditRows.length === 0 ? <tr><td colSpan={3} className="py-10 text-center text-slate-500">No data.</td></tr> : vendorCreditRows.map((r) => (
                    <tr key={r.vendorId} className="border-t"><td className="px-6 py-4">{r.vendorName}</td><td className="px-6 py-4 text-right font-medium text-amber-700">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
