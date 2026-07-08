import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getMaterialReceipt } from "../../services/material-receipts";
import { MR_STATUS_LABELS, MR_STATUS_COLORS } from "../../services/material-receipts";
import type { MaterialReceipt } from "../../services/material-receipts";

export default function ViewMaterialReceipt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mr, setMR] = useState<MaterialReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getMaterialReceipt(id)
      .then(setMR)
      .catch(() => setError("Material receipt not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading...</div></Layout>;
  if (error || !mr) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Material Receipt Not Found</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </Layout>
    );
  }

  const totals = {
    receiving: mr.items.reduce((s, i) => s + i.receivingQty, 0),
    accepted: mr.items.reduce((s, i) => s + i.acceptedQty, 0),
    rejected: mr.items.reduce((s, i) => s + i.rejectedQty, 0),
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm text-blue-600">{mr.receiptNumber}</p>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                {mr.purchaseOrder && (
                  <span>PO: <strong>{mr.purchaseOrder.poNumber}</strong></span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                {mr.vendor && <span>Vendor: <strong>{mr.vendor.name}</strong></span>}
                {mr.project && <span>Project: <strong>{mr.project.name}</strong></span>}
                <span>Received: <strong>{mr.receivedDate}</strong></span>
                {mr.challanNumber && <span>Challan: <strong>{mr.challanNumber}</strong></span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm font-medium ${MR_STATUS_COLORS[mr.status] ?? "bg-slate-100"}`}>
                {MR_STATUS_LABELS[mr.status] ?? mr.status}
              </span>
              <button onClick={() => navigate(`/material-receipts/${mr.id}/edit`)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Edit</button>
            </div>
          </div>
          <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-4">
            {mr.supplierInvoiceNumber && (
              <div><p className="text-xs text-slate-400">SUPPLIER INVOICE</p><p className="text-sm text-slate-700">{mr.supplierInvoiceNumber}</p></div>
            )}
            {mr.vehicleNumber && (
              <div><p className="text-xs text-slate-400">VEHICLE NUMBER</p><p className="text-sm text-slate-700">{mr.vehicleNumber}</p></div>
            )}
            {mr.receivedBy && (
              <div><p className="text-xs text-slate-400">RECEIVED BY</p><p className="text-sm text-slate-700">{mr.receivedBy}</p></div>
            )}
            {mr.supplierRepresentative && (
              <div><p className="text-xs text-slate-400">SUPPLIER REPRESENTATIVE</p><p className="text-sm text-slate-700">{mr.supplierRepresentative}</p></div>
            )}
            {mr.qualityStatus && (
              <div><p className="text-xs text-slate-400">QUALITY STATUS</p><p className="text-sm text-slate-700">{mr.qualityStatus.replace(/_/g, " ")}</p></div>
            )}
          </div>
        </div>

        {/* Items table */}
        {mr.items.length > 0 && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b px-8 py-5">
              <h2 className="text-lg font-semibold text-slate-700">Items</h2>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["#", "Item", "Unit", "Ordered", "Prev. Received", "Receiving", "Accepted", "Rejected", "Balance"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {mr.items.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-xs text-slate-500">{item.description}</div>
                    </td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3 text-right">{item.orderedQty}</td>
                    <td className="px-4 py-3 text-right">{item.previouslyReceivedQty}</td>
                    <td className="px-4 py-3 text-right">{item.receivingQty}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.acceptedQty}</td>
                    <td className="px-4 py-3 text-right text-red-600">{item.rejectedQty}</td>
                    <td className="px-4 py-3 text-right">{item.balanceQty}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-sm">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-slate-600">Totals</td>
                  <td className="px-4 py-2 text-right font-medium">{totals.receiving}</td>
                  <td className="px-4 py-2 text-right font-medium">{totals.accepted}</td>
                  <td className="px-4 py-2 text-right font-medium text-red-600">{totals.rejected}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {(mr.remarks || mr.notes) && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            {mr.remarks && (
              <>
                <h2 className="mb-3 font-semibold text-slate-700">Remarks</h2>
                <p className="text-slate-600">{mr.remarks}</p>
              </>
            )}
            {mr.notes && (
              <>
                <h2 className="mb-3 mt-4 font-semibold text-slate-700">Notes</h2>
                <p className="text-slate-600">{mr.notes}</p>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
