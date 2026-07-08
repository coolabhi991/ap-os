import { Eye, Pencil, Trash2 } from "lucide-react";
import type { PurchaseRequisition } from "../../services/purchase-requisitions";
import { PR_STATUS_LABELS } from "../../services/purchase-requisitions";

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

interface Props {
  prs?: PurchaseRequisition[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PurchaseRequisitionTable({ prs = [], onView, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">PR Number</th>
            <th className="px-6 py-4 text-left">Title</th>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-left">Required Date</th>
            <th className="px-6 py-4 text-right">Amount</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {prs.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-slate-500">No requisitions found.</td>
            </tr>
          ) : (
            prs.map((pr) => (
              <tr key={pr.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-sm font-medium text-blue-700">{pr.requisitionNumber}</td>
                <td className="px-6 py-4 font-medium">{pr.title}</td>
                <td className="px-6 py-4 text-slate-600">{pr.project?.name ?? "—"}</td>
                <td className="px-6 py-4 text-slate-600">{pr.requiredDate || "—"}</td>
                <td className="px-6 py-4 text-right font-medium">₹{Number(pr.totalAmount).toLocaleString("en-IN")}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[pr.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {PR_STATUS_LABELS[pr.status] ?? pr.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => onView(pr.id)}><Eye size={18} className="text-blue-600" /></button>
                    <button onClick={() => onEdit(pr.id)}><Pencil size={18} className="text-green-600" /></button>
                    <button onClick={() => onDelete(pr.id)}><Trash2 size={18} className="text-red-600" /></button>
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
