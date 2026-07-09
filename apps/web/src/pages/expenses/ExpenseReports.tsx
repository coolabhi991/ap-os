import { useEffect, useState } from "react";

import Layout from "../../components/layout/Layout";
import {
  getProjectExpenseSummary,
  getCategoryExpenseSummary,
  getMonthlyExpenseSummary,
  getVendorCreditSummary,
  getMachineryCostByProjectReport,
  getMachineryCostBySiteReport,
  getVendorWiseMachineryCostReport,
  getMonthlyMachineryCostReport,
  getMachineHoursByTypeReport,
  MACHINE_TYPE_LABELS,
} from "../../services/expenses";
import type {
  ProjectExpenseSummaryRow,
  CategoryExpenseSummaryRow,
  MonthlyExpenseSummaryRow,
  VendorCreditSummaryRow,
  MachineryCostByProjectRow,
  MachineryCostBySiteRow,
  VendorWiseMachineryCostRow,
  MonthlyMachineryCostRow,
  MachineHoursByTypeRow,
} from "../../services/expenses";

type ReportTab =
  | "project"
  | "category"
  | "monthly"
  | "vendor-credit"
  | "machinery-project"
  | "machinery-site"
  | "machinery-vendor"
  | "machinery-monthly"
  | "machinery-hours";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "project", label: "Project Expense Summary" },
  { key: "category", label: "Category Summary" },
  { key: "monthly", label: "Monthly Summary" },
  { key: "vendor-credit", label: "Vendor Credit Summary" },
  { key: "machinery-project", label: "Machinery Cost by Project" },
  { key: "machinery-site", label: "Machinery Cost by Site" },
  { key: "machinery-vendor", label: "Vendor-wise Machinery Cost" },
  { key: "machinery-monthly", label: "Monthly Machinery Cost" },
  { key: "machinery-hours", label: "Total Machine Hours" },
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
  const [machineryProjectRows, setMachineryProjectRows] = useState<MachineryCostByProjectRow[]>([]);
  const [machinerySiteRows, setMachinerySiteRows] = useState<MachineryCostBySiteRow[]>([]);
  const [machineryVendorRows, setMachineryVendorRows] = useState<VendorWiseMachineryCostRow[]>([]);
  const [machineryMonthlyRows, setMachineryMonthlyRows] = useState<MonthlyMachineryCostRow[]>([]);
  const [machineryHoursRows, setMachineryHoursRows] = useState<MachineHoursByTypeRow[]>([]);

  const query = { fromDate: fromDate || undefined, toDate: toDate || undefined };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [project, category, monthly, vendorCredit, machineryProject, machinerySite, machineryVendor, machineryMonthly, machineryHours] = await Promise.all([
        getProjectExpenseSummary(query),
        getCategoryExpenseSummary(query),
        getMonthlyExpenseSummary(query),
        getVendorCreditSummary(query),
        getMachineryCostByProjectReport(query),
        getMachineryCostBySiteReport(query),
        getVendorWiseMachineryCostReport(query),
        getMonthlyMachineryCostReport(query),
        getMachineHoursByTypeReport(query),
      ]);
      setProjectRows(project);
      setCategoryRows(category);
      setMonthlyRows(monthly);
      setVendorCreditRows(vendorCredit);
      setMachineryProjectRows(machineryProject);
      setMachinerySiteRows(machinerySite);
      setMachineryVendorRows(machineryVendor);
      setMachineryMonthlyRows(machineryMonthly);
      setMachineryHoursRows(machineryHours);
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
            {tab === "machinery-project" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Project</th><th className="px-6 py-4 text-right">Total Amount</th><th className="px-6 py-4 text-right">Total Hours</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {machineryProjectRows.length === 0 ? <tr><td colSpan={4} className="py-10 text-center text-slate-500">No data.</td></tr> : machineryProjectRows.map((r) => (
                    <tr key={r.projectId} className="border-t"><td className="px-6 py-4">{r.projectName}</td><td className="px-6 py-4 text-right font-medium">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.totalHours}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "machinery-site" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Site</th><th className="px-6 py-4 text-right">Total Amount</th><th className="px-6 py-4 text-right">Total Hours</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {machinerySiteRows.length === 0 ? <tr><td colSpan={4} className="py-10 text-center text-slate-500">No data.</td></tr> : machinerySiteRows.map((r) => (
                    <tr key={r.site} className="border-t"><td className="px-6 py-4">{r.site}</td><td className="px-6 py-4 text-right font-medium">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.totalHours}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "machinery-vendor" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Vendor</th><th className="px-6 py-4 text-right">Total Amount</th><th className="px-6 py-4 text-right">Total Hours</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {machineryVendorRows.length === 0 ? <tr><td colSpan={4} className="py-10 text-center text-slate-500">No data.</td></tr> : machineryVendorRows.map((r) => (
                    <tr key={r.vendorId} className="border-t"><td className="px-6 py-4">{r.vendorName}</td><td className="px-6 py-4 text-right font-medium">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.totalHours}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "machinery-monthly" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Month</th><th className="px-6 py-4 text-right">Total Amount</th><th className="px-6 py-4 text-right">Total Hours</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {machineryMonthlyRows.length === 0 ? <tr><td colSpan={4} className="py-10 text-center text-slate-500">No data.</td></tr> : machineryMonthlyRows.map((r) => (
                    <tr key={r.month} className="border-t"><td className="px-6 py-4">{r.month}</td><td className="px-6 py-4 text-right font-medium">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.totalHours}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "machinery-hours" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Machine Type</th><th className="px-6 py-4 text-right">Total Hours</th><th className="px-6 py-4 text-right">Total Amount</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {machineryHoursRows.length === 0 ? <tr><td colSpan={4} className="py-10 text-center text-slate-500">No data.</td></tr> : machineryHoursRows.map((r) => (
                    <tr key={r.machineType} className="border-t"><td className="px-6 py-4">{MACHINE_TYPE_LABELS[r.machineType] ?? r.machineType}</td><td className="px-6 py-4 text-right font-medium">{r.totalHours}</td><td className="px-6 py-4 text-right">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
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
