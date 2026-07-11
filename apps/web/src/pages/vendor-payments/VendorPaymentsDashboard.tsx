import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import StatCard from "../../components/dashboard/StatCard";
import VendorPaymentTable from "../../components/vendor-payments/VendorPaymentTable";

import { getVendorPaymentDashboard, PAYMENT_MODE_LABELS } from "../../services/vendor-payments";
import type { VendorPaymentDashboardSummary } from "../../services/vendor-payments";
import LoadingState from "../../components/ui/LoadingState";

export default function VendorPaymentsDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<VendorPaymentDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendorPaymentDashboard()
      .then(setSummary)
      .catch(() => setError("Failed to load vendor payments dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vendor Payments Dashboard</h1>
          <p className="mt-2 text-slate-500">Payment activity and outstanding exposure across vendors.</p>
        </div>

        {loading && (
          <LoadingState label="Loading vendor payments dashboard..." />
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        )}

        {!loading && !error && summary && (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Payments" value={summary.totalPayments} />
              <StatCard title="Total Paid" value={`₹${summary.totalPaidAmount}`} />
              <StatCard title="Paid Today" value={`₹${summary.paidToday}`} />
              <StatCard title="Paid This Month" value={`₹${summary.paidThisMonth}`} />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Payments by Mode</h2>
              <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-6">
                {summary.byMode.length === 0 ? (
                  <p className="text-sm text-slate-500">No payments recorded yet.</p>
                ) : (
                  summary.byMode.map((m) => (
                    <StatCard
                      key={m.mode}
                      title={PAYMENT_MODE_LABELS[m.mode] ?? m.mode}
                      value={`₹${m.amount}`}
                      subtitle={`${m.count} payment${m.count === 1 ? "" : "s"}`}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Top Outstanding Vendors</h2>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left">Vendor</th>
                      <th className="px-6 py-4 text-right">Outstanding Balance</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topOutstandingVendors.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-10 text-center text-slate-500">No outstanding balances.</td>
                      </tr>
                    ) : (
                      summary.topOutstandingVendors.map((v) => (
                        <tr key={v.vendorId} className="border-t hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium">{v.vendorName}</td>
                          <td className="px-6 py-4 text-right font-medium text-red-600">₹{Number(v.outstandingBalance).toLocaleString("en-IN")}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => navigate(`/vendor-payments/ledger?vendorId=${v.vendorId}`)}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View Ledger
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Recent Payments</h2>
              <VendorPaymentTable
                payments={summary.recentPayments}
                onView={(id) => navigate(`/vendor-payments/${id}`)}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
