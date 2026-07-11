import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IndianRupee, Wallet, HandCoins, Banknote, Scale } from "lucide-react";

import Layout from "../components/layout/Layout";
import StatCard from "../components/dashboard/StatCard";
import ApAiSearchBox from "../components/control-center/ApAiSearchBox";
import AlertsPanel from "../components/control-center/AlertsPanel";
import ProjectHealthTable from "../components/control-center/ProjectHealthTable";
import { getControlCenter } from "../services/control-center";
import type { ControlCenterData } from "../services/control-center";
import { RB_STATUS_LABELS, RB_STATUS_COLORS } from "../services/running-bills";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function Dashboard() {
  const navigate = useNavigate();
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AP Control Center</h1>
          <p className="mt-2 text-slate-500">Your daily operating screen — every rupee, every project, in one place.</p>
        </div>

        <ApAiSearchBox />

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
            {/* Financial KPIs */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
              <StatCard title="Contract Value" value={inr(data.kpis.totalContractValue)} subtitle={`${data.kpis.activeProjectCount} active project${data.kpis.activeProjectCount === 1 ? "" : "s"}`} />
              <StatCard title="Cash + Bank Balance" value={inr(data.kpis.totalCashAndBankBalance)} />
              <StatCard title="Receivable" value={inr(data.kpis.totalReceivable)} subtitle={`${data.receivables.count} outstanding Running Bill${data.receivables.count === 1 ? "" : "s"}`} />
              <StatCard title="Payable" value={inr(data.kpis.totalPayable)} subtitle={`${data.payables.overdueCount} overdue — ${inr(data.payables.overdueAmount)}`} />
              <StatCard title="Net Position" value={inr(data.kpis.netPosition)} subtitle="Receivable − Payable" />
            </div>

            {/* Alerts + Project Health */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ProjectHealthTable projects={data.projectHealth} />
              </div>
              <AlertsPanel alerts={data.alerts} />
            </div>

            {/* Cash Flow */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Cash Flow</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {([["Today", data.cashFlow.today], ["This Week", data.cashFlow.weekly], ["This Month", data.cashFlow.monthly]] as const).map(([label, p]) => (
                  <div key={label} className="rounded-xl border border-slate-200 p-5">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className={`mt-1 text-2xl font-bold ${Number(p.net) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{inr(p.net)}</p>
                    <div className="mt-3 flex justify-between text-xs text-slate-500">
                      <span>In: {inr(p.inflow)}</span>
                      <span>Out: {inr(p.outflow)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <IndianRupee size={18} className="text-blue-700" />
                  <div>
                    <p className="text-xs text-blue-700">Expected Inflow</p>
                    <p className="text-lg font-bold text-blue-700">{inr(data.cashFlow.expectedInflow)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <Scale size={18} className="text-orange-700" />
                  <div>
                    <p className="text-xs text-orange-700">Expected Outflow</p>
                    <p className="text-lg font-bold text-orange-700">{inr(data.cashFlow.expectedOutflow)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Receivables + Payables */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Wallet size={18} className="text-emerald-600" /> Receivables</h2>
                  <button onClick={() => navigate("/running-bills/reports")} className="text-sm text-blue-600 hover:underline">View All</button>
                </div>
                <div className="mt-4 space-y-2">
                  {data.receivables.preview.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">No outstanding Running Bills.</p>
                  ) : (
                    data.receivables.preview.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50">
                        <div>
                          <p className="text-sm font-medium">{r.billNumber}</p>
                          <p className="text-xs text-slate-500">{r.project?.name ?? "—"} · {r.daysOutstanding}d outstanding</p>
                        </div>
                        <p className="font-semibold text-amber-600">{inr(r.outstandingAmount)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><HandCoins size={18} className="text-red-600" /> Payables</h2>
                  <button onClick={() => navigate("/banking/reports")} className="text-sm text-blue-600 hover:underline">View All</button>
                </div>
                <div className="mt-4 space-y-2">
                  {data.payables.preview.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">No outstanding Vendor Bills.</p>
                  ) : (
                    data.payables.preview.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50">
                        <div>
                          <p className="text-sm font-medium">{p.billNumber}</p>
                          <p className="text-xs text-slate-500">{p.vendor?.name ?? "—"} {p.isOverdue && <span className="text-red-600">· {p.daysOverdue}d overdue</span>}</p>
                        </div>
                        <p className="font-semibold text-amber-600">{inr(p.outstandingBalance)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Running Bills */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Banknote size={18} className="text-blue-600" /> Running Bills</h2>
                <button onClick={() => navigate("/running-bills")} className="text-sm text-blue-600 hover:underline">View All</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(data.runningBills.statusCounts).map(([status, count]) => (
                  <span key={status} className={`rounded-full px-3 py-1 text-xs font-medium ${RB_STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700"}`}>
                    {RB_STATUS_LABELS[status] ?? status}: {count}
                  </span>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {data.runningBills.recent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">No Running Bills raised yet.</p>
                ) : (
                  data.runningBills.recent.map((b) => (
                    <div key={b.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50" onClick={() => navigate(`/running-bills/${b.id}`)}>
                      <div>
                        <p className="text-sm font-medium">{b.billNumber}</p>
                        <p className="text-xs text-slate-500">{b.project?.name ?? "—"} · {b.billDate}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RB_STATUS_COLORS[b.status]}`}>{RB_STATUS_LABELS[b.status] ?? b.status}</span>
                        <p className="font-semibold">{inr(b.netPayable)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
