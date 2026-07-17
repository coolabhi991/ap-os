import type { RunningBill } from "../../../services/running-bills";
import { DEDUCTION_TYPE_LABELS } from "../../../services/running-bills";
import { formatCurrency as inr } from "../../../lib/utils";
import EmptyTableRow from "../../ui/EmptyTableRow";

export default function DeductionsTab({ bill }: { bill: RunningBill }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">GST (Auto-Calculated)</h2>
        <p className="mt-1 text-xs text-slate-500">
          GST is computed automatically as part of the Form 58 flow and added to the Gross Bill Amount — it is never entered as a manual deduction.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">GST %</p>
            <p className="mt-1 text-sm font-semibold">{bill.gstPercent || 0}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">GST Amount</p>
            <p className="mt-1 text-sm font-semibold">{inr(bill.gstAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">GST Difference</p>
            <p className="mt-1 text-sm font-semibold">{inr(bill.gstDifferenceAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total GST</p>
            <p className="mt-1 text-sm font-semibold">{inr(bill.totalGstAmount)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Manual Deductions</h2>
        <p className="mt-1 text-xs text-slate-500">Security Deposit, TDS, Income Tax, Labour Cess, Royalty, Mobilization Recovery, Insurance, Fine, and Other statutory recoveries — subtracted from the Gross Bill Amount.</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Label</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {bill.deductions.length === 0 ? (
                <EmptyTableRow colSpan={4}>No manual deductions on this bill.</EmptyTableRow>
              ) : (
                bill.deductions.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-2">{DEDUCTION_TYPE_LABELS[d.type] ?? d.type}</td>
                    <td className="px-4 py-2">{d.label}</td>
                    <td className="px-4 py-2 text-right">{inr(d.amount)}</td>
                    <td className="px-4 py-2 text-slate-500">{d.remarks || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Total Deductions</p>
          <p className="mt-1 text-xl font-bold text-red-600">{inr(bill.totalDeductions)}</p>
        </div>
        <div className="rounded-xl bg-slate-900 p-5 shadow-sm">
          <p className="text-xs text-white/70">Net Payable</p>
          <p className="mt-1 text-xl font-bold text-white">{inr(bill.netPayable)}</p>
        </div>
      </div>
    </div>
  );
}
