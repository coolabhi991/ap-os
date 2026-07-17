import { useNavigate } from "react-router-dom";
import { IndianRupee } from "lucide-react";
import type { RunningBill, PaymentRegisterRow } from "../../../services/running-bills";
import { formatCurrency as inr } from "../../../lib/utils";
import EmptyTableRow from "../../ui/EmptyTableRow";

export default function PaymentStatusTab({ bill, payments, onRecordPayment }: { bill: RunningBill; payments: PaymentRegisterRow[]; onRecordPayment: () => void }) {
  const navigate = useNavigate();
  const canRecordPayment = bill.status === "PASSED" || bill.status === "PARTLY_PAID";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Net Payable</p>
          <p className="mt-1 text-lg font-bold">{inr(bill.netPayable)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Amount Received</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{inr(bill.amountReceived)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Outstanding</p>
          <p className="mt-1 text-lg font-bold text-amber-600">{inr(bill.outstandingAmount)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Payments Received</h2>
          {canRecordPayment && (
            <button onClick={onRecordPayment} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
              <IndianRupee size={15} /> Record Payment
            </button>
          )}
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Payment #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Mode</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">Bank Account</th>
                <th className="px-4 py-3 text-left">Remarks</th>
                <th className="px-4 py-3 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <EmptyTableRow colSpan={8}>No payments recorded yet.</EmptyTableRow>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{p.paymentNumber}</td>
                    <td className="px-4 py-3">{p.paymentDate}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">{inr(p.amount)}</td>
                    <td className="px-4 py-3">{p.mode}</td>
                    <td className="px-4 py-3 text-slate-500">{p.referenceNumber || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{p.companyBankAccount ? `${p.companyBankAccount.bankName} (${p.companyBankAccount.accountNumber})` : "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{p.remarks || "—"}</td>
                    <td className="px-4 py-3">
                      {p.sourceBankTransaction ? (
                        <button type="button" onClick={() => navigate(`/banking/accounts/${p.sourceBankTransaction!.companyBankAccountId}`)} className="text-blue-600 hover:underline">
                          Open Bank Transaction
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
