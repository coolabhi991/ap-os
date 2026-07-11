import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import StatCard from "../../components/dashboard/StatCard";
import { getLabourDashboard } from "../../services/labour-reports";
import type { LabourDashboardSummary } from "../../services/labour-reports";
import { ATTENDANCE_STATUS_LABELS } from "../../services/labour-attendance";
import LoadingState from "../../components/ui/LoadingState";
import EmptyTableRow from "../../components/ui/EmptyTableRow";

export default function LabourDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<LabourDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLabourDashboard()
      .then(setSummary)
      .catch(() => setError("Failed to load labour dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Labour Dashboard</h1>
          <p className="mt-2 text-slate-500">Attendance, wage cost, and pending wages across your workforce.</p>
        </div>

        {loading && <LoadingState />}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && summary && (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Active Workers" value={summary.totalActiveLabour} />
              <StatCard title="Today's Attendance" value={summary.today.count} subtitle={`₹${summary.today.wageAmount} wage cost`} />
              <StatCard title="Monthly Attendance" value={summary.thisMonth.count} subtitle={`₹${summary.thisMonth.wageAmount} wage cost`} />
              <StatCard title="Present Today" value={summary.today.byStatus.PRESENT ?? 0} subtitle={`${summary.today.byStatus.ABSENT ?? 0} absent`} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Project-wise Labour Cost</h2>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full">
                    <thead className="bg-slate-100">
                      <tr><th className="px-4 py-3 text-left">Project</th><th className="px-4 py-3 text-right">Wage Cost</th></tr>
                    </thead>
                    <tbody>
                      {summary.projectWiseCost.length === 0 ? (
                        <EmptyTableRow colSpan={2}>No data.</EmptyTableRow>
                      ) : (
                        summary.projectWiseCost.map((p) => (
                          <tr key={p.projectId} className="border-t">
                            <td className="px-4 py-3">{p.projectName}</td>
                            <td className="px-4 py-3 text-right font-medium">₹{Number(p.totalWageCost).toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Top Pending Wages</h2>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full">
                    <thead className="bg-slate-100">
                      <tr><th className="px-4 py-3 text-left">Worker</th><th className="px-4 py-3 text-right">Pending</th></tr>
                    </thead>
                    <tbody>
                      {summary.topPendingWages.length === 0 ? (
                        <EmptyTableRow colSpan={2}>No pending wages.</EmptyTableRow>
                      ) : (
                        summary.topPendingWages.map((w) => (
                          <tr key={w.labourId} className="border-t">
                            <td className="px-4 py-3">{w.name}</td>
                            <td className="px-4 py-3 text-right font-medium text-red-600">₹{Number(w.pendingWages).toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Recent Attendance</h2>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Worker</th>
                      <th className="px-6 py-4 text-left">Project</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-right">Wage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentAttendance.length === 0 ? (
                      <EmptyTableRow colSpan={5}>No attendance recorded yet.</EmptyTableRow>
                    ) : (
                      summary.recentAttendance.map((a) => (
                        <tr key={a.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => navigate("/labour/attendance")}>
                          <td className="px-6 py-4">{a.attendanceDate}</td>
                          <td className="px-6 py-4 font-medium">{a.labour?.name ?? "—"}</td>
                          <td className="px-6 py-4">{a.project?.name ?? "—"}</td>
                          <td className="px-6 py-4">{ATTENDANCE_STATUS_LABELS[a.status] ?? a.status}</td>
                          <td className="px-6 py-4 text-right font-medium">₹{Number(a.wageAmount).toLocaleString("en-IN")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
