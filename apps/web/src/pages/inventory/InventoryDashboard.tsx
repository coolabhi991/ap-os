import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import StatCard from "../../components/dashboard/StatCard";
import LowStockAlerts from "../../components/inventory/LowStockAlerts";
import StockLedgerTable from "../../components/inventory/StockLedgerTable";

import { getInventoryDashboard, getLowStockAlerts } from "../../services/inventory";
import type { InventoryDashboardSummary, InventoryItem, StockLedgerEntry } from "../../services/inventory";
import LoadingState from "../../components/ui/LoadingState";

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<InventoryDashboardSummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getInventoryDashboard(), getLowStockAlerts()])
      .then(([summaryResult, alertsResult]) => {
        setSummary(summaryResult);
        setLowStockItems(alertsResult);
      })
      .catch(() => setError("Failed to load inventory dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const recentMovements: StockLedgerEntry[] = (summary?.recentMovements ?? []).map((m) => ({
    id: m.id,
    inventoryId: m.item?.id ?? "",
    item: m.item,
    movementType: m.movementType as StockLedgerEntry["movementType"],
    quantity: m.quantity,
    balanceAfter: m.balanceAfter,
    referenceType: "",
    referenceId: "",
    referenceNumber: m.referenceNumber,
    remarks: "",
    movementDate: m.movementDate,
  }));

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory Dashboard</h1>
          <p className="mt-2 text-slate-500">Stock health across all warehouses and projects.</p>
        </div>

        {loading && (
          <LoadingState label="Loading inventory dashboard..." />
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        )}

        {!loading && !error && summary && (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
              <StatCard title="Total Items" value={summary.totalItems} />
              <StatCard title="Healthy" value={summary.healthyCount} subtitle="Stock within safe range" />
              <StatCard title="Low Stock" value={summary.lowCount} subtitle="At or below reorder level" />
              <StatCard title="Critical" value={summary.criticalCount} subtitle="At or below minimum stock" />
              <StatCard title="Out of Stock" value={summary.outOfStockCount} subtitle="Requires immediate action" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Recent Stock Movements</h2>
                <StockLedgerTable entries={recentMovements} showItemColumn />
              </div>

              <LowStockAlerts items={lowStockItems} onView={(id) => navigate(`/inventory/${id}`)} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
