import { Eye, Pencil, Trash2 } from "lucide-react";
import type { MaterialReceipt } from "../../services/material-receipts";
import { MR_STATUS_LABELS, MR_STATUS_COLORS } from "../../services/material-receipts";

interface Props {
  mrs?: MaterialReceipt[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MaterialReceiptTable({ mrs = [], onView, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">GRN Number</th>
            <th className="px-6 py-4 text-left">PO Reference</th>
            <th className="px-6 py-4 text-left">Vendor</th>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-left">Received Date</th>
            <th className="px-6 py-4 text-right">Total Qty</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mrs.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-slate-500">No material receipts found.</td>
            </tr>
          ) : (
            mrs.map((mr) => (
              <tr key={mr.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-sm font-medium text-blue-700">{mr.receiptNumber}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{mr.purchaseOrder?.poNumber ?? "—"}</td>
                <td className="px-6 py-4">{mr.vendor?.name ?? "—"}</td>
                <td className="px-6 py-4 text-slate-600">{mr.project?.name ?? "—"}</td>
                <td className="px-6 py-4 text-slate-600">{mr.receivedDate}</td>
                <td className="px-6 py-4 text-right font-medium">{Number(mr.totalQty).toLocaleString("en-IN")}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${MR_STATUS_COLORS[mr.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {MR_STATUS_LABELS[mr.status] ?? mr.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => onView(mr.id)}><Eye size={18} className="text-blue-600" /></button>
                    <button onClick={() => onEdit(mr.id)}><Pencil size={18} className="text-green-600" /></button>
                    <button onClick={() => onDelete(mr.id)}><Trash2 size={18} className="text-red-600" /></button>
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
