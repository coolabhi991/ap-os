import { Eye, Pencil, Trash2 } from "lucide-react";
import type { PurchaseOrder } from "../../services/purchase-orders";
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from "../../services/purchase-orders";

interface Props {
  pos?: PurchaseOrder[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PurchaseOrderTable({ pos = [], onView, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">PO Number</th>
            <th className="px-6 py-4 text-left">PR Reference</th>
            <th className="px-6 py-4 text-left">Vendor</th>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-left">Order Date</th>
            <th className="px-6 py-4 text-right">Amount</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pos.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-slate-500">No purchase orders found.</td>
            </tr>
          ) : (
            pos.map((po) => (
              <tr key={po.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-sm font-medium text-blue-700">{po.poNumber}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{po.requisition?.requisitionNumber ?? "—"}</td>
                <td className="px-6 py-4">{po.vendor?.name ?? "—"}</td>
                <td className="px-6 py-4 text-slate-600">{po.project?.name ?? "—"}</td>
                <td className="px-6 py-4 text-slate-600">{po.orderDate}</td>
                <td className="px-6 py-4 text-right font-medium">
                  ₹{Number(po.amount).toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${PO_STATUS_COLORS[po.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {PO_STATUS_LABELS[po.status] ?? po.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => onView(po.id)}><Eye size={18} className="text-blue-600" /></button>
                    <button onClick={() => onEdit(po.id)}><Pencil size={18} className="text-green-600" /></button>
                    <button onClick={() => onDelete(po.id)}><Trash2 size={18} className="text-red-600" /></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
