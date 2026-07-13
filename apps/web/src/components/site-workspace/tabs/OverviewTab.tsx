import { useEffect, useState } from "react";
import StatCard from "../../dashboard/StatCard";
import { getSiteOverview, getSiteFinancialSummary } from "../../../services/site-control-center";
import type { SiteOverview, SiteFinancialSummary } from "../../../services/site-control-center";
import type { Site } from "../../../services/sites";
import LoadingState from "../../ui/LoadingState";
import { formatCurrency as inr } from "../../../lib/utils";

const dateStr = (v: string) => (v ? new Date(v).toLocaleDateString("en-IN") : "—");

// Site Overview is an Executive Dashboard — the complete Site status within 10 seconds. Only the
// nine approved KPIs are shown (Site Management & Financial Workflow Refinement milestone);
// Budget/Actual/Labour-Today figures live in the Financial tab, not here.
export default function OverviewTab({ site }: { site: Site }) {
  const [overview, setOverview] = useState<SiteOverview | null>(null);
  const [financial, setFinancial] = useState<SiteFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSiteOverview(site.id), getSiteFinancialSummary(site.id)])
      .then(([o, f]) => {
        setOverview(o);
        setFinancial(f);
      })
      .catch(() => setError("Failed to load site overview."))
      .finally(() => setLoading(false));
  }, [site.id]);

  if (loading) return <LoadingState />;
  if (error || !overview || !financial) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Contract Value" value={inr(site.contractValue)} />
        <StatCard title="Work Order Date" value={dateStr(site.workOrderDate)} />
        <StatCard title="Expected Completion Date" value={dateStr(site.completionDate)} />
        <StatCard title="Actual Completion Date" value={dateStr(site.actualCompletionDate)} />
        <StatCard title="Physical Progress" value={`${overview.physicalProgress}%`} />
        <StatCard title="Total Certified" value={inr(financial.grossBilling)} subtitle="Sum of all RA Bills" />
        <StatCard title="Client Payment Received" value={inr(financial.clientPaymentsReceived)} />
        <StatCard title="Outstanding Client Payment" value={inr(financial.outstandingAmount)} />
        <StatCard title="Total Security Deposit" value={inr(financial.securityDepositTotal)} subtitle="Sum of SD deductions from all RA Bills" />
      </div>
    </div>
  );
}
