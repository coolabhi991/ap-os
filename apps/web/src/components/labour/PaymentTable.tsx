import { Trash2 } from "lucide-react";
import type { LabourPayment } from "../../services/labour-payments";
import { PAYMENT_MODE_LABELS } from "../../services/labour-payments";

interface Props {
  payments?: LabourPayment[];
  onDelete: (id: string) => void;
}

export default function PaymentTable({ payments = [], onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Date</th>
            <th className="px-6 py-4 text-left">Worker</th>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-right">Amount</th>
            <th className="px-6 py-4 text-left">Mode</th>
            <th className="px-6 py-4 text-left">Linked Expense</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-slate-500">No payments found.</td>
            </tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-600">{p.paymentDate}</td>
                <td className="px-6 py-4 font-medium">{p.labour?.name ?? "—"}</td>
                <td className="px-6 py-4">{p.project?.name ?? "—"}</td>
                <td className="px-6 py-4 text-right font-medium">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                <td className="px-6 py-4">{PAYMENT_MODE_LABELS[p.mode] ?? p.mode}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.expense?.expenseNumber ?? "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <button onClick={() => onDelete(p.id)}><Trash2 size={18} className="text-red-600" /></button>
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
