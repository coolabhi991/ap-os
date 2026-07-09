import { useEffect, useState } from "react";
import StatCard from "../../dashboard/StatCard";
import { getProjectOverview } from "../../../services/project-control-center";
import type { ProjectOverview } from "../../../services/project-control-center";
import type { Project } from "../../../services/projects";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function OverviewTab({ project }: { project: Project }) {
  const [data, setData] = useState<ProjectOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getProjectOverview(project.id)
      .then(setData)
      .catch(() => setError("Failed to load project overview."))
      .finally(() => setLoading(false));
  }, [project.id]);

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>;
  if (error || !data) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Contract Value" value={inr(data.contractValue)} />
      <StatCard title="Budget" value={inr(data.budget)} subtitle="Sum of all Sub Work budgets" />
      <StatCard title="Actual Cost" value={inr(data.actualCost)} subtitle="Material + Labour + Machinery + Fuel + Vendor Bills + Site Expenses + Other" />
      <StatCard
        title="Remaining Budget"
        value={inr(data.remainingBudget)}
        subtitle={Number(data.remainingBudget) < 0 ? "Over budget" : "Under budget"}
      />
      <StatCard title="Completion %" value={`${data.completionPercent}%`} />
      <StatCard title="Pending Vendor Bills" value={data.pendingVendorBills.count} subtitle="Not yet fully paid" />
      <StatCard title="Pending Payments" value={inr(data.pendingPayments.amount)} subtitle="Outstanding on pending bills" />
      <StatCard title="Material Stock" value={`${data.materialStock.totalItems} items`} subtitle={`${data.materialStock.lowStockItems} low/critical/out of stock`} />
      <StatCard title="Labour Today" value={data.labourToday.count} subtitle="Workers marked present today" />
    </div>
  );
}
