import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import PurchaseOrderFilters from "../../components/purchase-orders/PurchaseOrderFilters";
import PurchaseOrderTable from "../../components/purchase-orders/PurchaseOrderTable";

import { getPurchaseOrders, deletePurchaseOrder } from "../../services/purchase-orders";
import { getProjects } from "../../services/projects";
import type { PurchaseOrder } from "../../services/purchase-orders";

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProjects({ limit: 100 }).then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPurchaseOrders({
        search: search || undefined,
        status: statusFilter || undefined,
        projectId: projectFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setPOs(result.data);
    } catch {
      setError("Failed to load purchase orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter, projectFilter, fromDate, toDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this purchase order?")) return;
    try {
      await deletePurchaseOrder(id);
      setPOs((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to delete purchase order.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>
            <p className="mt-2 text-slate-500">Manage vendor purchase orders created from approved requisitions.</p>
          </div>
          <button
            onClick={() => navigate("/purchase-orders/new")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            <Plus size={18} /> New Purchase Order
          </button>
        </div>

        <PurchaseOrderFilters
          search={search} onSearchChange={setSearch}
          statusFilter={statusFilter} onStatusChange={setStatusFilter}
          projectFilter={projectFilter} onProjectChange={setProjectFilter}
          projects={projects}
          fromDate={fromDate} onFromDateChange={setFromDate}
          toDate={toDate} onToDateChange={setToDate}
        />

        {loading && <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>}
        {error && !loading && <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>}
        {!loading && !error && (
          <PurchaseOrderTable
            pos={pos}
            onView={(id) => navigate(`/purchase-orders/${id}`)}
            onEdit={(id) => navigate(`/purchase-orders/${id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
}
