import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVendorBills, VENDOR_BILL_STATUS_LABELS, VENDOR_BILL_STATUS_COLORS } from "../../../services/vendor-bills";
import type { VendorBill } from "../../../services/vendor-bills";
import type { Project } from "../../../services/projects";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function FinancialTab({ project }: { project: Project }) {
  const navigate = useNavigate();
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getVendorBills({ projectId: project.id, page: 1, limit: 10, sortBy: "billDate", sortOrder: "desc" })
      .then((res) => {
        setBills(res.data);
        setTotal(res.total);
      })
      .catch(() => setError("Failed to load vendor bills."))
      .finally(() => setLoading(false));
  }, [project.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Financial — Vendor Bills</h2>
        <button onClick={() => navigate("/vendor-bills")} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
          Open Vendor Bills Module
        </button>
      </div>

      {loading && <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Bill #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">No vendor bills for this project yet.</td></tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/vendor-bills/${b.id}`)}>
                    <td className="px-4 py-3">{b.billNumber}</td>
                    <td className="px-4 py-3">{b.billDate}</td>
                    <td className="px-4 py-3">{b.vendor?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(b.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">{inr(b.outstandingBalance)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${VENDOR_BILL_STATUS_COLORS[b.status]}`}>
                        {VENDOR_BILL_STATUS_LABELS[b.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {total > bills.length && (
            <div className="border-t bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
              Showing {bills.length} of {total} — open the Vendor Bills module for the full list.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
