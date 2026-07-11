import { useEffect, useState } from "react";
import { Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getMBs, deleteMB, exportAbstractRegisterCSV, MB_STATUS_OPTIONS, MB_STATUS_LABELS, MB_STATUS_COLORS } from "../../services/measurement-books";
import type { MB } from "../../services/measurement-books";
import { getProjects } from "../../services/projects";

export default function MeasurementBooks() {
  const navigate = useNavigate();

  const [mbs, setMbs] = useState<MB[]>([]);
  const [total, setTotal] = useState(0);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMBs({
        search: search || undefined,
        projectId: projectFilter || undefined,
        status: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: 1,
        limit: 50,
      });
      setMbs(result.data);
      setTotal(result.total);
    } catch {
      setError("Failed to load Measurement Books. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, projectFilter, statusFilter, fromDate, toDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this Measurement Book?")) return;
    try {
      await deleteMB(id);
      setMbs((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete Measurement Book.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportAbstractRegisterCSV({
        projectId: projectFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
    } catch {
      alert("Failed to export Abstract Register.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Measurement Books</h1>
            <p className="mt-2 text-slate-500">Official BOQ measurement and abstract records — {total} MB{total === 1 ? "" : "s"}.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60">
              <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export CSV"}
            </button>
            <button
              onClick={() => navigate("/measurement-books/new")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> New MB
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search MB #, remarks, project..."
              className="min-w-[220px] flex-1 rounded-lg border p-2.5"
            />
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border p-2.5">
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border p-2.5">
              <option value="">All Statuses</option>
              {MB_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{MB_STATUS_LABELS[s]}</option>)}
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
                  <th className="px-4 py-3 text-left">MB #</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">Sub Work</th>
                  <th className="px-4 py-3 text-left">Contractor</th>
                  <th className="px-4 py-3 text-right">Total Qty</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mbs.length === 0 ? (
                  <tr><td colSpan={9} className="py-10 text-center text-slate-500">No Measurement Books recorded yet.</td></tr>
                ) : (
                  mbs.map((m) => (
                    <tr key={m.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/measurement-books/${m.id}`)}>
                      <td className="px-4 py-3 font-medium">{m.mbNumber}</td>
                      <td className="px-4 py-3">{m.mbDate}</td>
                      <td className="px-4 py-3">{m.project?.name ?? "—"}</td>
                      <td className="px-4 py-3">{m.subWork?.name ?? "—"}</td>
                      <td className="px-4 py-3">{m.contractor?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right">{Number(m.totalQuantity).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">₹{Number(m.totalAmount).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${MB_STATUS_COLORS[m.status]}`}>{MB_STATUS_LABELS[m.status] ?? m.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          {m.status !== "APPROVED" && (
                            <button onClick={() => navigate(`/measurement-books/${m.id}/edit`)} className="text-sm text-blue-600 hover:underline">Edit</button>
                          )}
                          {m.status !== "APPROVED" && (
                            <button onClick={() => handleDelete(m.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                          )}
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
