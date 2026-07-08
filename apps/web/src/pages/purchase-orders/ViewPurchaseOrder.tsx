import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getPurchaseOrder } from "../../services/purchase-orders";
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from "../../services/purchase-orders";
import type { PurchaseOrder } from "../../services/purchase-orders";

export default function ViewPurchaseOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPurchaseOrder(id)
      .then(setPO)
      .catch(() => setError("Purchase order not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error || !po) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Purchase Order Not Found</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  const totals = {
    subtotal: po.items.reduce((s, i) => s + i.subtotal, 0),
    discount: Number(po.discount),
    gst: Number(po.gstAmount),
    total: Number(po.amount),
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm text-blue-600">{po.poNumber}</p>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                {po.requisition && (
                  <span>PR: <strong>{po.requisition.requisitionNumber}</strong> — {po.requisition.title}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                {po.vendor && <span>Vendor: <strong>{po.vendor.name}</strong></span>}
                {po.project && <span>Project: <strong>{po.project.name}</strong></span>}
                <span>Order Date: <strong>{po.orderDate}</strong></span>
                {po.expectedDate && <span>Expected: <strong>{po.expectedDate}</strong></span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm font-medium ${PO_STATUS_COLORS[po.status] ?? "bg-slate-100"}`}>
                {PO_STATUS_LABELS[po.status] ?? po.status}
              </span>
              <button onClick={() => navigate(`/purchase-orders/${po.id}/edit`)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Edit</button>
            </div>
          </div>
          {(po.deliveryAddress || po.paymentTerms) && (
            <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
              {po.deliveryAddress && (
                <div><p className="text-xs text-slate-400">DELIVERY ADDRESS</p><p className="text-sm text-slate-700">{po.deliveryAddress}</p></div>
              )}
              {po.paymentTerms && (
                <div><p className="text-xs text-slate-400">PAYMENT TERMS</p><p className="text-sm text-slate-700">{po.paymentTerms}</p></div>
              )}
            </div>
          )}
        </div>

        {/* Items table */}
        {po.items.length > 0 && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b px-8 py-5">
              <h2 className="text-lg font-semibold text-slate-700">Items</h2>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["#", "Code", "Item", "Description", "Unit", "Qty", "Rate", "GST%", "Disc%", "Amount (₹)"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {po.items.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs">{item.itemCode || "—"}</td>
                    <td className="px-4 py-3 font-medium">{item.itemName}</td>
                    <td className="px-4 py-3 text-slate-600">{item.description}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">₹{item.rate.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right">{item.gstPercent}%</td>
                    <td className="px-4 py-3 text-right">{item.discountPercent}%</td>
                    <td className="px-4 py-3 text-right font-medium">₹{item.amount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-sm">
                <tr><td colSpan={9} className="px-4 py-2 text-right text-slate-600">Subtotal</td><td className="px-4 py-2 text-right">₹{totals.subtotal.toLocaleString("en-IN")}</td></tr>
                <tr><td colSpan={9} className="px-4 py-2 text-right text-slate-600">Discount</td><td className="px-4 py-2 text-right text-red-600">- ₹{totals.discount.toLocaleString("en-IN")}</td></tr>
                <tr><td colSpan={9} className="px-4 py-2 text-right text-slate-600">GST</td><td className="px-4 py-2 text-right">+ ₹{totals.gst.toLocaleString("en-IN")}</td></tr>
                <tr className="border-t border-slate-300"><td colSpan={9} className="px-4 py-3 text-right font-bold text-slate-700 text-base">Grand Total</td><td className="px-4 py-3 text-right text-lg font-bold text-slate-900">₹{totals.total.toLocaleString("en-IN")}</td></tr>
              </tfoot>
            </table>
          </div>
        )}

        {po.notes && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-700">Notes / Terms</h2>
            <p className="text-slate-600">{po.notes}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
