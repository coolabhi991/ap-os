import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import PurchaseRequisitionFilters from "../../components/purchase-requisitions/PurchaseRequisitionFilters";
import PurchaseRequisitionTable from "../../components/purchase-requisitions/PurchaseRequisitionTable";

import { getPurchaseRequisitions, deletePurchaseRequisition } from "../../services/purchase-requisitions";
import { getProjects } from "../../services/projects";
import type { PurchaseRequisition } from "../../services/purchase-requisitions";

export default function PurchaseRequisitions() {
  const navigate = useNavigate();

  const [prs, setPRs] = useState<PurchaseRequisition[]>([]);
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
      const result = await getPurchaseRequisitions({
        search: search || undefined,
        status: statusFilter || undefined,
        projectId: projectFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setPRs(result.data);
    } catch {
      setError("Failed to load requisitions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter, projectFilter, fromDate, toDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this purchase requisition?")) return;
    try {
      await deletePurchaseRequisition(id);
      setPRs((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to delete.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Purchase Requisitions</h1>
            <p className="mt-2 text-slate-500">Create and manage material purchase requests.</p>
          </div>
          <button
            onClick={() => navigate("/purchase-requisitions/new")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            <Plus size={18} /> New Requisition
          </button>
        </div>

        <PurchaseRequisitionFilters
          search={search} onSearchChange={setSearch}
          statusFilter={statusFilter} onStatusChange={setStatusFilter}
          projectFilter={projectFilter} onProjectChange={setProjectFilter}
          projects={projects}
          fromDate={fromDate} onFromDateChange={setFromDate}
          toDate={toDate} onToDateChange={setToDate}
        />

        {loading && (
          <div className="rounded-xl border bg-white py-16 text-center text-slate-500 shadow-sm">Loading...</div>
        )}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        )}
        {!loading && !error && (
          <PurchaseRequisitionTable
            prs={prs}
            onView={(id) => navigate(`/purchase-requisitions/${id}`)}
            onEdit={(id) => navigate(`/purchase-requisitions/${id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
}
