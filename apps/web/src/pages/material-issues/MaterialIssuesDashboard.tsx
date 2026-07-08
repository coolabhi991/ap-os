import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import StatCard from "../../components/dashboard/StatCard";
import MaterialIssueTable from "../../components/material-issues/MaterialIssueTable";

import { getMaterialIssueDashboard, deleteMaterialIssue } from "../../services/material-issues";
import type { MaterialIssueDashboardSummary } from "../../services/material-issues";

export default function MaterialIssuesDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<MaterialIssueDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    getMaterialIssueDashboard()
      .then(setSummary)
      .catch(() => setError("Failed to load material issues dashboard."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this material issue? Stock already deducted will not be restored.")) return;
    try {
      await deleteMaterialIssue(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete material issue.");
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Material Issues Dashboard</h1>
          <p className="mt-2 text-slate-500">Consumption activity across projects and materials.</p>
        </div>

        {loading && <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && summary && (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Today's Issues" value={summary.today.count} subtitle={`${summary.today.quantity} units`} />
              <StatCard title="Monthly Issues" value={summary.thisMonth.count} subtitle={`${summary.thisMonth.quantity} units`} />
              <StatCard title="Projects Consuming" value={summary.byProject.length} />
              <StatCard title="Materials Consumed" value={summary.byMaterial.length} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Project-wise Consumption</h2>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full">
                    <thead className="bg-slate-100">
                      <tr><th className="px-4 py-3 text-left">Project</th><th className="px-4 py-3 text-right">Quantity</th></tr>
                    </thead>
                    <tbody>
                      {summary.byProject.length === 0 ? (
                        <tr><td colSpan={2} className="py-8 text-center text-slate-500">No data.</td></tr>
                      ) : (
                        summary.byProject.map((p) => (
                          <tr key={p.projectId} className="border-t">
                            <td className="px-4 py-3">{p.projectName}</td>
                            <td className="px-4 py-3 text-right font-medium">{Number(p.quantity).toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Top Consumed Materials</h2>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full">
                    <thead className="bg-slate-100">
                      <tr><th className="px-4 py-3 text-left">Material</th><th className="px-4 py-3 text-right">Quantity</th></tr>
                    </thead>
                    <tbody>
                      {summary.byMaterial.length === 0 ? (
                        <tr><td colSpan={2} className="py-8 text-center text-slate-500">No data.</td></tr>
                      ) : (
                        summary.byMaterial.slice(0, 8).map((m) => (
                          <tr key={m.inventoryId} className="border-t">
                            <td className="px-4 py-3">{m.itemName}</td>
                            <td className="px-4 py-3 text-right font-medium">{Number(m.quantity).toLocaleString("en-IN")} {m.unit}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Recent Material Issues</h2>
              <MaterialIssueTable
                issues={summary.recentIssues}
                onView={(id) => navigate(`/material-issues/${id}`)}
                onEdit={(id) => navigate(`/material-issues/${id}/edit`)}
                onDelete={handleDelete}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
