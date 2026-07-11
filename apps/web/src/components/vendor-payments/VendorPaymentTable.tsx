import { Eye } from "lucide-react";
import type { VendorPayment } from "../../services/vendor-payments";
import { PAYMENT_MODE_LABELS } from "../../services/vendor-payments";

interface Props {
  payments?: VendorPayment[];
  onView: (id: string) => void;
}

export default function VendorPaymentTable({ payments = [], onView }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-6 py-4 text-left">Payment No.</th>
            <th className="px-6 py-4 text-left">Vendor</th>
            <th className="px-6 py-4 text-left">Bill Number</th>
            <th className="px-6 py-4 text-left">Date</th>
            <th className="px-6 py-4 text-right">Amount</th>
            <th className="px-6 py-4 text-left">Mode</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-slate-500">No vendor payments found.</td>
            </tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-sm font-medium text-blue-700">{p.paymentNumber}</td>
                <td className="px-6 py-4">
                  {p.vendor?.name ?? "—"}
                  {p.paidToOtherParty && <div className="text-xs font-medium text-amber-600">Paid to: {p.paidToName}</div>}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{p.vendorBill?.billNumber ?? "—"}</td>
                <td className="px-6 py-4 text-slate-600">{new Date(p.paymentDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right font-medium">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                <td className="px-6 py-4">{p.mode ? (PAYMENT_MODE_LABELS[p.mode] ?? p.mode) : "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <button onClick={() => onView(p.id)}><Eye size={18} className="text-blue-600" /></button>
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
