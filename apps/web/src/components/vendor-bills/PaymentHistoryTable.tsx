import type { VendorBillPayment } from "../../services/vendor-bills";
import { PAYMENT_MODE_LABELS } from "../../services/vendor-payments";

interface Props {
  payments?: VendorBillPayment[];
}

export default function PaymentHistoryTable({ payments = [] }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Payment No.</th>
            <th className="px-6 py-4 text-left">Date</th>
            <th className="px-6 py-4 text-right">Amount</th>
            <th className="px-6 py-4 text-left">Mode</th>
            <th className="px-6 py-4 text-left">Reference</th>
            <th className="px-6 py-4 text-left">From / To Account</th>
            <th className="px-6 py-4 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-slate-500">
                No payments recorded yet.
              </td>
            </tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">{p.paymentNumber}</td>
                <td className="px-6 py-4">{new Date(p.paymentDate).toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-medium">{p.amount}</td>
                <td className="px-6 py-4">{p.mode ? (PAYMENT_MODE_LABELS[p.mode] ?? p.mode) : "—"}</td>
                <td className="px-6 py-4 font-mono text-xs">{p.referenceNumber || "—"}</td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {p.companyBankAccount && <div>From: {p.companyBankAccount.nickname || p.companyBankAccount.bankName}</div>}
                  {p.vendorBankAccount && <div>To: {p.vendorBankAccount.nickname || p.vendorBankAccount.bankName}</div>}
                  {p.paidToOtherParty && <div className="font-medium text-amber-600">Paid to: {p.paidToName}</div>}
                  {!p.companyBankAccount && !p.vendorBankAccount && !p.paidToOtherParty && "—"}
                </td>
                <td className="px-6 py-4 text-slate-500">{p.remarks || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
