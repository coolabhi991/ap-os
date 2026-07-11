import { useEffect, useState } from "react";
import { Plus, Download, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getRunningBills, deleteRunningBill, exportRunningBillRegisterCSV, RB_STATUS_OPTIONS, RB_STATUS_LABELS, RB_STATUS_COLORS, BILL_TYPE_LABELS } from "../../services/running-bills";
import type { RunningBill } from "../../services/running-bills";
import { getProjects } from "../../services/projects";
import LoadingState from "../../components/ui/LoadingState";
import EmptyTableRow from "../../components/ui/EmptyTableRow";
import { formatCurrency } from "../../lib/utils";

export default function RunningBills() {
  const navigate = useNavigate();

  const [bills, setBills] = useState<RunningBill[]>([]);
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
      const result = await getRunningBills({
        search: search || undefined,
        projectId: projectFilter || undefined,
        status: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: 1,
        limit: 50,
      });
      setBills(result.data);
      setTotal(result.total);
    } catch {
      setError("Failed to load Running Bills. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, projectFilter, statusFilter, fromDate, toDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this Draft Running Bill?")) return;
    try {
      await deleteRunningBill(id);
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete Running Bill.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportRunningBillRegisterCSV({ projectId: projectFilter || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined, status: statusFilter || undefined });
    } catch {
      alert("Failed to export Running Bill Register.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Running Bills</h1>
            <p className="mt-2 text-slate-500">Client billing — generated from Approved Measurement Books — {total} bill{total === 1 ? "" : "s"}.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/running-bills/reports")} className="flex items-center gap-2 rounded-lg border px-5 py-3 hover:bg-slate-50">
              <BarChart3 size={18} /> Reports
            </button>
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border px-5 py-3 hover:bg-slate-50 disabled:opacity-60">
              <Download size={18} /> {exporting ? "Exporting..." : "Export CSV"}
            </button>
            <button
              onClick={() => navigate("/running-bills/new")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              New Running Bill
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bill #, remarks, project..."
              className="min-w-[220px] flex-1 rounded-lg border p-3 outline-none focus:border-blue-500"
            />
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500">
              <option value="">All Statuses</option>
              {RB_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{RB_STATUS_LABELS[s]}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500" />
              <label className="text-sm text-slate-500">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-3 outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {loading && <LoadingState />}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left">Bill #</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Project</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-right">Net Payable</th>
                  <th className="px-6 py-4 text-right">Received</th>
                  <th className="px-6 py-4 text-right">Outstanding</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <EmptyTableRow colSpan={9}>No Running Bills raised yet.</EmptyTableRow>
                ) : (
                  bills.map((b) => (
                    <tr key={b.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/running-bills/${b.id}`)}>
                      <td className="px-6 py-4 font-medium">{b.billNumber}</td>
                      <td className="px-6 py-4">{b.billDate}</td>
                      <td className="px-6 py-4">{b.project?.name ?? "—"}</td>
                      <td className="px-6 py-4">{BILL_TYPE_LABELS[b.billType] ?? b.billType}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(b.netPayable)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(b.amountReceived)}</td>
                      <td className="px-6 py-4 text-right font-medium text-amber-600">{formatCurrency(b.outstandingAmount)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RB_STATUS_COLORS[b.status]}`}>{RB_STATUS_LABELS[b.status] ?? b.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          {b.status === "DRAFT" && (
                            <>
                              <button onClick={() => navigate(`/running-bills/${b.id}/edit`)} className="text-sm text-blue-600 hover:underline">Edit</button>
                              <button onClick={() => handleDelete(b.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                            </>
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
