import { useEffect, useState } from "react";
import { getSiteBudgetVsActualReport, getSiteCostBySubWorkReport } from "../../../services/site-control-center";
import type { SiteBudgetVsActual, SiteSubWorkRecapRow } from "../../../services/site-control-center";
import { COST_HEAD_LABELS } from "../../../services/project-control-center";
import type { CostHeadKey } from "../../../services/project-control-center";
import type { Site } from "../../../services/sites";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;
const HEAD_KEYS: CostHeadKey[] = ["material", "labour", "machinery", "fuel", "vendorBills", "siteExpenses", "other"];

export default function FinancialTab({ site }: { site: Site }) {
  const [summary, setSummary] = useState<SiteBudgetVsActual | null>(null);
  const [subWorkRows, setSubWorkRows] = useState<SiteSubWorkRecapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSiteBudgetVsActualReport(site.id), getSiteCostBySubWorkReport(site.id)])
      .then(([s, rows]) => {
        setSummary(s);
        setSubWorkRows(rows);
      })
      .catch(() => setError("Failed to load financial summary."))
      .finally(() => setLoading(false));
  }, [site.id]);

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>;
  if (error || !summary) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Budget</p>
          <p className="mt-1 text-lg font-bold">{inr(summary.budget)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Actual</p>
          <p className="mt-1 text-lg font-bold">{inr(summary.actual)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Difference</p>
          <p className={`mt-1 text-lg font-bold ${Number(summary.difference) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(summary.difference)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Variance Status</p>
          <p className="mt-1 text-lg font-bold capitalize">{summary.varianceStatus}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Budget vs Actual by Cost Head</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Cost Head</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3 text-right">Actual</th>
              </tr>
            </thead>
            <tbody>
              {HEAD_KEYS.map((key) => (
                <tr key={key} className="border-t">
                  <td className="px-4 py-3">{COST_HEAD_LABELS[key]}</td>
                  <td className="px-4 py-3 text-right">{inr(summary.budgetHeads[key])}</td>
                  <td className="px-4 py-3 text-right">{inr(summary.costHeads[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Cost by Sub Work</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Sub Work</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Difference</th>
              </tr>
            </thead>
            <tbody>
              {subWorkRows.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500">No Sub Works yet.</td></tr>
              ) : (
                subWorkRows.map((r) => (
                  <tr key={r.subWorkId} className="border-t">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 text-right">{inr(r.budget)}</td>
                    <td className="px-4 py-3 text-right">{inr(r.actual)}</td>
                    <td className={`px-4 py-3 text-right ${Number(r.difference) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(r.difference)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
