import { useEffect, useState } from "react";
import { getVendorLedger } from "../../../services/vendor-payments";
import type { VendorLedger } from "../../../services/vendor-payments";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function VendorLedgerTab({ vendorId }: { vendorId: string }) {
  const [ledger, setLedger] = useState<VendorLedger | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getVendorLedger(vendorId, { fromDate: fromDate || undefined, toDate: toDate || undefined })
      .then(setLedger)
      .catch(() => setError("Failed to load ledger."))
      .finally(() => setLoading(false));
  }, [vendorId, fromDate, toDate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <label className="text-sm text-slate-500">From</label>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border p-2.5" />
        <label className="text-sm text-slate-500">To</label>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border p-2.5" />
      </div>

      {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
      {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

      {!loading && !error && ledger && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total Billed</p><p className="mt-1 text-xl font-bold">{inr(ledger.totalBilled)}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total Paid</p><p className="mt-1 text-xl font-bold text-emerald-600">{inr(ledger.totalPaid)}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Outstanding</p><p className="mt-1 text-xl font-bold text-amber-600">{inr(ledger.outstandingBalance)}</p></div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.entries.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-500">No ledger entries in this range.</td></tr>
                ) : (
                  ledger.entries.map((e, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{e.type === "BILL" ? "Bill" : "Payment"}</td>
                      <td className="px-4 py-3">{e.reference}</td>
                      <td className="px-4 py-3 text-right">{Number(e.debit) > 0 ? inr(e.debit) : "—"}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{Number(e.credit) > 0 ? inr(e.credit) : "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">{inr(e.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
