import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Printer, MessageCircle } from "lucide-react";

import Layout from "../../components/layout/Layout";
import { getVendorBillDashboard, exportVendorBillsCSV, VENDOR_BILL_STATUS_LABELS, VENDOR_BILL_STATUS_COLORS } from "../../services/vendor-bills";
import type { VendorBillDashboardSummary } from "../../services/vendor-bills";
import { getVendorPaymentDashboard, exportVendorPaymentsCSV } from "../../services/vendor-payments";
import type { VendorPaymentDashboardSummary } from "../../services/vendor-payments";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function VendorReports() {
  const navigate = useNavigate();
  const [billSummary, setBillSummary] = useState<VendorBillDashboardSummary | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<VendorPaymentDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getVendorBillDashboard(), getVendorPaymentDashboard()])
      .then(([bills, payments]) => {
        setBillSummary(bills);
        setPaymentSummary(payments);
      })
      .catch(() => setError("Failed to load vendor reports."))
      .finally(() => setLoading(false));
  }, []);

  const handleWhatsApp = () => {
    if (!billSummary || !paymentSummary) return;
    const text = [
      "Vendor Reports Summary",
      `Total Billed: ${inr(billSummary.totalBilled)}`,
      `Total Paid: ${inr(billSummary.totalPaid)}`,
      `Total Outstanding: ${inr(billSummary.totalOutstanding)}`,
      `Overdue Bills: ${billSummary.overdueCount} (${inr(billSummary.overdueAmount)})`,
      `Paid This Month: ${inr(paymentSummary.paidThisMonth)}`,
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <div className="space-y-6 print:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendor Reports</h1>
            <p className="mt-2 text-slate-500">Payables, payments, and outstanding balances across all vendors.</p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button onClick={() => exportVendorBillsCSV()} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50"><Download className="h-4 w-4" /> Bills CSV</button>
            <button onClick={() => exportVendorPaymentsCSV()} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50"><Download className="h-4 w-4" /> Payments CSV</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50"><Printer className="h-4 w-4" /> Print</button>
            <button onClick={handleWhatsApp} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
          </div>
        </div>

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}

        {!loading && !error && billSummary && paymentSummary && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total Billed</p><p className="mt-1 text-xl font-bold">{inr(billSummary.totalBilled)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total Paid</p><p className="mt-1 text-xl font-bold text-emerald-600">{inr(billSummary.totalPaid)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total Outstanding</p><p className="mt-1 text-xl font-bold text-amber-600">{inr(billSummary.totalOutstanding)}</p></div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-5"><p className="text-sm text-red-700">Overdue</p><p className="mt-1 text-xl font-bold text-red-700">{billSummary.overdueCount} — {inr(billSummary.overdueAmount)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Paid This Month</p><p className="mt-1 text-xl font-bold">{inr(paymentSummary.paidThisMonth)}</p></div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Top Outstanding Vendors</h2>
                <div className="space-y-2">
                  {paymentSummary.topOutstandingVendors.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">No outstanding balances.</p>
                  ) : (
                    paymentSummary.topOutstandingVendors.map((v) => (
                      <div key={v.vendorId} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50" onClick={() => navigate(`/vendors/${v.vendorId}`)}>
                        <p className="text-sm font-medium">{v.vendorName}</p>
                        <p className="font-semibold text-amber-600">{inr(v.outstandingBalance)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Overdue Bills</h2>
                <div className="space-y-2">
                  {billSummary.overdueBills.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">No overdue bills.</p>
                  ) : (
                    billSummary.overdueBills.map((b) => (
                      <div key={b.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50" onClick={() => navigate(`/vendor-bills/${b.id}`)}>
                        <div>
                          <p className="text-sm font-medium">{b.billNumber}</p>
                          <p className="text-xs text-slate-500">{b.vendor?.name ?? "—"} · Due {b.dueDate}</p>
                        </div>
                        <p className="font-semibold text-red-600">{inr(b.outstandingBalance)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Bills by Status</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(billSummary.countsByStatus).map(([status, count]) => (
                  <span key={status} className={`rounded-full px-3 py-1 text-xs font-medium ${VENDOR_BILL_STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700"}`}>
                    {VENDOR_BILL_STATUS_LABELS[status] ?? status}: {count}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
