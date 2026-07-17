import { useEffect, useState } from "react";
import { getProjectFinance } from "../../../services/projects";
import type { ProjectFinanceSummary } from "../../../services/projects";
import { formatCurrency as inr } from "../../../lib/utils";
import LoadingState from "../../ui/LoadingState";

const COST_HEAD_LABELS: Record<string, string> = {
  material: "Material",
  labour: "Labour",
  machinery: "Machinery",
  fuel: "Fuel",
  vendorBills: "Vendor Bills",
  siteExpenses: "Site Expenses",
  other: "Other",
};

export default function FinanceTab({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getProjectFinance(projectId)
      .then(setData)
      .catch(() => setError("Failed to load Finance summary."))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState label="Loading Finance summary..." />;
  if (error || !data) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error ?? "Not found."}</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Payment Received</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{inr(data.paymentReceived)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Balance Receivable</p>
          <p className="mt-1 text-lg font-bold text-amber-600">{inr(data.balanceReceivable)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Pending Vendor Bills</p>
          <p className="mt-1 text-lg font-bold text-red-600">{inr(data.pendingPayments.amount)}</p>
          <p className="text-[11px] text-slate-400">{data.pendingVendorBills.count} bill{data.pendingVendorBills.count === 1 ? "" : "s"}</p>
        </div>
        <div className={`rounded-xl p-5 shadow-sm ${data.varianceStatus === "behind" ? "bg-red-50" : "bg-slate-900"}`}>
          <p className={`text-xs ${data.varianceStatus === "behind" ? "text-red-700" : "text-white/80"}`}>Budget vs Actual</p>
          <p className={`mt-1 text-lg font-bold ${data.varianceStatus === "behind" ? "text-red-700" : "text-white"}`}>{inr(data.difference)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Budget vs Actual</h2>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div><p className="text-slate-500">Budget</p><p className="mt-1 font-semibold">{inr(data.budget)}</p></div>
          <div><p className="text-slate-500">Actual</p><p className="mt-1 font-semibold">{inr(data.actual)}</p></div>
          <div><p className="text-slate-500">Difference</p><p className="mt-1 font-semibold">{inr(data.difference)}</p></div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Cost Heads</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(COST_HEAD_LABELS).map(([key, label]) => (
            <div key={key}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold">{inr(data.costHeads[key] ?? "0")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
