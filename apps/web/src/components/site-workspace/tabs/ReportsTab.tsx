import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { getSiteCostBySubWorkReport, getSiteMonthlyCostReport, exportSiteCostSummaryCSV } from "../../../services/site-control-center";
import type { SiteSubWorkRecapRow, MonthlyCostRow } from "../../../services/site-control-center";
import type { Site } from "../../../services/sites";
import LoadingState from "../../ui/LoadingState";
import { formatCurrency as inr } from "../../../lib/utils";
import EmptyTableRow from "../../ui/EmptyTableRow";


export default function ReportsTab({ site }: { site: Site }) {
  const [subWorkRows, setSubWorkRows] = useState<SiteSubWorkRecapRow[]>([]);
  const [monthlyRows, setMonthlyRows] = useState<MonthlyCostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSiteCostBySubWorkReport(site.id), getSiteMonthlyCostReport(site.id)])
      .then(([subWorks, monthly]) => {
        setSubWorkRows(subWorks);
        setMonthlyRows(monthly);
      })
      .catch(() => setError("Failed to load reports."))
      .finally(() => setLoading(false));
  }, [site.id]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportSiteCostSummaryCSV(site.id);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Reports</h2>
        <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">
          <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export Cost by Sub Work (CSV)"}
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Cost by Sub Work</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Sub Work</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Physical %</th>
                <th className="px-4 py-3 text-right">Financial %</th>
              </tr>
            </thead>
            <tbody>
              {subWorkRows.length === 0 ? (
                <EmptyTableRow colSpan={6}>No Sub Works yet.</EmptyTableRow>
              ) : (
                subWorkRows.map((r) => (
                  <tr key={r.subWorkId} className="border-t">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3 text-right">{inr(r.budget)}</td>
                    <td className="px-4 py-3 text-right">{inr(r.actual)}</td>
                    <td className="px-4 py-3 text-right">{r.physicalProgress}%</td>
                    <td className="px-4 py-3 text-right">{r.financialProgress}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Monthly Cost</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Month</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.length === 0 ? (
                <EmptyTableRow colSpan={2}>No cost data yet.</EmptyTableRow>
              ) : (
                monthlyRows.map((r) => (
                  <tr key={r.month} className="border-t">
                    <td className="px-4 py-3">{r.month}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(r.totalAmount)}</td>
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
