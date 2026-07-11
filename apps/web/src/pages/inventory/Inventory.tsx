import { useEffect, useState } from "react";
import { Plus, Download, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import InventoryFilters from "../../components/inventory/InventoryFilters";
import InventoryTable from "../../components/inventory/InventoryTable";

import { getInventoryItems, deleteInventoryItem, exportInventoryCSV } from "../../services/inventory";
import type { InventoryItem } from "../../services/inventory";
import LoadingState from "../../components/ui/LoadingState";

export default function Inventory() {
  const navigate = useNavigate();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const query = {
    search: search || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    warehouse: warehouseFilter || undefined,
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getInventoryItems(query);
      setItems(result.data);
    } catch {
      setError("Failed to load inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, categoryFilter, warehouseFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this inventory item?")) return;
    try {
      await deleteInventoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete inventory item.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportInventoryCSV(query);
    } catch {
      alert("Failed to export inventory.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
            <p className="mt-2 text-slate-500">Track stock levels, warehouses, and material movements.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/inventory/dashboard")}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Download size={18} />
              {exporting ? "Exporting..." : "Export"}
            </button>
            <button
              onClick={() => navigate("/inventory/new")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              New Item
            </button>
          </div>
        </div>

        <InventoryFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          warehouseFilter={warehouseFilter}
          onWarehouseChange={setWarehouseFilter}
        />

        {loading && (
          <LoadingState label="Loading inventory..." />
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <InventoryTable
            items={items}
            onView={(id) => navigate(`/inventory/${id}`)}
            onEdit={(id) => navigate(`/inventory/${id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
}
