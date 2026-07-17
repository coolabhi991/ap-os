import { useEffect, useState } from "react";

import Layout from "../components/layout/Layout";
import StatCard from "../components/dashboard/StatCard";
import ProjectOverviewPanel from "../components/control-center/ProjectOverviewPanel";
import BankingSummaryPanel from "../components/control-center/BankingSummaryPanel";
import GovernmentSummaryPanel from "../components/control-center/GovernmentSummaryPanel";
import TodaysMovementCard from "../components/control-center/TodaysMovementCard";
import VendorPositionCard from "../components/control-center/VendorPositionCard";
import OwnersDeskPanel from "../components/control-center/OwnersDeskPanel";
import CommandBar from "../components/control-center/CommandBar";
import { getControlCenter } from "../services/control-center";
import type { ControlCenterData } from "../services/control-center";
import { formatCurrency as inr } from "../lib/utils";

export default function Dashboard() {
  const [data, setData] = useState<ControlCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getControlCenter()
      .then(setData)
      .catch(() => setError("Failed to load the Control Center. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-6 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AP Control Center</h1>
          <p className="mt-2 text-slate-500">Your daily operating screen — every rupee, every project, in one place.</p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
            Loading the Control Center...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        )}

        {!loading && !error && data && (
          <>
            <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-5">
              <StatCard title="Money Received Today" value={inr(data.bankingSummary.todayReceipts)} />
              <StatCard title="Money Paid Today" value={inr(data.bankingSummary.todayPayments)} />
              <StatCard title="Bills Submitted Today" value={String(data.kpis.billsSubmittedToday)} />
              <StatCard title="Bills Approved Today" value={String(data.kpis.billsApprovedToday)} />
              <StatCard title="Active Sites" value={String(data.kpis.activeSiteCount)} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              <ProjectOverviewPanel projects={data.projectHealth} />
              <div className="xl:sticky xl:top-6 xl:self-start">
                <OwnersDeskPanel data={data.ownerDesk} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <BankingSummaryPanel data={data.bankingSummary} />
              <TodaysMovementCard data={data.cashFlow} />
              <GovernmentSummaryPanel data={data.governmentSummary} />
              <VendorPositionCard data={data.payables} />
            </div>

            <CommandBar />
          </>
        )}
      </div>
    </Layout>
  );
}
