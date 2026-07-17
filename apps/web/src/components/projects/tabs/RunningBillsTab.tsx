import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRunningBills, RB_STATUS_LABELS, RB_STATUS_COLORS } from "../../../services/running-bills";
import type { RunningBill } from "../../../services/running-bills";
import LoadingState from "../../ui/LoadingState";
import EmptyTableRow from "../../ui/EmptyTableRow";
import { formatCurrency as inr } from "../../../lib/utils";

export default function RunningBillsTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [bills, setBills] = useState<RunningBill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getRunningBills({ projectId, page: 1, limit: 50, sortBy: "billDate", sortOrder: "desc" })
      .then((res) => {
        setBills(res.data);
        setTotal(res.total);
      })
      .catch(() => setError("Failed to load Running Bills."))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState label="Loading Running Bills..." />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Running Bills</h2>
        <button onClick={() => navigate("/running-bills")} className="text-sm text-blue-600 hover:underline">View All</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Bill #</th>
              <th className="px-4 py-3 text-left">Site</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Net Payable</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <EmptyTableRow colSpan={6}>No Running Bills for this project yet.</EmptyTableRow>
            ) : (
              bills.map((b) => (
                <tr key={b.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/running-bills/${b.id}`)}>
                  <td className="px-4 py-3">{b.billNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{b.siteRecord?.name ?? "—"}</td>
                  <td className="px-4 py-3">{b.billDate}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${RB_STATUS_COLORS[b.status]}`}>{RB_STATUS_LABELS[b.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{inr(b.netPayable)}</td>
                  <td className="px-4 py-3 text-right">{inr(b.outstandingAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {total > bills.length && (
          <div className="border-t bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
            Showing {bills.length} of {total} — open the Running Bills module for the full list.
          </div>
        )}
      </div>
    </div>
  );
}
