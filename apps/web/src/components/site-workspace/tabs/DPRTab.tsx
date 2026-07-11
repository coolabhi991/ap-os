import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDPRs, SHIFT_LABELS } from "../../../services/dpr";
import type { DPR } from "../../../services/dpr";
import type { Site } from "../../../services/sites";

export default function DPRTab({ site }: { site: Site }) {
  const navigate = useNavigate();
  const [dprs, setDprs] = useState<DPR[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDPRs({ siteId: site.id, page: 1, limit: 10, sortBy: "reportDate", sortOrder: "desc" })
      .then((res) => {
        setDprs(res.data);
        setTotal(res.total);
      })
      .catch(() => setError("Failed to load DPRs."))
      .finally(() => setLoading(false));
  }, [site.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Daily Progress Reports</h2>
        <button onClick={() => navigate("/dpr/new")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Add DPR</button>
      </div>

      {loading && <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
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
              </tr>
            </thead>
            <tbody>
              {dprs.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-500">No DPRs for this site yet.</td></tr>
              ) : (
                dprs.map((d) => (
                  <tr key={d.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/dpr/${d.id}`)}>
                    <td className="px-4 py-3">{d.dprNumber}</td>
                    <td className="px-4 py-3">{d.reportDate}</td>
                    <td className="px-4 py-3">{SHIFT_LABELS[d.shift] ?? d.shift}</td>
                    <td className="px-4 py-3">{d.subWork?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{d.labourTotal}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {total > dprs.length && (
            <div className="border-t bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
              Showing {dprs.length} of {total} — open the DPR module for the full list.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
