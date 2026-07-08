import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import StatCard from "../../components/dashboard/StatCard";
import VendorBillTable from "../../components/vendor-bills/VendorBillTable";

import { getVendorBillDashboard, deleteVendorBill } from "../../services/vendor-bills";
import type { VendorBillDashboardSummary } from "../../services/vendor-bills";

export default function VendorBillsDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<VendorBillDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    getVendorBillDashboard()
      .then(setSummary)
      .catch(() => setError("Failed to load vendor bills dashboard."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this vendor bill?")) return;
    try {
      await deleteVendorBill(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete vendor bill.");
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vendor Bills Dashboard</h1>
          <p className="mt-2 text-slate-500">Payables health across all vendors and projects.</p>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
            Loading vendor bills dashboard...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        )}

        {!loading && !error && summary && (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
              <StatCard title="Total Bills" value={summary.totalBills} />
              <StatCard title="Pending" value={summary.countsByStatus.PENDING ?? 0} />
              <StatCard title="Partially Paid" value={summary.countsByStatus.PARTIALLY_PAID ?? 0} />
              <StatCard title="Paid" value={summary.countsByStatus.PAID ?? 0} />
              <StatCard title="Overdue" value={summary.overdueCount} subtitle={`₹${summary.overdueAmount} outstanding`} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <StatCard title="Total Billed" value={`₹${summary.totalBilled}`} />
              <StatCard title="Total Paid" value={`₹${summary.totalPaid}`} />
              <StatCard title="Total Outstanding" value={`₹${summary.totalOutstanding}`} />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Overdue Bills</h2>
              <VendorBillTable
                bills={summary.overdueBills}
                onView={(id) => navigate(`/vendor-bills/${id}`)}
                onEdit={(id) => navigate(`/vendor-bills/${id}/edit`)}
                onDelete={handleDelete}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Recent Bills</h2>
              <VendorBillTable
                bills={summary.recentBills}
                onView={(id) => navigate(`/vendor-bills/${id}`)}
                onEdit={(id) => navigate(`/vendor-bills/${id}/edit`)}
                onDelete={handleDelete}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
