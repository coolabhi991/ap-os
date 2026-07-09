import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPurchaseRequisitions, PR_STATUS_LABELS } from "../../../services/purchase-requisitions";
import type { PurchaseRequisition } from "../../../services/purchase-requisitions";
import { getPurchaseOrders, PO_STATUS_LABELS, PO_STATUS_COLORS } from "../../../services/purchase-orders";
import type { PurchaseOrder } from "../../../services/purchase-orders";
import type { Project } from "../../../services/projects";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function ProcurementTab({ project }: { project: Project }) {
  const navigate = useNavigate();
  const [prs, setPrs] = useState<PurchaseRequisition[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getPurchaseRequisitions({ projectId: project.id, page: 1, limit: 10 }),
      getPurchaseOrders({ projectId: project.id, page: 1, limit: 10 }),
    ])
      .then(([prRes, poRes]) => {
        setPrs(prRes.data);
        setPos(poRes.data);
      })
      .catch(() => setError("Failed to load procurement data."))
      .finally(() => setLoading(false));
  }, [project.id]);

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Purchase Requisitions</h2>
          <button onClick={() => navigate("/purchase-requisitions")} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Open Module</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left">Requisition #</th><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-left">Status</th></tr></thead>
            <tbody>
              {prs.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-500">No requisitions for this project yet.</td></tr>
              ) : prs.map((pr) => (
                <tr key={pr.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/purchase-requisitions/${pr.id}`)}>
                  <td className="px-4 py-3">{pr.requisitionNumber}</td>
                  <td className="px-4 py-3">{pr.title}</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(pr.totalAmount)}</td>
                  <td className="px-4 py-3">{PR_STATUS_LABELS[pr.status] ?? pr.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Purchase Orders</h2>
          <button onClick={() => navigate("/purchase-orders")} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Open Module</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left">PO #</th><th className="px-4 py-3 text-left">Vendor</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-left">Status</th></tr></thead>
            <tbody>
              {pos.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-500">No purchase orders for this project yet.</td></tr>
              ) : pos.map((po) => (
                <tr key={po.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                  <td className="px-4 py-3">{po.poNumber}</td>
                  <td className="px-4 py-3">{po.vendor?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(po.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${PO_STATUS_COLORS[po.status]}`}>{PO_STATUS_LABELS[po.status] ?? po.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
