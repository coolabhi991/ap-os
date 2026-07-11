import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVendorProjectBreakdown } from "../../../services/vendor-payments";
import type { VendorProjectBreakdownRow } from "../../../services/vendor-payments";
import { formatCurrency as inr } from "../../../lib/utils";
import EmptyTableRow from "../../ui/EmptyTableRow";


export default function VendorProjectsTab({ vendorId }: { vendorId: string }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<VendorProjectBreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendorProjectBreakdown(vendorId)
      .then(setRows)
      .catch(() => setError("Failed to load project breakdown."))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) return <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-right">Work Done</th>
            <th className="px-6 py-4 text-right">Bill Amount</th>
            <th className="px-6 py-4 text-right">Paid Amount</th>
            <th className="px-6 py-4 text-right">Outstanding</th>
            <th className="px-6 py-4 text-right">Bills</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={6}>No bills raised against this vendor for any project yet.</EmptyTableRow>
          ) : (
            rows.map((r, i) => (
              <tr
                key={r.project?.id ?? i}
                className={`border-t ${r.project ? "cursor-pointer hover:bg-slate-50" : ""}`}
                onClick={() => r.project && navigate(`/projects/${r.project.id}`)}
              >
                <td className="px-6 py-4 font-medium">{r.project?.name ?? "Unassigned"}</td>
                <td className="px-6 py-4 text-right">{inr(r.workDone)}</td>
                <td className="px-6 py-4 text-right">{inr(r.billAmount)}</td>
                <td className="px-6 py-4 text-right">{inr(r.paidAmount)}</td>
                <td className="px-6 py-4 text-right font-medium text-amber-600">{inr(r.outstanding)}</td>
                <td className="px-6 py-4 text-right">{r.billCount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
