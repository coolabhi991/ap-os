import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getDPRs, deleteDPR, SHIFT_LABELS } from "../../services/dpr";
import type { DPR } from "../../services/dpr";
import { getProjects } from "../../services/projects";

export default function DPRs() {
  const navigate = useNavigate();

  const [dprs, setDprs] = useState<DPR[]>([]);
  const [total, setTotal] = useState(0);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getDPRs({
        search: search || undefined,
        projectId: projectFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: 1,
        limit: 50,
      });
      setDprs(result.data);
      setTotal(result.total);
    } catch {
      setError("Failed to load DPRs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, projectFilter, fromDate, toDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this DPR?")) return;
    try {
      await deleteDPR(id);
      setDprs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete DPR.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Daily Progress Reports</h1>
            <p className="mt-2 text-slate-500">Official daily site diary — {total} report{total === 1 ? "" : "s"}.</p>
          </div>
          <button
            onClick={() => navigate("/dpr/new")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New DPR
          </button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search DPR #, work done, remarks..."
              className="min-w-[220px] flex-1 rounded-lg border p-2.5"
            />
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border p-2.5">
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
              <label className="text-sm text-slate-500">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
            </div>
          </div>
        </div>

        {loading && <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">DPR #</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">Sub Work</th>
                  <th className="px-4 py-3 text-left">Shift</th>
                  <th className="px-4 py-3 text-left">Engineer</th>
                  <th className="px-4 py-3 text-right">Labour</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dprs.length === 0 ? (
                  <tr><td colSpan={8} className="py-10 text-center text-slate-500">No DPRs recorded yet.</td></tr>
                ) : (
                  dprs.map((d) => (
                    <tr key={d.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/dpr/${d.id}`)}>
                      <td className="px-4 py-3 font-medium">{d.dprNumber}</td>
                      <td className="px-4 py-3">{d.reportDate}</td>
                      <td className="px-4 py-3">{d.project?.name ?? "—"}</td>
                      <td className="px-4 py-3">{d.subWork?.name ?? "—"}</td>
                      <td className="px-4 py-3">{SHIFT_LABELS[d.shift] ?? d.shift}</td>
                      <td className="px-4 py-3">{d.engineer?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right">{d.labourTotal}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => navigate(`/dpr/${d.id}/edit`)} className="text-sm text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(d.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
