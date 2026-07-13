import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import { getDPRs, SHIFT_LABELS } from "../../../services/dpr";
import type { DPR } from "../../../services/dpr";
import type { Site } from "../../../services/sites";
import LoadingState from "../../ui/LoadingState";
import EmptyTableRow from "../../ui/EmptyTableRow";

// Site Workspace only ever shows DPR History (date-wise, View/Edit) — Site Workspace holds
// permanent Site information; entering a DPR happens from the dedicated Daily Progress Reports
// module (Sidebar -> Daily Progress Reports), which every Engineer uses across all Sites.
export default function DPRTab({ site }: { site: Site }) {
  const navigate = useNavigate();
  const [dprs, setDprs] = useState<DPR[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDPRs({ siteId: site.id, page: 1, limit: 20, sortBy: "reportDate", sortOrder: "desc" })
      .then((res) => {
        setDprs(res.data);
        setTotal(res.total);
      })
      .catch(() => setError("Failed to load DPRs."))
      .finally(() => setLoading(false));
  }, [site.id]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">DPR History</h2>
        <p className="text-sm text-slate-500">To add a new DPR, use the Daily Progress Reports module.</p>
      </div>

      {loading && <LoadingState />}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">DPR #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Shift</th>
                <th className="px-4 py-3 text-left">Sub Work</th>
                <th className="px-4 py-3 text-right">Labour</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dprs.length === 0 ? (
                <EmptyTableRow colSpan={6}>No DPRs for this site yet.</EmptyTableRow>
              ) : (
                dprs.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">{d.dprNumber}</td>
                    <td className="px-4 py-3">{d.reportDate}</td>
                    <td className="px-4 py-3">{SHIFT_LABELS[d.shift] ?? d.shift}</td>
                    <td className="px-4 py-3">{d.subWork?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{d.labourTotal}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => navigate(`/dpr/${d.id}`)} title="View">
                          <Eye size={16} className="text-blue-600" />
                        </button>
                        <button onClick={() => navigate(`/dpr/${d.id}/edit`)} title="Edit">
                          <Pencil size={16} className="text-green-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {total > dprs.length && (
            <div className="border-t bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
              Showing {dprs.length} of {total} — open the Daily Progress Reports module for the full list.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
