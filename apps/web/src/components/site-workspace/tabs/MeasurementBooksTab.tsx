import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMBs, MB_STATUS_LABELS, MB_STATUS_COLORS } from "../../../services/measurement-books";
import type { MB } from "../../../services/measurement-books";
import type { Site } from "../../../services/sites";

export default function MeasurementBooksTab({ site }: { site: Site }) {
  const navigate = useNavigate();
  const [mbs, setMbs] = useState<MB[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMBs({ siteId: site.id, page: 1, limit: 10, sortBy: "mbDate", sortOrder: "desc" })
      .then((res) => {
        setMbs(res.data);
        setTotal(res.total);
      })
      .catch(() => setError("Failed to load Measurement Books."))
      .finally(() => setLoading(false));
  }, [site.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Measurement Books</h2>
        <button onClick={() => navigate("/measurement-books/new")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Add Measurement Book</button>
      </div>

      {loading && <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">MB #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Sub Work</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {mbs.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-500">No Measurement Books for this site yet.</td></tr>
              ) : (
                mbs.map((mb) => (
                  <tr key={mb.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/measurement-books/${mb.id}`)}>
                    <td className="px-4 py-3">{mb.mbNumber}</td>
                    <td className="px-4 py-3">{mb.mbDate}</td>
                    <td className="px-4 py-3">{mb.subWork?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${MB_STATUS_COLORS[mb.status]}`}>{MB_STATUS_LABELS[mb.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(mb.totalAmount).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {total > mbs.length && (
            <div className="border-t bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
              Showing {mbs.length} of {total} — open the Measurement Books module for the full list.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
