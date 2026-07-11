import { useEffect, useState } from "react";

import Layout from "../../components/layout/Layout";
import {
  getProjectConsumptionReport,
  getMaterialConsumptionReport,
  getMonthlyConsumptionReport,
} from "../../services/material-issues";
import type {
  ProjectConsumptionRow,
  MaterialConsumptionRow,
  MonthlyConsumptionRow,
} from "../../services/material-issues";
import { getStockLedger } from "../../services/inventory";
import type { StockLedgerEntry } from "../../services/inventory";
import EmptyTableRow from "../../components/ui/EmptyTableRow";

type ReportTab = "project" | "material" | "monthly" | "stock-movement";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "project", label: "Project Consumption" },
  { key: "material", label: "Material Consumption" },
  { key: "monthly", label: "Monthly Consumption" },
  { key: "stock-movement", label: "Stock Movement" },
];

export default function MaterialIssueReports() {
  const [tab, setTab] = useState<ReportTab>("project");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectRows, setProjectRows] = useState<ProjectConsumptionRow[]>([]);
  const [materialRows, setMaterialRows] = useState<MaterialConsumptionRow[]>([]);
  const [monthlyRows, setMonthlyRows] = useState<MonthlyConsumptionRow[]>([]);
  const [stockMovementRows, setStockMovementRows] = useState<StockLedgerEntry[]>([]);

  const query = { fromDate: fromDate || undefined, toDate: toDate || undefined };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [project, material, monthly, stockMovement] = await Promise.all([
        getProjectConsumptionReport(query),
        getMaterialConsumptionReport(query),
        getMonthlyConsumptionReport(query),
        getStockLedger({ movementType: "ISSUE", ...query, limit: 100 }),
      ]);
      setProjectRows(project);
      setMaterialRows(material);
      setMonthlyRows(monthly);
      setStockMovementRows(stockMovement.data);
    } catch {
      setError("Failed to load material issue reports.");
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
          <h1 className="text-3xl font-bold text-slate-900">Material Issue Reports</h1>
          <p className="mt-2 text-slate-500">Project, material, monthly, and stock movement breakdowns.</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-sm text-slate-500">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
            <label className="whitespace-nowrap text-sm text-slate-500">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
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
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Project</th><th className="px-6 py-4 text-right">Total Quantity</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {projectRows.length === 0 ? <EmptyTableRow colSpan={3}>No data.</EmptyTableRow> : projectRows.map((r) => (
                    <tr key={r.projectId} className="border-t"><td className="px-6 py-4">{r.projectName}</td><td className="px-6 py-4 text-right font-medium">{Number(r.totalQuantity).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "material" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Material</th><th className="px-6 py-4 text-right">Total Quantity</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {materialRows.length === 0 ? <EmptyTableRow colSpan={3}>No data.</EmptyTableRow> : materialRows.map((r) => (
                    <tr key={r.inventoryId} className="border-t"><td className="px-6 py-4">{r.itemName}</td><td className="px-6 py-4 text-right font-medium">{Number(r.totalQuantity).toLocaleString("en-IN")} {r.unit}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "monthly" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Month</th><th className="px-6 py-4 text-right">Total Quantity</th><th className="px-6 py-4 text-right">Count</th></tr></thead>
                <tbody>
                  {monthlyRows.length === 0 ? <EmptyTableRow colSpan={3}>No data.</EmptyTableRow> : monthlyRows.map((r) => (
                    <tr key={r.month} className="border-t"><td className="px-6 py-4">{r.month}</td><td className="px-6 py-4 text-right font-medium">{Number(r.totalQuantity).toLocaleString("en-IN")}</td><td className="px-6 py-4 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "stock-movement" && (
              <table className="min-w-full">
                <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Date</th><th className="px-6 py-4 text-left">Material</th><th className="px-6 py-4 text-right">Quantity</th><th className="px-6 py-4 text-right">Balance After</th><th className="px-6 py-4 text-left">Reference</th></tr></thead>
                <tbody>
                  {stockMovementRows.length === 0 ? <EmptyTableRow colSpan={5}>No issue movements found.</EmptyTableRow> : stockMovementRows.map((e) => (
                    <tr key={e.id} className="border-t">
                      <td className="px-6 py-4">{new Date(e.movementDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{e.item?.itemName ?? "—"}</td>
                      <td className="px-6 py-4 text-right font-medium">{e.quantity}</td>
                      <td className="px-6 py-4 text-right">{e.balanceAfter}</td>
                      <td className="px-6 py-4 font-mono text-xs">{e.referenceNumber || "—"}</td>
                    </tr>
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
