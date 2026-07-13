import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import { getVendors } from "../../services/vendors";
import { getVendorLedger } from "../../services/vendor-payments";
import type { VendorLedger as VendorLedgerData } from "../../services/vendor-payments";
import LoadingState from "../../components/ui/LoadingState";
import ReportExportBar from "../../components/ui/ReportExportBar";

export default function VendorLedger() {
  const [searchParams, setSearchParams] = useSearchParams();
  const vendorId = searchParams.get("vendorId") ?? "";

  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [ledger, setLedger] = useState<VendorLedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendors({ limit: 100 }).then((r) => setVendors(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!vendorId) {
      setLedger(null);
      return;
    }
    setLoading(true);
    setError(null);
    getVendorLedger(vendorId, {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    })
      .then(setLedger)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load vendor ledger."))
      .finally(() => setLoading(false));
  }, [vendorId, fromDate, toDate]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendor Ledger</h1>
            <p className="mt-2 text-slate-500">Running balance of bills and payments for a vendor.</p>
          </div>
          {ledger && (
            <ReportExportBar
              input={{
                title: "Vendor Ledger",
                subtitle: `Vendor: ${vendors.find((v) => v.id === vendorId)?.name ?? vendorId}${fromDate ? ` | From ${fromDate}` : ""}${toDate ? ` | To ${toDate}` : ""}`,
                columns: [
                  { key: "date", label: "Date" },
                  { key: "type", label: "Type" },
                  { key: "reference", label: "Reference" },
                  { key: "debit", label: "Debit (Billed)", align: "right" },
                  { key: "credit", label: "Credit (Paid)", align: "right" },
                  { key: "balance", label: "Balance", align: "right" },
                ],
                rows: ledger.entries.map((e) => ({
                  date: new Date(e.date).toLocaleDateString(),
                  type: e.type === "BILL" ? "Bill" : "Payment",
                  reference: e.reference,
                  debit: e.debit,
                  credit: e.credit,
                  balance: e.balance,
                })),
                totals: { date: "TOTAL", debit: ledger.totalBilled, credit: ledger.totalPaid, balance: ledger.outstandingBalance },
              }}
            />
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <select
              value={vendorId}
              onChange={(e) => setSearchParams(e.target.value ? { vendorId: e.target.value } : {})}
              className="rounded-lg border p-3 outline-none focus:border-blue-500"
            >
              <option value="">Select Vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 md:col-span-2">
              <label className="whitespace-nowrap text-sm text-slate-500">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-lg border p-3" />
              <label className="whitespace-nowrap text-sm text-slate-500">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-lg border p-3" />
            </div>
          </div>
        </div>

        {!vendorId && (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
            Select a vendor to view their ledger.
          </div>
        )}

        {loading && (
          <LoadingState label="Loading ledger..." />
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        )}

        {!loading && !error && ledger && (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Total Billed</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">₹{ledger.totalBilled}</h2>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Total Paid</p>
                <h2 className="mt-2 text-2xl font-bold text-emerald-600">₹{ledger.totalPaid}</h2>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Outstanding Balance</p>
                <h2 className="mt-2 text-2xl font-bold text-red-600">₹{ledger.outstandingBalance}</h2>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-left">Reference</th>
                    <th className="px-6 py-4 text-right">Debit (Billed)</th>
                    <th className="px-6 py-4 text-right">Credit (Paid)</th>
                    <th className="px-6 py-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">No transactions for this vendor.</td>
                    </tr>
                  ) : (
                    ledger.entries.map((e, i) => (
                      <tr key={i} className="border-t hover:bg-slate-50">
                        <td className="px-6 py-4 text-slate-600">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${e.type === "BILL" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {e.type === "BILL" ? "Bill" : "Payment"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">{e.reference}</td>
                        <td className="px-6 py-4 text-right">{Number(e.debit) > 0 ? `₹${Number(e.debit).toLocaleString("en-IN")}` : "—"}</td>
                        <td className="px-6 py-4 text-right">{Number(e.credit) > 0 ? `₹${Number(e.credit).toLocaleString("en-IN")}` : "—"}</td>
                        <td className="px-6 py-4 text-right font-medium">₹{Number(e.balance).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
