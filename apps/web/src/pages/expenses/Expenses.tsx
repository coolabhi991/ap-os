import { useEffect, useState } from "react";
import { Plus, Download, LayoutDashboard, BarChart3, Tags } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import ExpenseFilters from "../../components/expenses/ExpenseFilters";
import ExpenseTable from "../../components/expenses/ExpenseTable";

import { getExpenses, deleteExpense, exportExpensesCSV } from "../../services/expenses";
import type { Expense } from "../../services/expenses";
import { getExpenseCategories } from "../../services/expense-categories";
import { getProjects } from "../../services/projects";
import { getVendors } from "../../services/vendors";

export default function Expenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});
    getExpenseCategories(false, "SITE_EXPENSE").then(setCategories).catch(() => {});
  }, []);

  const query = {
    search: search || undefined,
    projectId: projectFilter || undefined,
    vendorId: vendorFilter || undefined,
    categoryId: categoryFilter || undefined,
    paymentMode: modeFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getExpenses(query);
      setExpenses(result.data);
    } catch {
      setError("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, projectFilter, vendorFilter, categoryFilter, modeFilter, fromDate, toDate, minAmount, maxAmount]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete expense.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportExpensesCSV(query);
    } catch {
      alert("Failed to export expenses.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Site Expenses</h1>
            <p className="mt-2 text-slate-500">Cash book of project expenses across cash, bank, credit card, and vendor credit.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/expenses/categories")} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50">
              <Tags size={18} /> Categories
            </button>
            <button onClick={() => navigate("/expenses/reports")} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50">
              <BarChart3 size={18} /> Reports
            </button>
            <button onClick={() => navigate("/expenses/dashboard")} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50">
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              <Download size={18} /> {exporting ? "Exporting..." : "Export"}
            </button>
            <button onClick={() => navigate("/expenses/new")} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
              <Plus size={18} /> New Expense
            </button>
          </div>
        </div>

        <ExpenseFilters
          search={search} onSearchChange={setSearch}
          projectFilter={projectFilter} onProjectChange={setProjectFilter} projects={projects}
          vendorFilter={vendorFilter} onVendorChange={setVendorFilter} vendors={vendors}
          categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter} categories={categories}
          modeFilter={modeFilter} onModeChange={setModeFilter}
          fromDate={fromDate} onFromDateChange={setFromDate}
          toDate={toDate} onToDateChange={setToDate}
          minAmount={minAmount} onMinAmountChange={setMinAmount}
          maxAmount={maxAmount} onMaxAmountChange={setMaxAmount}
        />

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}
        {!loading && !error && (
          <ExpenseTable
            expenses={expenses}
            onView={(id) => navigate(`/expenses/${id}`)}
            onEdit={(id) => navigate(`/expenses/${id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
}
