import { useEffect, useState } from "react";
import {
  getBudgetVsActualReport,
  getCostBySubWorkReport,
  getMonthlyCostReport,
  getProjectCostSummaryReport,
  exportProjectCostSummaryCSV,
  COST_HEAD_LABELS,
  VARIANCE_STATUS_LABELS,
  VARIANCE_STATUS_COLORS,
} from "../../../services/project-control-center";
import type { BudgetVsActual, CostBySubWorkRow, MonthlyCostRow, ProjectCostSummary, CostHeadKey } from "../../../services/project-control-center";
import { SUBWORK_STATUS_LABELS } from "../../../services/sub-works";
import type { Project } from "../../../services/projects";

type ReportTab = "budget-vs-actual" | "cost-by-sub-work" | "monthly-cost" | "cost-summary";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "budget-vs-actual", label: "Budget vs Actual" },
  { key: "cost-by-sub-work", label: "Cost by Sub Work" },
  { key: "monthly-cost", label: "Monthly Cost" },
  { key: "cost-summary", label: "Project Cost Summary" },
];

const HEAD_KEYS: CostHeadKey[] = ["material", "labour", "machinery", "fuel", "vendorBills", "siteExpenses", "other"];

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function ReportsTab({ project }: { project: Project }) {
  const [tab, setTab] = useState<ReportTab>("budget-vs-actual");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActual | null>(null);
  const [costBySubWork, setCostBySubWork] = useState<CostBySubWorkRow[]>([]);
  const [monthlyCost, setMonthlyCost] = useState<MonthlyCostRow[]>([]);
  const [costSummary, setCostSummary] = useState<ProjectCostSummary | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getBudgetVsActualReport(project.id),
      getCostBySubWorkReport(project.id),
      getMonthlyCostReport(project.id),
      getProjectCostSummaryReport(project.id),
    ])
      .then(([bva, cbsw, mc, cs]) => {
        setBudgetVsActual(bva);
        setCostBySubWork(cbsw);
        setMonthlyCost(mc);
        setCostSummary(cs);
      })
      .catch(() => setError("Failed to load project reports."))
      .finally(() => setLoading(false));
  }, [project.id]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
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
          <button
            onClick={() => exportProjectCostSummaryCSV(project.id)}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {tab === "budget-vs-actual" && budgetVsActual && (
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat label="Budget" value={inr(budgetVsActual.budget)} />
                <Stat label="Actual" value={inr(budgetVsActual.actual)} />
                <Stat label="Difference" value={inr(budgetVsActual.difference)} tone={Number(budgetVsActual.difference) < 0 ? "negative" : "positive"} />
                <Stat label="Physical Progress" value={`${budgetVsActual.physicalProgress}%`} />
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Stat label="Financial Progress" value={`${budgetVsActual.financialProgress}%`} />
                <Stat
                  label="Variance"
                  value={`${budgetVsActual.variance > 0 ? "+" : ""}${budgetVsActual.variance} pts`}
                  tone={budgetVsActual.variance < 0 ? "negative" : "positive"}
                />
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="mt-1">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${VARIANCE_STATUS_COLORS[budgetVsActual.varianceStatus]}`}>
                      {VARIANCE_STATUS_LABELS[budgetVsActual.varianceStatus]}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === "cost-by-sub-work" && (
            <table className="min-w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left">Sub Work</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Budget</th>
                  <th className="px-6 py-4 text-right">Actual</th>
                  <th className="px-6 py-4 text-right">Difference</th>
                  <th className="px-6 py-4 text-right">Physical %</th>
                  <th className="px-6 py-4 text-right">Financial %</th>
                  <th className="px-6 py-4 text-left">Variance</th>
                </tr>
              </thead>
              <tbody>
                {costBySubWork.length === 0 ? (
                  <tr><td colSpan={8} className="py-10 text-center text-slate-500">No sub works yet.</td></tr>
                ) : (
                  costBySubWork.map((r) => (
                    <tr key={r.subWorkId} className="border-t">
                      <td className="px-6 py-4">{r.name}</td>
                      <td className="px-6 py-4">{SUBWORK_STATUS_LABELS[r.status] ?? r.status}</td>
                      <td className="px-6 py-4 text-right">{inr(r.budget)}</td>
                      <td className="px-6 py-4 text-right">{inr(r.actual)}</td>
                      <td className={`px-6 py-4 text-right ${Number(r.difference) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(r.difference)}</td>
                      <td className="px-6 py-4 text-right">{r.physicalProgress}%</td>
                      <td className="px-6 py-4 text-right">{r.financialProgress}%</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${VARIANCE_STATUS_COLORS[r.varianceStatus]}`}>
                          {VARIANCE_STATUS_LABELS[r.varianceStatus]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === "monthly-cost" && (
            <table className="min-w-full">
              <thead className="bg-slate-100"><tr><th className="px-6 py-4 text-left">Month</th><th className="px-6 py-4 text-right">Total Cost</th></tr></thead>
              <tbody>
                {monthlyCost.length === 0 ? (
                  <tr><td colSpan={2} className="py-10 text-center text-slate-500">No data.</td></tr>
                ) : (
                  monthlyCost.map((r) => (
                    <tr key={r.month} className="border-t"><td className="px-6 py-4">{r.month}</td><td className="px-6 py-4 text-right font-medium">{inr(r.totalAmount)}</td></tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === "cost-summary" && costSummary && (
            <div className="p-6">
              <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat label="Budget" value={inr(costSummary.budget)} />
                <Stat label="Actual" value={inr(costSummary.actual)} />
                <Stat label="Difference" value={inr(costSummary.difference)} tone={Number(costSummary.difference) < 0 ? "negative" : "positive"} />
                <Stat label="Physical Progress" value={`${costSummary.physicalProgress}%`} />
              </div>
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                <Stat label="Financial Progress" value={`${costSummary.financialProgress}%`} />
                <Stat
                  label="Variance"
                  value={`${costSummary.variance > 0 ? "+" : ""}${costSummary.variance} pts`}
                  tone={costSummary.variance < 0 ? "negative" : "positive"}
                />
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="mt-1">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${VARIANCE_STATUS_COLORS[costSummary.varianceStatus]}`}>
                      {VARIANCE_STATUS_LABELS[costSummary.varianceStatus]}
                    </span>
                  </p>
                </div>
              </div>
              <table className="min-w-full overflow-hidden rounded-lg border border-slate-200">
                <thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left">Cost Head</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
                <tbody>
                  {HEAD_KEYS.map((key) => (
                    <tr key={key} className="border-t"><td className="px-4 py-3">{COST_HEAD_LABELS[key]}</td><td className="px-4 py-3 text-right">{inr(costSummary.costHeads[key])}</td></tr>
                  ))}
                  <tr className="border-t bg-slate-50 font-bold"><td className="px-4 py-3">Total</td><td className="px-4 py-3 text-right">{inr(costSummary.costHeads.total)}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  const color = tone === "negative" ? "text-red-600" : tone === "positive" ? "text-emerald-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
