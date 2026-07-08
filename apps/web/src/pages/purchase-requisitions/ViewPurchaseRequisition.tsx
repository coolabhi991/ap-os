import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getPurchaseRequisition } from "../../services/purchase-requisitions";
import { PR_STATUS_LABELS } from "../../services/purchase-requisitions";
import type { PurchaseRequisition } from "../../services/purchase-requisitions";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ORDERED: "bg-blue-100 text-blue-700",
  PARTIALLY_RECEIVED: "bg-indigo-100 text-indigo-700",
  RECEIVED: "bg-teal-100 text-teal-700",
  CLOSED: "bg-slate-200 text-slate-500",
};

export default function ViewPurchaseRequisition() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pr, setPR] = useState<PurchaseRequisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPurchaseRequisition(id)
      .then(setPR)
      .catch(() => setError("Requisition not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  }

  if (error || !pr) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Requisition Not Found</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm text-blue-600">{pr.requisitionNumber}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">{pr.title}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                {pr.project && <span>Project: <strong>{pr.project.name}</strong></span>}
                {pr.vendor && <span>Vendor: <strong>{pr.vendor.name}</strong></span>}
                {pr.requiredDate && <span>Required by: <strong>{pr.requiredDate}</strong></span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm font-medium ${statusColors[pr.status] ?? "bg-slate-100"}`}>
                {PR_STATUS_LABELS[pr.status] ?? pr.status}
              </span>
              <button
                onClick={() => navigate(`/purchase-requisitions/${pr.id}/edit`)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
              >
                Edit
              </button>
            </div>
          </div>
          {pr.description && <p className="mt-4 text-slate-600">{pr.description}</p>}
        </div>

        {/* Items table */}
        {pr.items.length > 0 && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b px-8 py-5">
              <h2 className="text-lg font-semibold text-slate-700">Items</h2>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">#</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">Description</th>
                  <th className="px-6 py-3 text-right font-medium text-slate-600">Qty</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-600">Unit</th>
                  <th className="px-6 py-3 text-right font-medium text-slate-600">Rate (₹)</th>
                  <th className="px-6 py-3 text-right font-medium text-slate-600">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pr.items.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-6 py-3">{item.description}</td>
                    <td className="px-6 py-3 text-right">{item.quantity}</td>
                    <td className="px-6 py-3">{item.unit}</td>
                    <td className="px-6 py-3 text-right">{item.estimatedRate.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-3 text-right font-medium">{item.amount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right font-semibold text-slate-700">Total</td>
                  <td className="px-6 py-4 text-right text-lg font-bold text-slate-900">
                    ₹{Number(pr.totalAmount).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Notes */}
        {pr.notes && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-700">Notes</h2>
            <p className="text-slate-600">{pr.notes}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
