import { useEffect, useState } from "react";
import StatCard from "../../dashboard/StatCard";
import { getSiteOverview } from "../../../services/site-control-center";
import type { SiteOverview } from "../../../services/site-control-center";
import { COST_HEAD_LABELS } from "../../../services/project-control-center";
import type { CostHeadKey } from "../../../services/project-control-center";
import type { Site } from "../../../services/sites";
import { SITE_TYPE_LABELS } from "../../../services/sites";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;
const dateStr = (v: string) => (v ? new Date(v).toLocaleDateString("en-IN") : "—");
const HEAD_KEYS: CostHeadKey[] = ["material", "labour", "machinery", "fuel", "vendorBills", "siteExpenses", "other"];

export default function OverviewTab({ site }: { site: Site }) {
  const [data, setData] = useState<SiteOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getSiteOverview(site.id)
      .then(setData)
      .catch(() => setError("Failed to load site overview."))
      .finally(() => setLoading(false));
  }, [site.id]);

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>;
  if (error || !data) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Contract Value" value={inr(site.contractValue)} />
        <StatCard title="EMD Value" value={inr(site.emdValue)} />
        <StatCard title="Security Deposit" value={inr(site.securityDeposit)} />
        <StatCard title="Performance Guarantee" value={inr(site.performanceGuarantee)} />
        <StatCard title="Work Order Date" value={dateStr(site.workOrderDate)} />
        <StatCard title="Completion Date" value={dateStr(site.completionDate)} />
        <StatCard title="Site Type" value={SITE_TYPE_LABELS[site.siteType]} />
        <StatCard title="Physical Progress" value={`${data.physicalProgress}%`} subtitle="Average of Sub Work progress" />
        <StatCard title="Financial Progress" value={`${data.financialProgress}%`} subtitle="Actual Cost / Budget" />
        <StatCard title="Budget" value={inr(data.budget)} subtitle="Sum of all Sub Work budgets, by cost head" />
        <StatCard title="Actual Cost" value={inr(data.actualCost)} />
        <StatCard title="Remaining Budget" value={inr(data.remainingBudget)} subtitle={Number(data.remainingBudget) < 0 ? "Over budget" : "Under budget"} />
        <StatCard title="Pending Vendor Bills" value={data.pendingVendorBills.count} />
        <StatCard title="Pending Payments" value={inr(data.pendingPayments.amount)} />
        <StatCard title="Labour Today" value={data.labourToday.count} subtitle="Workers marked present today" />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Budget vs Actual by Cost Head</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Cost Head</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Difference</th>
              </tr>
            </thead>
            <tbody>
              {HEAD_KEYS.map((key) => {
                const diff = Number(data.budgetHeads[key]) - Number(data.costHeads[key]);
                return (
                  <tr key={key} className="border-t">
                    <td className="px-4 py-3">{COST_HEAD_LABELS[key]}</td>
                    <td className="px-4 py-3 text-right">{inr(data.budgetHeads[key])}</td>
                    <td className="px-4 py-3 text-right">{inr(data.costHeads[key])}</td>
                    <td className={`px-4 py-3 text-right ${diff < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(diff)}</td>
                  </tr>
                );
              })}
              <tr className="border-t bg-slate-50 font-bold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{inr(data.budgetHeads.total)}</td>
                <td className="px-4 py-3 text-right">{inr(data.costHeads.total)}</td>
                <td className={`px-4 py-3 text-right ${Number(data.remainingBudget) < 0 ? "text-red-600" : "text-emerald-600"}`}>{inr(data.remainingBudget)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
