import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Expense } from "../../services/expenses";
import { PAYMENT_MODE_LABELS, PAYMENT_MODE_COLORS } from "../../services/expenses";

interface Props {
  expenses?: Expense[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/** The actual Source Account used for this expense — Cash/Bank Account for Cash/Bank modes, the Credit Card for Credit Card mode. Reuses whichever relation the expense already carries; no new data. */
function sourceAccountLabel(e: Expense): string {
  if (e.paymentMode === "CREDIT_CARD") return e.liability?.loanName ?? "—";
  if (e.companyBankAccount) return e.companyBankAccount.nickname || e.companyBankAccount.bankName;
  return "—";
}

export default function ExpenseTable({ expenses = [], onView, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Expense No.</th>
            <th className="px-6 py-4 text-left">Date</th>
            <th className="px-6 py-4 text-left">Project</th>
            <th className="px-6 py-4 text-left">Site</th>
            <th className="px-6 py-4 text-left">Category</th>
            <th className="px-6 py-4 text-right">Amount</th>
            <th className="px-6 py-4 text-left">Mode</th>
            <th className="px-6 py-4 text-left">Source Account</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-10 text-center text-slate-500">No expenses found.</td>
            </tr>
          ) : (
            expenses.map((e) => (
              <tr key={e.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-sm font-medium text-blue-700">{e.expenseNumber}</td>
                <td className="px-6 py-4 text-slate-600">{e.expenseDate}</td>
                <td className="px-6 py-4">{e.project?.name ?? "—"}</td>
                <td className="px-6 py-4">{e.site?.name ?? "—"}</td>
                <td className="px-6 py-4 text-slate-600">{e.category?.name ?? "—"}</td>
                <td className="px-6 py-4 text-right font-medium">₹{Number(e.amount).toLocaleString("en-IN")}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${PAYMENT_MODE_COLORS[e.paymentMode] ?? "bg-slate-100 text-slate-600"}`}>
                    {PAYMENT_MODE_LABELS[e.paymentMode] ?? e.paymentMode}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{sourceAccountLabel(e)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-4">
                    <button onClick={() => onView(e.id)}><Eye size={18} className="text-blue-600" /></button>
                    <button onClick={() => onEdit(e.id)}><Pencil size={18} className="text-green-600" /></button>
                    <button onClick={() => onDelete(e.id)}><Trash2 size={18} className="text-red-600" /></button>
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
