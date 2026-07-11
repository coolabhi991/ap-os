import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import Layout from "../../components/layout/Layout";
import {
  getMBRegisterReport,
  getAbstractRegisterReport,
  getItemWiseQuantityReport,
  getSubWorkQuantityReport,
  getPendingMBReport,
  exportAbstractRegisterCSV,
  MB_STATUS_LABELS,
  MB_STATUS_COLORS,
} from "../../services/measurement-books";
import type { MBRegisterRow, AbstractRegisterRow, ItemWiseQuantityRow, SubWorkQuantityRow, PendingMBRow } from "../../services/measurement-books";
import { getProjects } from "../../services/projects";
import EmptyTableRow from "../../components/ui/EmptyTableRow";

type ReportTab = "register" | "abstract" | "item-wise" | "sub-work" | "pending";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "register", label: "MB Register" },
  { key: "abstract", label: "Abstract Register" },
  { key: "item-wise", label: "Item-wise Quantity" },
  { key: "sub-work", label: "Sub Work Quantity" },
  { key: "pending", label: "Pending MB" },
];

export default function MBReports() {
  const [tab, setTab] = useState<ReportTab>("register");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [registerRows, setRegisterRows] = useState<MBRegisterRow[]>([]);
  const [abstractRows, setAbstractRows] = useState<AbstractRegisterRow[]>([]);
  const [itemWiseRows, setItemWiseRows] = useState<ItemWiseQuantityRow[]>([]);
  const [subWorkRows, setSubWorkRows] = useState<SubWorkQuantityRow[]>([]);
  const [pendingRows, setPendingRows] = useState<PendingMBRow[]>([]);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = { projectId: projectFilter || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined };
      const [register, abstract, itemWise, subWork, pending] = await Promise.all([
        getMBRegisterReport(query),
        getAbstractRegisterReport(query),
        getItemWiseQuantityReport(query),
        getSubWorkQuantityReport(query),
        getPendingMBReport(query),
      ]);
      setRegisterRows(register);
      setAbstractRows(abstract);
      setItemWiseRows(itemWise);
      setSubWorkRows(subWork);
      setPendingRows(pending);
    } catch {
      setError("Failed to load Measurement Book reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFilter, fromDate, toDate]);

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportAbstractRegisterCSV({ projectId: projectFilter || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined });
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
            <h1 className="text-3xl font-bold text-slate-900">Measurement Book Reports</h1>
            <p className="mt-2 text-slate-500">MB register, abstract register, item-wise and sub work quantity, and pending approvals.</p>
          </div>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60">
            <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export Abstract CSV"}
          </button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border p-2.5">
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="whitespace-nowrap text-sm text-slate-500">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
            <label className="whitespace-nowrap text-sm text-slate-500">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
            <p className="ml-2 text-xs text-slate-400">Date range applies to MB Date. Pending MB always shows the current, all-time balance.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {tab === "register" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">MB #</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Project</th>
                    <th className="px-4 py-3 text-left">Sub Work</th>
                    <th className="px-4 py-3 text-left">Contractor</th>
                    <th className="px-4 py-3 text-right">Items</th>
                    <th className="px-4 py-3 text-right">Total Qty</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registerRows.length === 0 ? (
                    <EmptyTableRow colSpan={9}>No data.</EmptyTableRow>
                  ) : (
                    registerRows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{r.mbNumber}</td>
                        <td className="px-4 py-3">{r.mbDate}</td>
                        <td className="px-4 py-3">{r.project?.name ?? "—"}</td>
                        <td className="px-4 py-3">{r.subWork?.name ?? "—"}</td>
                        <td className="px-4 py-3">{r.contractor?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-right">{r.itemCount}</td>
                        <td className="px-4 py-3 text-right">{Number(r.totalQuantity).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${MB_STATUS_COLORS[r.status]}`}>{MB_STATUS_LABELS[r.status] ?? r.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "abstract" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-3 text-left">MB #</th>
                    <th className="px-3 py-3 text-left">Item No.</th>
                    <th className="px-3 py-3 text-left">Description</th>
                    <th className="px-3 py-3 text-left">Unit</th>
                    <th className="px-3 py-3 text-right">Quantity</th>
                    <th className="px-3 py-3 text-right">BOQ Rate</th>
                    <th className="px-3 py-3 text-right">Payment %</th>
                    <th className="px-3 py-3 text-right">Eff. Rate</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {abstractRows.length === 0 ? (
                    <EmptyTableRow colSpan={9}>No data.</EmptyTableRow>
                  ) : (
                    abstractRows.map((r, i) => (
                      <tr key={`${r.mbId}-${i}`} className="border-t">
                        <td className="px-3 py-3 font-medium">{r.mbNumber}</td>
                        <td className="px-3 py-3">{r.boqItemNo}</td>
                        <td className="px-3 py-3">{r.boqDescription}</td>
                        <td className="px-3 py-3">{r.unit}</td>
                        <td className="px-3 py-3 text-right">{Number(r.quantity).toFixed(4)}</td>
                        <td className="px-3 py-3 text-right">₹{Number(r.boqRate).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-3 text-right">{Number(r.paymentPercent)}%</td>
                        <td className="px-3 py-3 text-right">₹{Number(r.effectiveRate).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-3 text-right font-medium">₹{Number(r.amount).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "item-wise" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Item No.</th>
                    <th className="px-6 py-4 text-left">Description</th>
                    <th className="px-6 py-4 text-left">Unit</th>
                    <th className="px-6 py-4 text-right">Total Quantity</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                    <th className="px-6 py-4 text-right">Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {itemWiseRows.length === 0 ? (
                    <EmptyTableRow colSpan={6}>No data.</EmptyTableRow>
                  ) : (
                    itemWiseRows.map((r, i) => (
                      <tr key={`${r.boqItemNo}-${i}`} className="border-t">
                        <td className="px-6 py-4 font-medium">{r.boqItemNo}</td>
                        <td className="px-6 py-4">{r.boqDescription}</td>
                        <td className="px-6 py-4">{r.unit}</td>
                        <td className="px-6 py-4 text-right">{Number(r.totalQuantity).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right font-medium">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right">{r.count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "sub-work" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Sub Work</th>
                    <th className="px-6 py-4 text-right">Total Quantity</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                    <th className="px-6 py-4 text-right">Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {subWorkRows.length === 0 ? (
                    <EmptyTableRow colSpan={4}>No data.</EmptyTableRow>
                  ) : (
                    subWorkRows.map((r, i) => (
                      <tr key={`${r.subWork}-${i}`} className="border-t">
                        <td className="px-6 py-4 font-medium">{r.subWork}</td>
                        <td className="px-6 py-4 text-right">{Number(r.totalQuantity).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right font-medium">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right">{r.count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "pending" && (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">MB #</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Project</th>
                    <th className="px-6 py-4 text-left">Engineer</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Days Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.length === 0 ? (
                    <EmptyTableRow colSpan={7}>No pending Measurement Books.</EmptyTableRow>
                  ) : (
                    pendingRows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-6 py-4 font-medium">{r.mbNumber}</td>
                        <td className="px-6 py-4">{r.mbDate}</td>
                        <td className="px-6 py-4">{r.project?.name ?? "—"}</td>
                        <td className="px-6 py-4">{r.engineer?.name ?? "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${MB_STATUS_COLORS[r.status]}`}>{MB_STATUS_LABELS[r.status] ?? r.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">₹{Number(r.totalAmount).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right font-medium text-amber-600">{r.daysPending}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
