import { Eye, Pencil, Trash2 } from "lucide-react";
import type { VendorBill } from "../../services/vendor-bills";
import { VENDOR_BILL_STATUS_LABELS, VENDOR_BILL_STATUS_COLORS } from "../../services/vendor-bills";

interface Props {
  bills?: VendorBill[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function VendorBillTable({
  bills = [],
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Bill</th>
            <th className="px-6 py-4 text-left">Vendor</th>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-left">Due Date</th>
            <th className="px-6 py-4 text-right">Total</th>
            <th className="px-6 py-4 text-right">Outstanding</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {bills.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-slate-500">
                No vendor bills found.
              </td>
            </tr>
          ) : (
            bills.map((bill) => (
              <tr key={bill.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{bill.billNumber}</div>
                  <div className="text-xs text-slate-400">{bill.billDate}</div>
                </td>
                <td className="px-6 py-4">{bill.vendor?.name || "—"}</td>
                <td className="px-6 py-4">{bill.project?.name || "—"}</td>
                <td className="px-6 py-4">
                  {bill.dueDate || "—"}
                  {bill.isOverdue && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Overdue
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-medium">{bill.totalAmount}</td>
                <td className="px-6 py-4 text-right">{bill.outstandingBalance}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      VENDOR_BILL_STATUS_COLORS[bill.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {VENDOR_BILL_STATUS_LABELS[bill.status] ?? bill.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => onView(bill.id)}>
                      <Eye size={18} className="text-blue-600" />
                    </button>
                    <button onClick={() => onEdit(bill.id)}>
                      <Pencil size={18} className="text-green-600" />
                    </button>
                    <button onClick={() => onDelete(bill.id)}>
                      <Trash2 size={18} className="text-red-600" />
                    </button>
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
