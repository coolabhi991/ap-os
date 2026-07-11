import { useEffect, useState } from "react";

import Layout from "../../components/layout/Layout";
import { getWageRegister, getPendingWages, getProjectLabourCostReport } from "../../services/labour-reports";
import type { WageSummaryRow, ProjectLabourCostRow } from "../../services/labour-reports";
import EmptyTableRow from "../../components/ui/EmptyTableRow";

type ReportTab = "wage-register" | "pending-wages" | "project-cost";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "wage-register", label: "Wage Register" },
  { key: "pending-wages", label: "Pending Wages" },
  { key: "project-cost", label: "Project-wise Labour Cost" },
];

export default function LabourReports() {
  const [tab, setTab] = useState<ReportTab>("wage-register");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [wageRegisterRows, setWageRegisterRows] = useState<WageSummaryRow[]>([]);
  const [pendingWagesRows, setPendingWagesRows] = useState<WageSummaryRow[]>([]);
  const [projectCostRows, setProjectCostRows] = useState<ProjectLabourCostRow[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = { fromDate: fromDate || undefined, toDate: toDate || undefined };
      const [wageRegister, pendingWages, projectCost] = await Promise.all([
        getWageRegister(query),
        getPendingWages(),
        getProjectLabourCostReport(query),
      ]);
      setWageRegisterRows(wageRegister);
      setPendingWagesRows(pendingWages);
      setProjectCostRows(projectCost);
    } catch {
      setError("Failed to load labour reports.");
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
          <h1 className="text-3xl font-bold text-slate-900">Labour Reports</h1>
          <p className="mt-2 text-slate-500">Wage register, pending wages, and project-wise labour cost.</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-sm text-slate-500">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
            <label className="whitespace-nowrap text-sm text-slate-500">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
            <p className="ml-2 text-xs text-slate-400">Date range applies to Wage Register and Project Cost. Pending Wages is always a current, all-time balance.</p>
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
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {tab === "wage-register" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Worker</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Contractor</th>
                    <th className="px-4 py-3 text-right">Present</th>
                    <th className="px-4 py-3 text-right">Half Day</th>
                    <th className="px-4 py-3 text-right">Absent</th>
                    <th className="px-4 py-3 text-right">OT Hours</th>
                    <th className="px-4 py-3 text-right">Wage Earned</th>
                    <th className="px-4 py-3 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {wageRegisterRows.length === 0 ? (
                    <EmptyTableRow colSpan={9}>No data.</EmptyTableRow>
                  ) : (
                    wageRegisterRows.map((w) => (
                      <tr key={w.labourId} className="border-t">
                        <td className="px-4 py-3 font-medium">{w.name}</td>
                        <td className="px-4 py-3">{w.category}</td>
                        <td className="px-4 py-3 text-slate-500">{w.contractorName || "—"}</td>
                        <td className="px-4 py-3 text-right">{w.daysPresent}</td>
                        <td className="px-4 py-3 text-right">{w.daysHalfDay}</td>
                        <td className="px-4 py-3 text-right">{w.daysAbsent}</td>
                        <td className="px-4 py-3 text-right">{w.totalOvertimeHours}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{Number(w.wageEarned).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right font-medium text-red-600">₹{Number(w.pendingWages).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            {tab === "pending-wages" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Worker</th>
                    <th className="px-6 py-4 text-left">Contractor</th>
                    <th className="px-6 py-4 text-right">Wage Earned</th>
                    <th className="px-6 py-4 text-right">Advances</th>
                    <th className="px-6 py-4 text-right">Payments</th>
                    <th className="px-6 py-4 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWagesRows.length === 0 ? (
                    <EmptyTableRow colSpan={6}>No outstanding pending wages.</EmptyTableRow>
                  ) : (
                    pendingWagesRows.map((w) => (
                      <tr key={w.labourId} className="border-t">
                        <td className="px-6 py-4 font-medium">{w.name}</td>
                        <td className="px-6 py-4 text-slate-500">{w.contractorName || "—"}</td>
                        <td className="px-6 py-4 text-right">₹{Number(w.wageEarned).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right">₹{Number(w.totalAdvances).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right">₹{Number(w.totalPayments).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right font-medium text-red-600">₹{Number(w.pendingWages).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            {tab === "project-cost" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Project</th>
                    <th className="px-6 py-4 text-right">Total Wage Cost</th>
                    <th className="px-6 py-4 text-right">Attendance Count</th>
                  </tr>
                </thead>
                <tbody>
                  {projectCostRows.length === 0 ? (
                    <EmptyTableRow colSpan={3}>No data.</EmptyTableRow>
                  ) : (
                    projectCostRows.map((r) => (
                      <tr key={r.projectId} className="border-t">
                        <td className="px-6 py-4 font-medium">{r.projectName}</td>
                        <td className="px-6 py-4 text-right">₹{Number(r.totalWageCost).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right">{r.attendanceCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
